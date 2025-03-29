const express = require('express');
const {
  getMenuItems,
  getMenuItem,
  createMenuItem,
  updateMenuItem,
  deleteMenuItem,
  updateAvailability,
  getPopularItems,
  getRestaurantMenuItems
} = require('../controllers/menuItemController');

const router = express.Router({ mergeParams: true });

const { protect, authorize } = require('../middleware/auth');

router.route('/popular').get(getPopularItems);
router.route('/restaurant/:restaurantId').get(getRestaurantMenuItems);

router
  .route('/')
  .get(getMenuItems)
  .post(protect, authorize('restaurant', 'admin'), createMenuItem);

router
  .route('/:id')
  .get(getMenuItem)
  .put(protect, authorize('restaurant', 'admin'), updateMenuItem)
  .delete(protect, authorize('restaurant', 'admin'), deleteMenuItem);

router
  .route('/:id/availability')
  .patch(protect, authorize('restaurant', 'admin'), updateAvailability);

module.exports = router;