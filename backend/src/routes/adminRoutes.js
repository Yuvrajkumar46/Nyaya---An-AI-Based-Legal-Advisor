const express = require('express');
const { body, validationResult } = require('express-validator');
const jwt = require('jsonwebtoken');
const adminUsersController = require('../controllers/adminUsersController');
const sequelize = require('../config/db');
const { QueryTypes } = require('sequelize');


const router = express.Router();

/**
 * Admin JWT Middleware — tries ADMIN_JWT_SECRET then JWT_SECRET as fallback.
 */
const authenticateAdminMock = (req, res, next) => {
  const authHeader = req.headers['authorization'] || req.header('Authorization');
  console.log('[AdminAuth] Header:', authHeader?.substring(0, 60) || 'MISSING');

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, message: 'Invalid or expired access token.' });
  }

  const token = authHeader.split(' ')[1];
  let decoded = null;

  // Try ADMIN_JWT_SECRET first
  const adminSecret = process.env.ADMIN_JWT_SECRET || 'super_secret_nyaya_admin_key_2026_xyz';
  try {
    decoded = jwt.verify(token, adminSecret);
    console.log('[AdminAuth] Verified with ADMIN_JWT_SECRET. Role:', decoded.role);
  } catch (e1) {
    console.log('[AdminAuth] ADMIN_JWT_SECRET failed:', e1.message, '— trying JWT_SECRET...');
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET || 'your_super_secret_jwt_key_change_this_in_production');
      console.log('[AdminAuth] Verified with JWT_SECRET. Role:', decoded.role);
    } catch (e2) {
      console.log('[AdminAuth] Both secrets failed:', e2.message);
      return res.status(401).json({ success: false, message: 'Invalid or expired access token.' });
    }
  }

  if (decoded.role && decoded.role !== 'admin') {
    console.log('[AdminAuth] WARNING: token role is', decoded.role, '(not admin) — allowing through for debug');
  }

  req.admin = decoded;
  req.user = decoded;
  next();
};

const db = require('../config/db');

router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    console.log('Admin login attempt:', username);

    const [[admin]] = await db.query(
      `SELECT * FROM users 
       WHERE username = :username 
       AND role = 'admin'`,
      { replacements: { username: username.trim().toLowerCase() } }
    );

    if (!admin) {
      return res.status(401).json({
        message: 'Invalid admin credentials'
      });
    }

    const bcrypt = require('bcryptjs');
    const valid = await bcrypt.compare(password, admin.password_hash);
    if (!valid) {
      return res.status(401).json({
        message: 'Invalid admin credentials'
      });
    }

    const jwt = require('jsonwebtoken');
    const token = jwt.sign(
      {
        user_id: admin.user_id,
        username: admin.username,
        role: 'admin'
      },
      process.env.ADMIN_JWT_SECRET || process.env.JWT_SECRET || 'fallback_secret',
      { expiresIn: '8h' }
    );

    console.log('Admin login SUCCESS:', username);

    res.json({
      success: true,
      access_token: token,
      user: {
        user_id: admin.user_id,
        username: admin.username,
        full_name: admin.full_name,
        role: 'admin'
      }
    });

  } catch (err) {
    console.error('Admin login error:', err);
    res.status(500).json({ message: 'Server error: ' + err.message });
  }
});

// Also expose /auth/login just in case older frontend components call it
router.post('/auth/login', async (req, res) => {
  // Directly call the handler above since we don't have next() passed directly
  req.url = '/login';
  router.handle(req, res, () => { });
});

// ─── OPEN USER ROUTES (no auth — data verification phase) ───────────────────

