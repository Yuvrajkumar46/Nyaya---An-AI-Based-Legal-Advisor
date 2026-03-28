const { QueryTypes } = require('sequelize');
const sequelize = require('../config/db');
const bcrypt = require('bcryptjs');

// ─── GET PAGINATED USERS WITH STATS ─────────────────────────────────────────
exports.getUsers = async (req, res) => {
    try {
        const { search, status, role, sort, page = 1, limit = 10 } = req.query;
        const offset = (page - 1) * limit;

        let whereClauses = ['is_deleted = 0'];
        let replacements = { limit: parseInt(limit), offset: parseInt(offset) };

        if (search) {
            whereClauses.push('(full_name LIKE :search OR username LIKE :search OR phone LIKE :search)');
            replacements.search = `%${search}%`;
        }

        if (status && status !== 'All') {
            whereClauses.push('is_active = :isActive');
            replacements.isActive = status.toLowerCase() === 'active' ? 1 : 0;
        }

        if (role && role !== 'All') {
            whereClauses.push('role = :role');
            replacements.role = role.toLowerCase();
        }

        const whereString = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

        let orderString = 'ORDER BY created_at DESC';
        if (sort === 'Oldest') orderString = 'ORDER BY created_at ASC';
        if (sort === 'Name') orderString = 'ORDER BY full_name ASC';
        if (sort === 'Wallet') orderString = 'ORDER BY wallet_balance DESC';

        const usersQuery = `
            SELECT id, user_id, username, full_name, phone, role, wallet_balance, is_active, last_login_at, created_at 
            FROM users 
            ${whereString} 
            ${orderString} 
            LIMIT :limit OFFSET :offset`;

        const users = await sequelize.query(usersQuery, { replacements, type: QueryTypes.SELECT });

        const countQuery = `SELECT COUNT(*) as total FROM users ${whereString}`;
        const [countRow] = await sequelize.query(countQuery, { replacements, type: QueryTypes.SELECT });

        res.status(200).json({
            success: true,
            users,
            total: countRow.total,
            page: parseInt(page),
            totalPages: Math.ceil(countRow.total / limit)
        });
    } catch (error) {
        console.error('Error fetching users:', error);
        res.status(500).json({ success: false, message: 'Server error fetching users' });
    }
};

// ─── GET GLOBAL USER STATS ────────────────────────────────────────────────────
exports.getUserStats = async (req, res) => {
    try {
        const [stats] = await sequelize.query(`
            SELECT 
                COUNT(*) as total,
                SUM(CASE WHEN is_active = 1 THEN 1 ELSE 0 END) as active,
                SUM(CASE WHEN is_active = 0 THEN 1 ELSE 0 END) as suspended,
                SUM(CASE WHEN DATE(created_at) = CURDATE() THEN 1 ELSE 0 END) as new_today
            FROM users
            WHERE is_deleted = 0
        `, { type: QueryTypes.SELECT });

        res.status(200).json({
            success: true,
            stats: {
                total: parseInt(stats.total) || 0,
                active: parseInt(stats.active) || 0,
                suspended: parseInt(stats.suspended) || 0,
                new_today: parseInt(stats.new_today) || 0
            }
        });
    } catch (error) {
        console.error('Error fetching stats:', error);
        res.status(500).json({ success: false, message: 'Server error fetching stats' });
    }
};

