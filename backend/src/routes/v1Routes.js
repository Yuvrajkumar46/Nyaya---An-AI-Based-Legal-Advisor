const express = require('express');
const router = express.Router();
const db = require('../config/db');
const { protect } = require('../middleware/authMiddleware');
const userController = require('../controllers/userController');
const professionalsController = require('../controllers/professionalsController');

// ─── PUBLIC ROUTES ─────────────────────────────────────────────────────────────
// Test route — no auth needed
router.get('/professionals/search', async (req, res) => {
  try {
    const { QueryTypes } = require('sequelize');
    const sequelize = require('../config/db');
    
    const advocates = await sequelize.query(
      `SELECT id, full_name, email, city, state,
              practice_areas, experience_years, 
              hourly_rate, languages, bio,
              verification_status, is_active
       FROM advocates 
       WHERE verification_status = 'verified' 
       AND is_active = 1`,
      { type: QueryTypes.SELECT }
    );

    const parsed = advocates.map(a => ({
      ...a,
      id: a.id,
      advocate_id: a.id, // alias for frontend compatibility
      practice_areas: typeof a.practice_areas === 'string'
        ? JSON.parse(a.practice_areas)
        : (a.practice_areas || []),
      languages: typeof a.languages === 'string'
        ? JSON.parse(a.languages)
        : (a.languages || [])
    }));

    console.log(`Returning ${parsed.length} advocates`);
    res.json({ success: true, advocates: parsed, total: parsed.length });
  } catch (err) {
    console.error('Find advocates error:', err.message);
    res.status(500).json({ message: err.message });
  }
});
// router.get('/professionals/:advocate_id', professionalsController.getAdvocateProfile); // handled by professionalRoutes.js now
router.get('/professionals/:advocate_id/reviews', professionalsController.getAdvocateReviews);
router.get('/professionals/:advocate_id/availability', professionalsController.getAdvocateAvailability);

const userRoutes = require('./userRoutes');
const professionalRoutes = require('./professionalRoutes');
const billingRoutes = require('./billingRoutes');
const notificationRoutes = require('./notificationRoutes');
const aiRoutes = require('./aiRoutes');

router.use('/users', userRoutes);
router.use('/professionals', professionalRoutes);
router.use('/billing', billingRoutes);
router.use('/notifications', notificationRoutes);
router.use('/ai', aiRoutes);

const authController = require('../controllers/authController');

// Expose public auth routes explicitly
router.post('/auth/register', authController.registerValidation, authController.register);

// Expose login explicitly without any middleware
router.post('/auth/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    console.log('Login attempt for:', username);

    const [[user]] = await db.query(
      'SELECT * FROM users WHERE username = :username',
      { replacements: { username: username.trim().toLowerCase() } }
    );

    if (!user) {
      return res.status(401).json({ message: 'User not found' });
    }

    const bcrypt = require('bcryptjs');
    const valid = await bcrypt.compare(password, user.password_hash);
    
    if (!valid) {
      return res.status(401).json({ message: 'Wrong password' });
    }

    if (!user.is_active) {
      return res.status(403).json({ message: 'Account suspended' });
    }

    const jwt = require('jsonwebtoken');
    const token = jwt.sign(
      { user_id: user.user_id, username: user.username, role: user.role },
      process.env.JWT_SECRET || 'nyaya_secret_key',
      { expiresIn: '24h' }
    );

    console.log('Login successful for:', username);

    res.json({
      success: true,
      access_token: token,
      user: {
        user_id: user.user_id,
        username: user.username,
        full_name: user.full_name,
        role: user.role,
        wallet_balance: Number(user.wallet_balance || 0)
      }
    });

  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ message: 'Server error: ' + err.message });
  }
});

// All subsequent v1 routes are protected since they are user-specific
router.use(protect);

// User Profile & Stats
router.get('/users/me', userController.getMe);
router.get('/users/stats', userController.getStats);
router.patch('/users/profile', userController.updateProfile);
router.patch('/users/password', userController.updatePassword);
router.patch('/users/notification-preferences', userController.updateNotificationPreferences);
router.post('/users/delete-request', userController.requestDataDeletion);

// Appointments
router.get('/appointments', userController.getUpcomingAppointments);

// AI Guidance
router.get('/legal-guidance/history', userController.getLegalGuidanceHistory);

// Auth (extra session management)
router.delete('/auth/sessions/all', userController.logoutAllDevices);

module.exports = router;
