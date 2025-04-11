const express = require('express');
const { 
  createPaymentIntent,
  handleWebhook,
  updateToCashPayment,
  getUserPayments
} = require('../controllers/paymentController');

const router = express.Router();

const { protect, authorize } = require('../middleware/auth');

// This route needs rawBody for webhook signature verification
router.post('/webhook', express.raw({ type: 'application/json' }), handleWebhook);

router.post('/create-payment-intent', protect, createPaymentIntent);
router.patch('/cash/:orderId', protect, updateToCashPayment);
router.get('/user', protect, getUserPayments);

module.exports = router;