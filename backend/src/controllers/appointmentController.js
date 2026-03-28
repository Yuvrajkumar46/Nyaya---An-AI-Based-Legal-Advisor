const { QueryTypes } = require('sequelize');
const sequelize = require('../config/db');
const { createNotification } = require('../utils/notification');

// ─── GET APPOINTMENTS ──────────────────────────────────────────────────────────
const getAppointments = async (req, res) => {
    const { status } = req.query; // 'upcoming', 'past', 'cancelled'
    const { id: userId, role } = req.user;

    try {
        let statusFilter = '';
        if (status === 'upcoming') statusFilter = "AND appointments.status IN ('scheduled', 'in_progress')";
        else if (status === 'past') statusFilter = "AND appointments.status IN ('completed', 'no_show')";
        else if (status === 'cancelled') statusFilter = "AND appointments.status = 'cancelled'";

        // If user is advocate, match advocate_id instead of user_id
        const roleFilter = role === 'advocate' ? 'appointments.advocate_id = :userId' : 'appointments.user_id = :userId';

        const query = `
            SELECT 
                appointments.appointment_id, appointments.appointment_type, appointments.scheduled_start_time, 
                appointments.scheduled_end_time, appointments.duration_minutes, appointments.status,
                appointments.amount, appointments.practice_area, appointments.appointment_notes,
                advocates.full_name AS advocate_name, advocates.id AS adv_internal_id,
                users.full_name AS user_name, users.avatar_url AS user_avatar
            FROM appointments
            LEFT JOIN advocates ON appointments.advocate_id = advocates.id
            LEFT JOIN users ON appointments.user_id = users.id
            WHERE ${roleFilter} ${statusFilter}
            ORDER BY appointments.scheduled_start_time ASC
        `;

        const appointments = await sequelize.query(query, {
            replacements: { userId },
            type: QueryTypes.SELECT
        });

        return res.status(200).json({ success: true, count: appointments.length, appointments });
    } catch (err) {
        console.error('Get appointments error:', err);
        return res.status(500).json({ success: false, message: 'Internal server error.' });
    }
};

// ─── GET SINGLE APPOINTMENT ──────────────────────────────────────────────────
const getAppointmentById = async (req, res) => {
    const { id } = req.params;
    try {
        const query = `
            SELECT a.*, adv.full_name as advocate_name, usr.full_name as user_name
            FROM appointments a
            LEFT JOIN advocates adv ON a.advocate_id = adv.id
            LEFT JOIN users usr ON a.user_id = usr.id
            WHERE a.appointment_id = :id
        `;
        const result = await sequelize.query(query, {
            replacements: { id },
            type: QueryTypes.SELECT
        });

        if (result.length === 0) return res.status(404).json({ success: false, message: 'Appointment not found.' });
        return res.status(200).json({ success: true, appointment: result[0] });
    } catch (err) {
        return res.status(500).json({ success: false, message: 'Internal server error.' });
    }
};

