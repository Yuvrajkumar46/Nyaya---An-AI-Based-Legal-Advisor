const express = require('express');
const router = express.Router();
const {
    getAppointments,
    getAppointmentById,
    bookAppointment,
    rescheduleAppointment,
    cancelAppointment
} = require('../controllers/appointmentController');
const { protect } = require('../middleware/authMiddleware');

// @route   GET /api/v1/appointments
// @desc    Get appointments for logged-in user (filtered by status)
router.get('/', protect, getAppointments);

// @route   POST /api/v1/appointments/book
// @desc    Book a new appointment (deducts wallet via transaction)
router.post('/book', protect, bookAppointment);


// @route   GET /api/v1/appointments/:id
// @desc    Get a single appointment by UUID
router.get('/:id', protect, getAppointmentById);

// @route   PATCH /api/v1/appointments/:id/reschedule
// @desc    Reschedule an existing appointment
router.patch('/:id/reschedule', protect, rescheduleAppointment);

// @route   PATCH /api/v1/appointments/:id/cancel
// @desc    Cancel an appointment and trigger refund policies
router.patch('/:id/cancel', protect, cancelAppointment);

module.exports = router;