// ─── GET SINGLE USER DETAILS ──────────────────────────────────────────────────
exports.getUserDetails = async (req, res) => {
    try {
        const { id } = req.params;

        const [user] = await sequelize.query(`
            SELECT id, user_id, username, email, full_name, phone, role, wallet_balance, is_active, last_login_at, created_at 
            FROM users 
            WHERE user_id = :id AND is_deleted = 0
        `, { replacements: { id }, type: QueryTypes.SELECT });

        if (!user) return res.status(404).json({ success: false, message: 'User not found' });

        const [totalSpentRow] = await sequelize.query(`
            SELECT SUM(amount) as total_spent FROM billing_transactions WHERE user_id = :id AND transaction_type = 'debit' AND status = 'completed'
        `, { replacements: { id }, type: QueryTypes.SELECT });

        const [appointmentsCountRow] = await sequelize.query(`
            SELECT COUNT(*) as appointments_count FROM appointments WHERE user_id = :id
        `, { replacements: { id }, type: QueryTypes.SELECT });

        user.total_spent = totalSpentRow.total_spent || 0;
        user.appointments_count = appointmentsCountRow.appointments_count || 0;

        // Fetch recent activity
        const recentActivity = await sequelize.query(`
            SELECT status, failure_reason, ip_address, login_time 
            FROM login_audit_log 
            WHERE user_id = :id OR username_attempted = :username
            ORDER BY login_time DESC LIMIT 5
        `, { replacements: { id, username: user.username }, type: QueryTypes.SELECT });

        res.status(200).json({ success: true, user, activity: recentActivity });
    } catch (error) {
        console.error('Error fetching user details:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// ─── EDIT / UPDATE USER ───────────────────────────────────────────────────────
exports.updateUser = async (req, res) => {
    const t = await sequelize.transaction();
    try {
        const { id } = req.params;
        const { full_name, role, is_active, wallet_balance, phone, new_password } = req.body;
        const adminId = req.admin.id;

        const [user] = await sequelize.query('SELECT wallet_balance FROM users WHERE user_id = :id AND is_deleted = 0 FOR UPDATE',
            { replacements: { id }, transaction: t, type: QueryTypes.SELECT });

        if (!user) {
            await t.rollback();
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        let updates = ['full_name = :full_name', 'role = :role', 'is_active = :is_active', 'phone = :phone', 'wallet_balance = :wallet_balance'];
        let replacements = { full_name, role, is_active: (is_active ? 1 : 0), phone: phone || null, wallet_balance: wallet_balance || 0, id };

        if (new_password) {
            updates.push('password_hash = :password_hash');
            replacements.password_hash = await bcrypt.hash(new_password, 12);
        }

        await sequelize.query(`UPDATE users SET ${updates.join(', ')} WHERE user_id = :id`,
            { replacements, transaction: t, type: QueryTypes.UPDATE });

        // Log wallet adjustment if it changed
        const oldWallet = parseFloat(user.wallet_balance);
        const newWallet = parseFloat(wallet_balance || 0);

        if (oldWallet !== newWallet) {
            const diff = Math.abs(newWallet - oldWallet);
            const tType = newWallet > oldWallet ? 'credit' : 'debit';

            await sequelize.query(`
                INSERT INTO billing_transactions (user_id, amount, transaction_type, description, payment_method, status)
                VALUES (:userId, :amount, :type, 'Admin wallet adjustment', 'system', 'completed')
            `, {
                replacements: { userId: id, amount: diff, type: tType },
                transaction: t, type: QueryTypes.INSERT
            });
        }

        // Audit log
        await sequelize.query(`
            INSERT INTO admin_audit_log (admin_id, action_type, entity_type, entity_id, action_details, ip_address)
            VALUES (:adminId, 'UPDATE', 'user', :id, 'Updated user profile', :ip)
        `, { replacements: { adminId, id, ip: req.ip }, transaction: t, type: QueryTypes.INSERT });

        await t.commit();
        res.status(200).json({ success: true, message: 'User updated successfully' });
    } catch (error) {
        await t.rollback();
        console.error('Error updating user:', error);
        res.status(500).json({ success: false, message: 'Server error updating user' });
    }
};

// ─── ADD NEW USER ─────────────────────────────────────────────────────────────
exports.createUser = async (req, res) => {
    const t = await sequelize.transaction();
    try {
        const { full_name, username, phone, role, password, wallet_balance } = req.body;
        const adminId = req.admin.id;

        const [existing] = await sequelize.query('SELECT id FROM users WHERE username = :username',
            { replacements: { username }, transaction: t, type: QueryTypes.SELECT });

        if (existing) {
            await t.rollback();
            return res.status(400).json({ success: false, message: 'Username already taken' });
        }

        const passHash = await bcrypt.hash(password, 12);
        const fakeEmail = `${username}_${Date.now()}@temp.local`;

        const result = await sequelize.query(`
            INSERT INTO users (username, full_name, phone, role, password_hash, wallet_balance, email)
            VALUES (:username, :full_name, :phone, :role, :passHash, :wallet_balance, :fakeEmail)
        `, {
            replacements: { username, full_name, phone, role, passHash, wallet_balance: wallet_balance || 0, fakeEmail },
            transaction: t,
            type: QueryTypes.INSERT
        });

        const newId = result[0];

        if (parseFloat(wallet_balance) > 0) {
            await sequelize.query(`
                INSERT INTO billing_transactions (user_id, amount, transaction_type, description, payment_method, status)
                VALUES (:userId, :amount, 'credit', 'Initial Admin Balance', 'system', 'completed')
            `, {
                replacements: { userId: newId, amount: wallet_balance },
                transaction: t, type: QueryTypes.INSERT
            });
        }

        // Audit log
        await sequelize.query(`
            INSERT INTO admin_audit_log (admin_id, action_type, entity_type, entity_id, action_details, ip_address)
            VALUES (:adminId, 'CREATE', 'user', :id, 'Created new user manually', :ip)
        `, { replacements: { adminId, id: newId, ip: req.ip }, transaction: t, type: QueryTypes.INSERT });

        await t.commit();
        res.status(201).json({ success: true, message: 'User created successfully' });
    } catch (error) {
        await t.rollback();
        console.error('Error creating user:', error);
        res.status(500).json({ success: false, message: 'Server error creating user' });
    }
};

// ─── TOGGLE SUSPEND ───────────────────────────────────────────────────────────
exports.toggleSuspend = async (req, res) => {
    try {
        const { id } = req.params;
        const adminId = req.admin.id;

        const [user] = await sequelize.query('SELECT is_active FROM users WHERE user_id = :id AND is_deleted = 0',
            { replacements: { id }, type: QueryTypes.SELECT });

        if (!user) return res.status(404).json({ success: false, message: 'User not found' });

        const newState = user.is_active ? 0 : 1;

        await sequelize.query('UPDATE users SET is_active = :newState WHERE user_id = :id',
            { replacements: { newState, id }, type: QueryTypes.UPDATE });

        await sequelize.query(`
            INSERT INTO admin_audit_log (admin_id, action_type, entity_type, entity_id, action_details, ip_address)
            VALUES (:adminId, '${newState ? 'UNSUSPEND' : 'SUSPEND'}', 'user', :id, 'Toggled suspension state', :ip)
        `, { replacements: { adminId, id, ip: req.ip }, type: QueryTypes.INSERT });

        res.status(200).json({ success: true, message: `User ${newState ? 'unsuspended' : 'suspended'} successfully`, is_active: newState });
    } catch (error) {
        console.error('Error toggling suspend:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// ─── DELETE USER (SOFT DELETE) ────────────────────────────────────────────────
exports.deleteUser = async (req, res) => {
    try {
        const { id } = req.params;
        const adminId = req.admin.id;

        const [user] = await sequelize.query('SELECT id FROM users WHERE user_id = :id AND is_deleted = 0',
            { replacements: { id }, type: QueryTypes.SELECT });

        if (!user) return res.status(404).json({ success: false, message: 'User not found' });

        await sequelize.query('UPDATE users SET is_deleted = 1, is_active = 0 WHERE user_id = :id',
            { replacements: { id }, type: QueryTypes.UPDATE });

        await sequelize.query(`
            INSERT INTO admin_audit_log (admin_id, action_type, entity_type, entity_id, action_details, ip_address)
            VALUES (:adminId, 'DELETE', 'user', :id, 'Soft deleted user', :ip)
        `, { replacements: { adminId, id, ip: req.ip }, type: QueryTypes.INSERT });

        res.status(200).json({ success: true, message: 'User deleted successfully' });
    } catch (error) {
        console.error('Error deleting user:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};