// ─── BOOK APPOINTMENT (ATOMIC TRANSACTION) ───────────────────────────────────
const bookAppointment = async (req, res) => {
    const { advocate_id, date, time_slot, call_type, duration_minutes, notes, practice_area } = req.body;
    const { id: userId } = req.user;

    // Calculate times
    const startTimeAsStr = `${date} ${time_slot}`;
    const start_time = new Date(startTimeAsStr);
    const end_time = new Date(start_time.getTime() + duration_minutes * 60000);

    // Mock Rate Calculation
    const ratePerHour = 2500;
    const amount = (duration_minutes / 60) * ratePerHour;
    const gst = amount * 0.18;
    const totalAmount = amount + gst;

    const t = await sequelize.transaction();

    try {
        // 1. Check Wallet Balance
        const userRow = await sequelize.query('SELECT wallet_balance FROM users WHERE id = :userId FOR UPDATE', {
            replacements: { userId },
            transaction: t,
            type: QueryTypes.SELECT
        });

        if (userRow.length === 0) throw new Error('User not found.');
        const currentBalance = parseFloat(userRow[0].wallet_balance);

        if (currentBalance < totalAmount) {
            await t.rollback();
            return res.status(400).json({
                success: false,
                message: 'Insufficient wallet balance.',
                required: totalAmount,
                current: currentBalance
            });
        }

        // 2. Deduct Wallet Balance
        await sequelize.query('UPDATE users SET wallet_balance = wallet_balance - :totalAmount WHERE id = :userId', {
            replacements: { totalAmount, userId },
            transaction: t,
            type: QueryTypes.UPDATE
        });

        // 3. Save Billing Transaction
        await sequelize.query(`
            INSERT INTO billing_transactions (user_id, amount, transaction_type, description, status) 
            VALUES (:userId, :totalAmount, 'debit', 'Appointment booking - Adv ID: ' || :advocate_id, 'completed')`,
            {
                replacements: { userId, totalAmount, advocate_id },
                transaction: t,
                type: QueryTypes.INSERT
            }
        );

        // 4. Generate Confirmation Code
        const confirmationNumber = Math.floor(10000000 + Math.random() * 90000000).toString();

        // 5. Save Appointment
        const insertAppt = await sequelize.query(`
            INSERT INTO appointments (
                appointment_id, user_id, advocate_id, appointment_type, scheduled_start_time, 
                scheduled_end_time, duration_minutes, status, appointment_notes, practice_area, 
                amount, confirmation_number
            ) VALUES (
                UUID(), :userId, :advocate_id, :call_type, :start_time, 
                :end_time, :duration, 'scheduled', :notes, :practice_area, 
                :totalAmount, :confirmationNumber
            )`,
            {
                replacements: {
                    userId, advocate_id, call_type, start_time: start_time.toISOString().slice(0, 19).replace('T', ' '),
                    end_time: end_time.toISOString().slice(0, 19).replace('T', ' '), duration: duration_minutes,
                    notes: notes || null, practice_area: practice_area || null,
                    totalAmount, confirmationNumber
                },
                transaction: t,
                type: QueryTypes.INSERT
            }
        );

        await t.commit();

        // Grab the newly inserted UUID
        const newAppt = await sequelize.query('SELECT appointment_id FROM appointments WHERE confirmation_number = :confirmationNumber', {
            replacements: { confirmationNumber },
            type: QueryTypes.SELECT
        });

        // Fetch Advocate Name for notification
        const advRows = await sequelize.query('SELECT full_name FROM advocates WHERE id = :advocate_id', {
            replacements: { advocate_id }, type: QueryTypes.SELECT
        });
        const advocateName = advRows[0]?.full_name || 'Advocate';

        // TRIGGER IN APPOINTMENTS AFTER BOOKING
        await createNotification(
            userId,
            'appointment_confirmed',
            'Appointment Booked',
            `Your appointment with Adv. ${advocateName} is confirmed for ${date}.`,
            '/appointments'
        );

        const remainingBalance = currentBalance - totalAmount;
        if (remainingBalance < 200) {
            await createNotification(
                userId,
                'low_balance',
                'Low Wallet Balance',
                'Your wallet balance is below ₹200. Add money to continue using services.',
                '/billing/add-money'
            );
        }

        return res.status(201).json({
            success: true,
            appointment_id: newAppt[0]?.appointment_id,
            confirmation_number: confirmationNumber,
            amount_charged: totalAmount,
            wallet_balance_remaining: currentBalance - totalAmount
        });
    } catch (err) {
        await t.rollback();
        console.error('Booking err:', err);
        return res.status(500).json({ success: false, message: 'Booking failed due to an internal error.' });
    }
};

// ─── RESCHEDULE APPOINTMENT ──────────────────────────────────────────────────
const rescheduleAppointment = async (req, res) => {
    const { id } = req.params;
    const { new_date, new_time_slot } = req.body;

    const startTimeAsStr = `${new_date} ${new_time_slot}`;
    const new_start_time = new Date(startTimeAsStr);

    try {
        const appt = await sequelize.query('SELECT duration_minutes, scheduled_start_time FROM appointments WHERE appointment_id = :id AND user_id = :userId', {
            replacements: { id, userId: req.user.id },
            type: QueryTypes.SELECT
        });

        if (appt.length === 0) return res.status(404).json({ success: false, message: 'Appointment not found.' });

        // Warning rules: Check if within 24 hours
        const diffHours = (new Date(appt[0].scheduled_start_time) - new Date()) / (1000 * 60 * 60);
        if (diffHours < 24) {
            // Usually we'd charge a fee here, ignoring for simplicity
        }

        const new_end_time = new Date(new_start_time.getTime() + appt[0].duration_minutes * 60000);

        await sequelize.query('UPDATE appointments SET scheduled_start_time = :new_start_time, scheduled_end_time = :new_end_time WHERE appointment_id = :id', {
            replacements: {
                new_start_time: new_start_time.toISOString().slice(0, 19).replace('T', ' '),
                new_end_time: new_end_time.toISOString().slice(0, 19).replace('T', ' '),
                id
            },
            type: QueryTypes.UPDATE
        });

        return res.status(200).json({ success: true, message: 'Appointment rescheduled successfully.', new_scheduled_time: new_start_time });
    } catch (err) {
        return res.status(500).json({ success: false, message: 'Internal server error.' });
    }
};

