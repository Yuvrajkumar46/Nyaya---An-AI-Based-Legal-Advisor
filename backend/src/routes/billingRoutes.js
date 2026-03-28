const express = require('express');
const router = express.Router();
const billingController = require('../controllers/billingController');
const { protect } = require('../middleware/authMiddleware');

// All billing routes are protected
router.use(protect);

router.post('/create-order', billingController.createOrder);
router.post('/verify-payment', billingController.verifyPayment);
router.get('/transactions', billingController.getTransactions);
router.get('/wallet-balance', billingController.getWalletBalance);
router.get('/invoice/:transaction_id', billingController.downloadInvoice);
router.post('/dispute', billingController.raiseDispute);

module.exports = router;
