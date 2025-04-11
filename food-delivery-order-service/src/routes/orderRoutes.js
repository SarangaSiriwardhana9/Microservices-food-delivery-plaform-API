const express = require('express');
const { 
  getOrders,
  getUserOrders,
  getRestaurantOrders,
  getOrder,
  createOrder,
  updateOrderStatus,
  addOrderRating
} = require('../controllers/orderController');

const router = express.Router();

const { protect, authorize } = require('../middleware/auth');

router.get('/', protect, authorize('admin'), getOrders);
router.get('/user', protect, getUserOrders);
router.get('/restaurant', protect, authorize('restaurant'), getRestaurantOrders);
router.post('/', protect, createOrder);
router.get('/:id', protect, getOrder);
router.patch('/:id/status', protect, updateOrderStatus);
router.post('/:id/rating', protect, addOrderRating);

module.exports = router;