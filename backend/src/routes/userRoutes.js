const express = require('express');
const router = express.Router();
const db = require('../config/db');
const { protect } = require('../middleware/authMiddleware');

// GET /api/v1/users/profile
router.get('/profile', protect, async (req, res) => {
  try {
    const [[user]] = await db.query(
      `SELECT user_id, username, full_name, phone, 
              role, wallet_balance, created_at
       FROM users WHERE user_id = ?`,
      [req.user.user_id]
    );
    res.json({ success: true, user });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
