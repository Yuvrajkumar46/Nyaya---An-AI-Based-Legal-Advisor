const express = require('express');
const router = express.Router();
const { askAI, getQueryHistory } = require('../controllers/aiController');

// Optional auth middleware — works with or without login
const optionalAuth = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (authHeader?.startsWith('Bearer ')) {
      const jwt = require('jsonwebtoken');
      const token = authHeader.split(' ')[1];
      req.user = jwt.verify(token, process.env.JWT_SECRET);
    }
  } catch (e) {
    // No token — continue as guest
  }
  next();
};

const authMiddleware = require('../middleware/authMiddleware');

// POST /api/v1/ai/ask — works for both logged in and guest users
router.post('/ask', optionalAuth, askAI);

// GET /api/v1/ai/history — requires login
router.get('/history', authMiddleware.protect, getQueryHistory);

module.exports = router;
