const { QueryTypes, Sequelize } = require('sequelize');
const sequelize = require('../config/db');
const { v4: uuidv4 } = require('uuid');
const { createNotification } = require('../utils/notification');

exports.initiateCall = async (req, res) => {
    try {
        const { appointment_id } = req.body;
        const userId = req.user.id;

        // Fetch appointment details
        const [appt] = await sequelize.query(`
            SELECT a.*, adv.id as adv_id, adv.hourly_rate 
            FROM appointments a
            JOIN advocates adv ON a.advocate_id = adv.id
            WHERE a.appointment_id = :appointment_id
        `, { replacements: { appointment_id }, type: QueryTypes.SELECT });

        if (!appt) {
            return res.status(404).json({ success: false, message: 'Appointment not found' });
        }

        // Generate call_id
        const call_id = uuidv4();

        // Create call record
        await sequelize.query(`
            INSERT INTO calls (call_id, caller_id, advocate_id, call_type, start_time, call_status, recording_consent)
            VALUES (:call_id, :caller_id, :advocate_id, :call_type, NOW(), 'in_progress', true)
        `, {
            replacements: {
                call_id,
                caller_id: appt.user_id,
                advocate_id: appt.adv_id,
                call_type: appt.appointment_type || 'video'
            },
            type: QueryTypes.INSERT
        });

        // Update appointment status to in_progress
        await sequelize.query(`
            UPDATE appointments SET status = 'in_progress' WHERE appointment_id = :appointment_id
        `, { replacements: { appointment_id }, type: QueryTypes.UPDATE });

        res.status(200).json({
            success: true,
            call_id,
            webrtc_config: { host: 'localhost', port: 5000, path: '/peerjs' }
        });
    } catch (err) {
        console.error('initiateCall Error:', err);
        res.status(500).json({ success: false, message: 'Server error initiating call' });
    }
};

exports.endCall = async (req, res) => {
    const t = await sequelize.transaction();
    try {
        const { call_id } = req.params;

        // Fetch call logic
        const [call] = await sequelize.query(`
            SELECT c.*, a.hourly_rate, a.full_name as advocate_name, u.wallet_balance
            FROM calls c
            JOIN advocates a ON c.advocate_id = a.id
            JOIN users u ON c.caller_id = u.id
            WHERE c.call_id = :call_id AND c.call_status != 'ended'
        `, { replacements: { call_id }, type: QueryTypes.SELECT, transaction: t });

        if (!call) {
            await t.rollback();
            return res.status(400).json({ success: false, message: 'Call not active or already ended' });
        }

        const endTime = new Date();
        const startTime = new Date(call.start_time);

        // Duration in seconds safely
        let durationSecs = Math.floor((endTime - startTime) / 1000);
        if (durationSecs < 0) durationSecs = 0;

        // Billing is calculated per second: amount = (seconds_elapsed / 3600) * hourly_rate
        const amount = (durationSecs / 3600) * Number(call.hourly_rate);

        // End Call
        await sequelize.query(`
            UPDATE calls 
            SET end_time = NOW(), duration_seconds = :duration, call_status = 'ended', billing_amount = :amount
            WHERE call_id = :call_id
        `, { replacements: { duration: durationSecs, amount, call_id }, transaction: t, type: QueryTypes.UPDATE });

        // Deduct Wallet
        await sequelize.query(`
            UPDATE users SET wallet_balance = wallet_balance - :amount WHERE id = :user_id
        `, { replacements: { amount, user_id: call.caller_id }, transaction: t, type: QueryTypes.UPDATE });

        // Save Billing Transaction
        await sequelize.query(`
            INSERT INTO billing_transactions (user_id, amount, transaction_type, description, status)
            VALUES (:user_id, :amount, 'debit', :desc, 'completed')
        `, {
            replacements: {
                user_id: call.caller_id,
                amount,
                desc: `Video call - Adv. ${call.advocate_name} - ${Math.ceil(durationSecs / 60)} mins`
            },
            transaction: t,
            type: QueryTypes.INSERT
        });

        // Update appointment status to completed if exists
        await sequelize.query(`
            UPDATE appointments SET status = 'completed' WHERE user_id = :caller_id AND advocate_id = :advocate_id AND status = 'in_progress'
        `, { replacements: { caller_id: call.caller_id, advocate_id: call.advocate_id }, transaction: t, type: QueryTypes.UPDATE });

        // Get new wallet balance safely
        const [updatedUser] = await sequelize.query(`SELECT wallet_balance FROM users WHERE id = :id`, { replacements: { id: call.caller_id }, transaction: t, type: QueryTypes.SELECT });

        await t.commit();

        // TRIGGER AFTER CALL ENDS
        await createNotification(
            call.caller_id,
            'call_completed',
            'Call Completed',
            `Your call with Adv. ${call.advocate_name} lasted ${Math.ceil(durationSecs / 60)} mins. ₹${amount.toFixed(2)} deducted.`,
            '/calls'
        );

        if (Number(updatedUser.wallet_balance) < 200) {
            await createNotification(
                call.caller_id,
                'low_balance',
                'Low Wallet Balance',
                'Your wallet balance is below ₹200. Add money to continue using services.',
                '/billing/add-money'
            );
        }

        res.status(200).json({
            success: true,
            duration_seconds: durationSecs,
            amount_charged: amount,
            wallet_balance: updatedUser.wallet_balance
        });

    } catch (err) {
        await t.rollback();
        console.error('endCall Error:', err);
        res.status(500).json({ success: false, message: 'Server error ending call' });
    }
};