router.get('/users', async (req, res) => {
  try {
    const { search = '', status = 'all', role = 'all', page = 1, limit = 10 } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);

    let whereClauses = ['is_deleted = 0'];
    let replacements = { limit: parseInt(limit), offset: parseInt(offset) };

    if (search && search.trim()) {
      whereClauses.push('(full_name LIKE :search OR username LIKE :search OR phone LIKE :search)');
      replacements.search = `%${search.trim()}%`;
    }
    if (status === 'active') { whereClauses.push('is_active = 1'); }
    if (status === 'suspended') { whereClauses.push('is_active = 0'); }
    if (role !== 'all') { whereClauses.push('role = :role'); replacements.role = role; }

    const whereStr = whereClauses.length ? `WHERE ${whereClauses.join(' AND ')}` : '';

    const users = await sequelize.query(
      `SELECT user_id, username, full_name, phone, role, wallet_balance, is_active, created_at
             FROM users ${whereStr} ORDER BY created_at DESC LIMIT :limit OFFSET :offset`,
      { replacements, type: QueryTypes.SELECT }
    );

    const [countRow] = await sequelize.query(
      `SELECT COUNT(*) as total FROM users ${whereStr}`, { replacements, type: QueryTypes.SELECT }
    );
    const [statsRow] = await sequelize.query(
      `SELECT
               COUNT(*) as total,
               SUM(CASE WHEN is_active=1 THEN 1 ELSE 0 END) as active,
               SUM(CASE WHEN is_active=0 THEN 1 ELSE 0 END) as suspended,
               SUM(CASE WHEN DATE(created_at)=CURDATE() THEN 1 ELSE 0 END) as new_today
             FROM users WHERE is_deleted=0`,
      { type: QueryTypes.SELECT }
    );

    console.log(`[GET /users] Returning ${users.length} of ${countRow.total} users`);

    res.json({
      success: true,
      users,
      total_pages: Math.ceil(countRow.total / parseInt(limit)),
      stats: {
        total: parseInt(statsRow.total) || 0,
        active: parseInt(statsRow.active) || 0,
        suspended: parseInt(statsRow.suspended) || 0,
        new_today: parseInt(statsRow.new_today) || 0
      }
    });
  } catch (err) {
    console.error('[GET /users] Error:', err.message);
    res.status(500).json({ success: false, message: err.message });
  }
});

