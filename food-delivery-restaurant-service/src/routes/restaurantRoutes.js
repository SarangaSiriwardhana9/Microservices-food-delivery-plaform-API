const express = require('express');
const { 
  getRestaurants,
  getRestaurant,
  createRestaurant,
  updateRestaurant,
  deleteRestaurant,
  toggleStatus,
  getUserRestaurant,
  getFeaturedRestaurants,
  getNearbyRestaurants
} = require('../controllers/restaurantController');

const router = express.Router();

const { protect, authorize } = require('../middleware/auth');

// Special routes
router.get('/featured', getFeaturedRestaurants);
router.get('/nearby', getNearbyRestaurants);
router.get('/user', protect, getUserRestaurant);

router
  .route('/')
  .get(getRestaurants)
  .post(protect, authorize('restaurant', 'admin'), createRestaurant);

router
  .route('/:id')
  .get(getRestaurant)
  .put(protect, authorize('restaurant', 'admin'), updateRestaurant)
  .delete(protect, authorize('restaurant', 'admin'), deleteRestaurant);

router
  .route('/:id/status')
  .patch(protect, authorize('restaurant', 'admin'), toggleStatus);

module.exports = router;