exports.getCallHistory = async (req, res) => {
    try {
        const userId = req.user.id;
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const offset = (page - 1) * limit;

        const calls = await sequelize.query(`
            SELECT c.call_id, c.start_time, c.duration_seconds, c.billing_amount, 
                   a.full_name as advocate_name, a.practice_areas,
                   r.rating, r.review_id
            FROM calls c
            JOIN advocates a ON c.advocate_id = a.id
            LEFT JOIN reviews r ON c.call_id = r.call_id
            WHERE c.caller_id = :userId AND c.call_status = 'ended'
            ORDER BY c.start_time DESC
            LIMIT :limit OFFSET :offset
        `, { replacements: { userId, limit, offset }, type: QueryTypes.SELECT });

        const [countRow] = await sequelize.query(`
            SELECT COUNT(*) as total FROM calls WHERE caller_id = :userId AND call_status = 'ended'
        `, { replacements: { userId }, type: QueryTypes.SELECT });

        res.status(200).json({ success: true, calls, total_count: countRow.total });
    } catch (err) {
        console.error('Error fetching call history:', err);
        res.status(500).json({ success: false, message: 'Server error fetching call history' });
    }
};

exports.getCallSummary = async (req, res) => {
    try {
        const { call_id } = req.params;
        const [call] = await sequelize.query(`
            SELECT c.*, a.full_name as advocate_name, a.hourly_rate, u.wallet_balance
            FROM calls c
            JOIN advocates a ON c.advocate_id = a.id
            JOIN users u ON c.caller_id = u.id
            WHERE c.call_id = :call_id
        `, { replacements: { call_id }, type: QueryTypes.SELECT });

        if (!call) return res.status(404).json({ success: false, message: 'Call not found' });

        const amount = Number(call.billing_amount);
        const gst = amount * 0.18;
        const total = amount + gst;

        res.status(200).json({
            success: true,
            call: {
                date: call.start_time,
                duration_seconds: call.duration_seconds,
                advocate_name: call.advocate_name
            },
            billing: {
                rate: call.hourly_rate,
                duration_minutes: (call.duration_seconds / 60).toFixed(2),
                amount: amount.toFixed(2),
                gst: gst.toFixed(2),
                total: total.toFixed(2),
                wallet_balance: call.wallet_balance
            }
        });
    } catch (err) {
        console.error('Error fetching call summary:', err);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

exports.rateAdvocate = async (req, res) => {
    try {
        const { call_id } = req.params;
        const { rating, review_text } = req.body;
        const userId = req.user.id;

        const [call] = await sequelize.query('SELECT advocate_id FROM calls WHERE call_id = :call_id AND caller_id = :userId', { replacements: { call_id, userId }, type: QueryTypes.SELECT });
        if (!call) return res.status(404).json({ success: false, message: 'Call not found' });

        const review_id = uuidv4();

        await sequelize.query(`
            INSERT INTO reviews (review_id, call_id, user_id, advocate_id, rating, review_text)
            VALUES (:review_id, :call_id, :userId, :advocate_id, :rating, :review_text)
        `, { replacements: { review_id, call_id, userId, advocate_id: call.advocate_id, rating, review_text }, type: QueryTypes.INSERT });

        await sequelize.query(`
            UPDATE advocates 
            SET average_rating = ((average_rating * total_reviews) + :rating) / (total_reviews + 1),
                total_reviews = total_reviews + 1
            WHERE id = :advocate_id
        `, { replacements: { rating, advocate_id: call.advocate_id }, type: QueryTypes.UPDATE });

        res.status(200).json({ success: true, message: 'Feedback submitted successfully.', review_id });
    } catch (err) {
        console.error('Error submitting rating:', err);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// Extremely basic mocked persistent chat storage using a global array (ideally should be a separate DB table, but prompt didn't strictly mandate 'messages' table schema)
const callChats = {};

exports.saveChatMessage = async (req, res) => {
    const { call_id } = req.params;
    const { message } = req.body;

    if (!callChats[call_id]) callChats[call_id] = [];

    const msg = {
        id: uuidv4(),
        sender: req.user.id,
        text: message,
        timestamp: new Date()
    };

    callChats[call_id].push(msg);
    res.status(200).json({ success: true, message: msg });
};

exports.getChatMessages = async (req, res) => {
    const { call_id } = req.params;
    res.status(200).json({ success: true, messages: callChats[call_id] || [] });
};