router.get('/users/stats', async (req, res) => {
  try {
    const [stats] = await sequelize.query(
      `SELECT COUNT(*) as total,
               SUM(CASE WHEN is_active=1 THEN 1 ELSE 0 END) as active,
               SUM(CASE WHEN is_active=0 THEN 1 ELSE 0 END) as suspended,
               SUM(CASE WHEN DATE(created_at)=CURDATE() THEN 1 ELSE 0 END) as new_today
             FROM users WHERE is_deleted=0`,
      { type: QueryTypes.SELECT }
    );
    res.json({
      success: true, stats: {
        total: parseInt(stats.total) || 0, active: parseInt(stats.active) || 0,
        suspended: parseInt(stats.suspended) || 0, new_today: parseInt(stats.new_today) || 0
      }
    });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

router.put('/users/:id/suspend', async (req, res) => {
  try {
    const [user] = await sequelize.query(
      'SELECT is_active FROM users WHERE user_id = :id AND is_deleted = 0',
      { replacements: { id: req.params.id }, type: QueryTypes.SELECT }
    );
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    await sequelize.query('UPDATE users SET is_active = :s WHERE user_id = :id',
      { replacements: { s: user.is_active ? 0 : 1, id: req.params.id }, type: QueryTypes.UPDATE }
    );
    res.json({ success: true });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

router.delete('/users/:id', async (req, res) => {
  try {
    await sequelize.query('UPDATE users SET is_deleted=1, is_active=0 WHERE user_id=:id',
      { replacements: { id: req.params.id }, type: QueryTypes.UPDATE }
    );
    res.json({ success: true });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

router.post('/users', async (req, res) => {
  try {
    const { full_name, username, phone, role, password, wallet_balance } = req.body;
    const bcrypt = require('bcryptjs');
    const { v4: uuidv4 } = require('uuid');
    const [existing] = await sequelize.query('SELECT user_id FROM users WHERE username=:u',
      { replacements: { u: username }, type: QueryTypes.SELECT }
    );
    if (existing) return res.status(400).json({ message: 'Username already exists' });
    const hash = await bcrypt.hash(password, 12);
    const uid = uuidv4();
    const email = `${username}_${Date.now()}@temp.local`;
    await sequelize.query(
      `INSERT INTO users (user_id,username,full_name,phone,email,password_hash,role,is_active,wallet_balance)
             VALUES (:uid,:username,:full_name,:phone,:email,:hash,:role,1,:wallet)`,
      { replacements: { uid, username, full_name, phone: phone || null, email, hash, role: role || 'user', wallet: wallet_balance || 0 }, type: QueryTypes.INSERT }
    );
    res.json({ success: true, message: 'User created', user_id: uid });
  } catch (err) { res.status(500).json({ message: err.message }); }
});
// ─── END OPEN USER ROUTES ────────────────────────────────────────────────────

router.get('/calls', async (req, res) => {
  try {
    const { search = '', status = 'all', date = 'all', page = 1, limit = 10 } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);

    let where = 'WHERE 1=1';
    const p = [];

    if (search) {
      where += ` AND (
        u.full_name LIKE ? OR u.username LIKE ? OR
        a.full_name LIKE ?
      )`;
      p.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }

    if (status !== 'all') {
      let dbStatus = status;
      if (status === 'completed') dbStatus = 'ended';
      else if (status === 'active') dbStatus = 'connected'; // ringing and initiated might also be considered active
      else if (status === 'ongoing') dbStatus = 'ringing';
      if (status === 'active') {
        where += " AND c.call_status IN ('connected', 'initiated', 'ringing')";
      } else {
        where += ' AND c.call_status = ?';
        p.push(dbStatus);
      }
    }
    if (date === 'today') {
      where += ' AND DATE(c.start_time) = CURDATE()';
    } else if (date === 'week') {
      where += ' AND c.start_time >= DATE_SUB(NOW(), INTERVAL 7 DAY)';
    } else if (date === 'month') {
      where += ' AND c.start_time >= DATE_SUB(NOW(), INTERVAL 30 DAY)';
    }

    const calls = await sequelize.query(
      `SELECT
        c.call_id, 
        CASE 
          WHEN c.call_status = 'ended' THEN 'completed'
          WHEN c.call_status = 'connected' THEN 'active'
          WHEN c.call_status = 'ringing' THEN 'ongoing'
          WHEN c.call_status = 'initiated' THEN 'ongoing'
          ELSE c.call_status
        END as status,
        c.start_time as started_at, 
        c.end_time as ended_at,
        c.duration_seconds, 
        c.billing_amount as amount_charged, 
        a.hourly_rate,
        u.full_name as user_name, u.username,
        a.full_name as advocate_name
       FROM calls c
       LEFT JOIN users u ON c.caller_id = u.id
       LEFT JOIN advocates a ON c.advocate_id = a.id
       ${where}
       ORDER BY c.start_time DESC
       LIMIT ? OFFSET ?`,
      { replacements: [...p, parseInt(limit), parseInt(offset)], type: QueryTypes.SELECT }
    );

    const [{ total }] = await sequelize.query(
      `SELECT COUNT(*) as total FROM calls c
       LEFT JOIN users u ON c.caller_id = u.id
       LEFT JOIN advocates a ON c.advocate_id = a.id
       ${where}`,
      { replacements: p, type: QueryTypes.SELECT }
    );

    const [{ total_calls }] = await sequelize.query(
      `SELECT COUNT(*) as total_calls FROM calls`, { type: QueryTypes.SELECT }
    );
    const [{ active_calls }] = await sequelize.query(
      `SELECT COUNT(*) as active_calls FROM calls WHERE call_status IN ('connected', 'ringing', 'initiated')`, { type: QueryTypes.SELECT }
    );
    const [{ total_revenue }] = await sequelize.query(
      `SELECT COALESCE(SUM(billing_amount),0) as total_revenue FROM calls WHERE call_status='ended'`, { type: QueryTypes.SELECT }
    );
    const [{ avg_duration }] = await sequelize.query(
      `SELECT COALESCE(AVG(duration_seconds),0) as avg_duration FROM calls WHERE call_status='ended'`, { type: QueryTypes.SELECT }
    );

    res.json({
      success: true,
      calls,
      total_pages: Math.ceil(total / parseInt(limit)),
      stats: {
        total_calls,
        active_calls,
        total_revenue,
        avg_duration: Math.round(avg_duration)
      }
    });

  } catch (err) {
    console.error('GET /calls error:', err);
    res.status(500).json({ message: err.message });
  }
});

/**
 * GET /api/v1/admin/advocates (Moved ABOVE auth middleware temporarily)
 */
router.get('/advocates', async (req, res) => {
  try {
    const { status, search } = req.query;
    
    let whereClause = 'WHERE 1=1';
    const replacements = {};

    if (status && status !== 'All' && status !== 'all') {
      whereClause += ' AND verification_status = :status';
      replacements.status = status.toLowerCase();
    }
    if (search && search.trim()) {
      whereClause += ' AND (full_name LIKE :search OR email LIKE :search)';
      replacements.search = `%${search.trim()}%`;
    }

    const advocates = await sequelize.query(
      `SELECT id, full_name, email, city, state,
              practice_areas, experience_years,
              hourly_rate, verification_status,
              is_active, created_at
       FROM advocates 
       ${whereClause}
       ORDER BY created_at DESC`,
      { replacements, type: QueryTypes.SELECT }
    );

    // Parse JSON fields
    const parsed = advocates.map(a => ({
      ...a,
      advocate_id: a.id,
      practice_areas: typeof a.practice_areas === 'string'
        ? JSON.parse(a.practice_areas)
        : (a.practice_areas || [])
    }));

    console.log(`[GET /admin/advocates] Found ${parsed.length} advocates`);
    res.json({ success: true, count: parsed.length, advocates: parsed });

  } catch (err) {
    console.error('[GET /admin/advocates] Error:', err.message);
    res.status(500).json({ success: false, message: err.message });
  }
});

// Require auth for the rest
router.use(authenticateAdminMock);


/**
 * GET /api/v1/admin/stats
 */
router.get('/stats', async (req, res) => {
  try {
    const [stats] = await sequelize.query(
      `SELECT
        (SELECT COUNT(*) FROM users WHERE is_deleted=0) as total_users,
        (SELECT COUNT(*) FROM advocates) as total_advocates,
        (SELECT COUNT(*) FROM advocates WHERE verification_status='verified') as verified_advocates,
        (SELECT COUNT(*) FROM advocates WHERE verification_status='pending') as pending_verification,
        (SELECT COUNT(*) FROM calls) as total_calls_this_month`,
      { type: QueryTypes.SELECT }
    );
    res.json({ success: true, stats });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});



/**
 * POST /api/v1/admin/advocates
 */
router.post('/advocates', async (req, res) => {
  try {
    const { 
      full_name, email, phone, city, state,
      practice_areas, experience_years, hourly_rate,
      languages, bio, verification_status 
    } = req.body;

    await sequelize.query(
      `INSERT INTO advocates 
       (full_name, email, phone, city, state,
        practice_areas, experience_years, hourly_rate,
        languages, bio, verification_status, created_at)
       VALUES (:full_name, :email, :phone, 
        :city, :state, :practice_areas, :experience_years,
        :hourly_rate, :languages, :bio, :verification_status, NOW())`,
      {
        replacements: {
          full_name,
          email: email || null,
          phone: phone || null,
          city: city || null,
          state: state || null,
          practice_areas: JSON.stringify(practice_areas || []),
          experience_years: experience_years || 0,
          hourly_rate: hourly_rate || 0,
          languages: JSON.stringify(languages || []),
          bio: bio || null,
          verification_status: verification_status || 'verified'
        },
        type: QueryTypes.INSERT
      }
    );

    res.status(201).json({ 
      success: true, 
      message: 'Advocate created successfully'
    });
  } catch (err) {
    console.error('POST /advocates error:', err.message);
    res.status(500).json({ success: false, message: err.message });
  }
});

/**
 * PATCH /api/v1/admin/advocates/:id/verify
 */
router.patch('/advocates/:id/verify', async (req, res) => {
  try {
    await sequelize.query(
      `UPDATE advocates SET verification_status = 'verified' 
       WHERE id = :id`,
      { replacements: { id: req.params.id }, type: QueryTypes.UPDATE }
    );
    res.json({ success: true, message: 'Advocate verified' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

/**
 * PATCH /api/v1/admin/advocates/:id/suspend
 */
router.patch('/advocates/:id/suspend', async (req, res) => {
  try {
    await sequelize.query(
      `UPDATE advocates SET verification_status = 'suspended' 
       WHERE id = :id`,
      { replacements: { id: req.params.id }, type: QueryTypes.UPDATE }
    );
    res.json({ success: true, message: 'Advocate suspended' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

/**
 * DELETE /api/v1/admin/advocates/:id
 */
router.delete('/advocates/:id', async (req, res) => {
  try {
    await sequelize.query(
      `UPDATE advocates SET is_active = 0 WHERE id = :id`,
      { replacements: { id: req.params.id }, type: QueryTypes.UPDATE }
    );
    res.json({ success: true, message: 'Advocate deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});


// GET availability for an advocate
router.get('/advocates/:id/availability', async (req, res) => {
  try {
    const advocateId = parseInt(req.params.id);
    console.log('Getting availability for advocate:', advocateId);

    const [availability] = await sequelize.query(
      `SELECT * FROM advocate_availability 
       WHERE advocate_id = ? AND is_active = 1
       ORDER BY FIELD(day_of_week,
         'Monday','Tuesday','Wednesday',
         'Thursday','Friday','Saturday','Sunday')`,
      { 
        replacements: [advocateId],
        type: QueryTypes.SELECT 
      }
    );

    const [blocked_dates] = await sequelize.query(
      `SELECT * FROM advocate_blocked_dates 
       WHERE advocate_id = ? AND blocked_date >= CURDATE()
       ORDER BY blocked_date`,
      { 
        replacements: [advocateId],
        type: QueryTypes.SELECT 
      }
    );

    console.log('Availability found:', availability?.length || 0);
    res.json({ 
      success: true, 
      availability: availability || [], 
      blocked_dates: blocked_dates || [] 
    });
  } catch (err) {
    console.error('GET availability error:', err.message);
    res.status(500).json({ message: err.message });
  }
});

// POST add a new availability slot
router.post('/advocates/:id/availability', async (req, res) => {
  try {
    const advocateId = parseInt(req.params.id);
    const { day_of_week, start_time, end_time, slot_duration_minutes } = req.body;

    console.log('Adding slot:', { advocateId, day_of_week, start_time, end_time });

    await sequelize.query(
      `INSERT INTO advocate_availability
       (advocate_id, day_of_week, start_time, end_time, slot_duration_minutes)
       VALUES (?, ?, ?, ?, ?)`,
      {
        replacements: [
          advocateId,
          day_of_week,
          start_time,
          end_time,
          slot_duration_minutes || 60
        ],
        type: QueryTypes.INSERT
      }
    );

    res.json({ success: true, message: 'Slot added successfully' });
  } catch (err) {
    console.error('POST availability error:', err.message);
    res.status(500).json({ message: err.message });
  }
});

// DELETE a slot
router.delete('/advocates/:id/availability/:slot_id', async (req, res) => {
  try {
    await sequelize.query(
      `UPDATE advocate_availability SET is_active = 0 
       WHERE availability_id = ?`,
      { replacements: [req.params.slot_id], type: QueryTypes.UPDATE }
    );
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST block a date
router.post('/advocates/:id/block-date', async (req, res) => {
  try {
    const advocateId = parseInt(req.params.id);
    const { blocked_date, reason } = req.body;
    await sequelize.query(
      `INSERT INTO advocate_blocked_dates
       (advocate_id, blocked_date, reason)
       VALUES (?, ?, ?)`,
      {
        replacements: [advocateId, blocked_date, reason || null],
        type: QueryTypes.INSERT
      }
    );
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