// ─── CANCEL APPOINTMENT ──────────────────────────────────────────────────────
const cancelAppointment = async (req, res) => {
    const { id } = req.params;
    const userId = req.user.id;

    const t = await sequelize.transaction();

    try {
        const appt = await sequelize.query('SELECT amount, scheduled_start_time, status FROM appointments WHERE appointment_id = :id AND user_id = :userId FOR UPDATE', {
            replacements: { id, userId },
            transaction: t,
            type: QueryTypes.SELECT
        });

        if (appt.length === 0) {
            await t.rollback();
            return res.status(404).json({ success: false, message: 'Appointment not found.' });
        }
        if (appt[0].status === 'cancelled') {
            await t.rollback();
            return res.status(400).json({ success: false, message: 'Already cancelled.' });
        }

        const apptTime = new Date(appt[0].scheduled_start_time);
        const diffHours = (apptTime - new Date()) / (1000 * 60 * 60);

        let refundAmount = 0;
        if (diffHours > 24) refundAmount = parseFloat(appt[0].amount); // 100% refund
        else if (diffHours >= 2) refundAmount = parseFloat(appt[0].amount) * 0.5; // 50% refund
        else refundAmount = 0; // 0% refund

        // Cancel
        await sequelize.query('UPDATE appointments SET status = \'cancelled\' WHERE appointment_id = :id', {
            replacements: { id }, transaction: t, type: QueryTypes.UPDATE
        });

        let newBalanceStr = 0;
        if (refundAmount > 0) {
            await sequelize.query('UPDATE users SET wallet_balance = wallet_balance + :refundAmount WHERE id = :userId', {
                replacements: { refundAmount, userId }, transaction: t, type: QueryTypes.UPDATE
            });

            await sequelize.query(`INSERT INTO billing_transactions (user_id, amount, transaction_type, description, status) 
                VALUES (:userId, :refundAmount, 'credit', 'Appointment Cancellation Refund', 'completed')`, {
                replacements: { userId, refundAmount }, transaction: t, type: QueryTypes.INSERT
            });
        }

        const balRow = await sequelize.query('SELECT wallet_balance FROM users WHERE id = :userId', { replacements: { userId }, transaction: t, type: QueryTypes.SELECT });
        newBalanceStr = balRow[0].wallet_balance;

        await t.commit();
        return res.status(200).json({ success: true, message: 'Appointment cancelled.', refund_amount: refundAmount, new_wallet_balance: newBalanceStr });
    } catch (err) {
        await t.rollback();
        console.error(err);
        return res.status(500).json({ success: false, message: 'Internal server error.' });
    }
};

// ─── GET ADVOCATE AVAILABILITY ───────────────────────────────────────────────
const getAdvocateAvailability = async (req, res) => {
    const { id } = req.params; // Advocate ID
    const { date } = req.query; // YYYY-MM-DD

    try {
        // Mocked response for UI building - normally we'd check against `appointments` table for overlapping times
        const allSlots = ['09:00:00', '10:00:00', '11:00:00', '14:00:00', '15:00:00', '16:00:00'];

        // Find booked slots
        const booked = await sequelize.query(`
            SELECT TIME(scheduled_start_time) as start_time 
            FROM appointments 
            WHERE advocate_id = :id AND DATE(scheduled_start_time) = :date AND status IN ('scheduled', 'in_progress')
        `, {
            replacements: { id, date },
            type: QueryTypes.SELECT
        });

        const bookedStr = booked.map(b => b.start_time);
        const available_slots = allSlots.map(slot => ({
            time: slot,
            available: !bookedStr.includes(slot)
        }));

        return res.status(200).json({ success: true, date, available_slots });
    } catch (err) {
        return res.status(500).json({ success: false, message: 'Internal server error.' });
    }
};

module.exports = {
    getAppointments,
    getAppointmentById,
    bookAppointment,
    rescheduleAppointment,
    cancelAppointment,
    getAdvocateAvailability
};
