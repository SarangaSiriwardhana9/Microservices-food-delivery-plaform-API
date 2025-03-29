const express = require('express');
const { 
  getCategories,
  getCategory,
  createCategory,
  updateCategory,
  deleteCategory
} = require('../controllers/categoryController');

// Include menu items router for re-routing
const menuItemRouter = require('./menuItemRoutes');

const router = express.Router();

const { protect, authorize } = require('../middleware/auth');

// Re-route into other resource routers
router.use('/:categoryId/menu-items', menuItemRouter);

router
  .route('/')
  .get(getCategories)
  .post(protect, authorize('restaurant', 'admin'), createCategory);

router
  .route('/:id')
  .get(getCategory)
  .put(protect, authorize('restaurant', 'admin'), updateCategory)
  .delete(protect, authorize('restaurant', 'admin'), deleteCategory);

module.exports = router;