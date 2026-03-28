const express = require('express');
const router = express.Router();
const callController = require('../controllers/callController');
const { protect } = require('../middleware/authMiddleware');

router.use(protect);

router.post('/initiate', callController.initiateCall);
router.post('/:call_id/end', callController.endCall);
router.get('/history', callController.getCallHistory);
router.get('/:call_id/summary', callController.getCallSummary);
router.post('/:call_id/rate', callController.rateAdvocate);
router.post('/:call_id/chat', callController.saveChatMessage);
router.get('/:call_id/chat', callController.getChatMessages);

module.exports = router;
