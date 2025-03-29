const MenuItem = require('../models/MenuItem');
const Category = require('../models/Category');

// @desc    Get all menu items
// @route   GET /api/v1/menu-items
// @route   GET /api/v1/categories/:categoryId/menu-items
// @access  Public
exports.getMenuItems = async (req, res) => {
  try {
    let query;

    if (req.params.categoryId) {
      query = MenuItem.find({ category: req.params.categoryId });
    } else {
      query = MenuItem.find();
    }

    // Copy req.query
    const reqQuery = { ...req.query };

    // Fields to exclude
    const removeFields = ['select', 'sort', 'page', 'limit'];

    // Loop over removeFields and delete them from reqQuery
    removeFields.forEach(param => delete reqQuery[param]);

    // Create query string
    let queryStr = JSON.stringify(reqQuery);

    // Create operators ($gt, $gte, etc)
    queryStr = queryStr.replace(/\b(gt|gte|lt|lte|in)\b/g, match => `$${match}`);

    // Finding resource
    query = MenuItem.find(JSON.parse(queryStr)).populate({
      path: 'category',
      select: 'name description'
    });

    // Handle text search
    if (req.query.search) {
      query = query.find({
        $text: { $search: req.query.search }
      });
    }

    // Select Fields
    if (req.query.select) {
      const fields = req.query.select.split(',').join(' ');
      query = query.select(fields);
    }

    // Sort
    if (req.query.sort) {
      const sortBy = req.query.sort.split(',').join(' ');
      query = query.sort(sortBy);
    } else {
      query = query.sort('-createdAt');
    }

    // Pagination
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const startIndex = (page - 1) * limit;
    const endIndex = page * limit;
    const total = await MenuItem.countDocuments(JSON.parse(queryStr));

    query = query.skip(startIndex).limit(limit);

    // Executing query
    const menuItems = await query;

    // Pagination result
    const pagination = {};

    if (endIndex < total) {
      pagination.next = {
        page: page + 1,
        limit
      };
    }

    if (startIndex > 0) {
      pagination.prev = {
        page: page - 1,
        limit
      };
    }

    res.status(200).json({
      success: true,
      count: menuItems.length,
      pagination,
      data: menuItems
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      error: 'Server Error'
    });
  }
};

// @desc    Get single menu item
// @route   GET /api/v1/menu-items/:id
// @access  Public
exports.getMenuItem = async (req, res) => {
  try {
    const menuItem = await MenuItem.findById(req.params.id).populate({
      path: 'category',
      select: 'name description'
    });

    if (!menuItem) {
      return res.status(404).json({
        success: false,
        error: 'Menu item not found'
      });
    }

    res.status(200).json({
      success: true,
      data: menuItem
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      error: 'Server Error'
    });
  }
};

// @desc    Create new menu item
// @route   POST /api/v1/categories/:categoryId/menu-items
// @access  Private (Restaurant owners and admins)
exports.createMenuItem = async (req, res) => {
  try {
    req.body.category = req.params.categoryId;
    
    // Check if we have a user ID from token verification
    if (req.userId) {
      req.body.restaurantId = req.userId;
    } else if (req.user && req.user.id) {
      req.body.restaurantId = req.user.id;
    } else {
      return res.status(400).json({
        success: false,
        error: 'Restaurant ID is required. Make sure you are authenticated.'
      });
    }

    const category = await Category.findById(req.params.categoryId);

    if (!category) {
      return res.status(404).json({
        success: false,
        error: 'Category not found'
      });
    }

    // Make sure user is the restaurant owner or admin
    if (category.restaurantId.toString() !== req.body.restaurantId && 
        (!req.user || req.user.role !== 'admin')) {
      return res.status(401).json({
        success: false,
        error: 'Not authorized to add items to this category'
      });
    }

    const menuItem = await MenuItem.create(req.body);

    res.status(201).json({
      success: true,
      data: menuItem
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      error: 'Server Error'
    });
  }
};
// @desc    Update menu item
// @route   PUT /api/v1/menu-items/:id
// @access  Private (Restaurant owners and admins)
exports.updateMenuItem = async (req, res) => {
  try {
    let menuItem = await MenuItem.findById(req.params.id);

    if (!menuItem) {
      return res.status(404).json({
        success: false,
        error: 'Menu item not found'
      });
    }

    // Make sure user is the restaurant owner or admin
    if (menuItem.restaurantId.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(401).json({
        success: false,
        error: 'Not authorized to update this menu item'
      });
    }

    menuItem = await MenuItem.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });

    res.status(200).json({
      success: true,
      data: menuItem
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      error: 'Server Error'
    });
  }
};

// @desc    Delete menu item
// @route   DELETE /api/v1/menu-items/:id
// @access  Private (Restaurant owners and admins)
// @desc    Delete menu item
// @route   DELETE /api/v1/menu-items/:id
// @access  Private (Restaurant owners and admins)
exports.deleteMenuItem = async (req, res) => {
  try {
    const menuItem = await MenuItem.findById(req.params.id);

    if (!menuItem) {
      return res.status(404).json({
        success: false,
        error: 'Menu item not found'
      });
    }

    // Make sure user is the restaurant owner or admin
    if (menuItem.restaurantId.toString() !== req.userId && 
        (!req.user || req.user.role !== 'admin')) {
      return res.status(401).json({
        success: false,
        error: 'Not authorized to delete this menu item'
      });
    }

    await MenuItem.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      data: {}
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      error: 'Server Error'
    });
  }
};

// @desc    Update menu item availability
// @route   PATCH /api/v1/menu-items/:id/availability
// @access  Private (Restaurant owners and admins)
exports.updateAvailability = async (req, res) => {
  try {
    const { isAvailable } = req.body;

    if (isAvailable === undefined) {
      return res.status(400).json({
        success: false,
        error: 'Please provide availability status'
      });
    }

    let menuItem = await MenuItem.findById(req.params.id);

    if (!menuItem) {
      return res.status(404).json({
        success: false,
        error: 'Menu item not found'
      });
    }

    // Make sure user is the restaurant owner or admin
    if (menuItem.restaurantId.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(401).json({
        success: false,
        error: 'Not authorized to update this menu item'
      });
    }

    menuItem = await MenuItem.findByIdAndUpdate(
      req.params.id, 
      { isAvailable }, 
      { new: true }
    );

    res.status(200).json({
      success: true,
      data: menuItem
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      error: 'Server Error'
    });
  }
};

// @desc    Get popular menu items
// @route   GET /api/v1/menu-items/popular
// @access  Public
exports.getPopularItems = async (req, res) => {
  try {
    const menuItems = await MenuItem.find({ isPopular: true })
      .populate({
        path: 'category',
        select: 'name'
      })
      .limit(10);

    res.status(200).json({
      success: true,
      count: menuItems.length,
      data: menuItems
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      error: 'Server Error'
    });
  }
};

// @desc    Get restaurant menu items
// @route   GET /api/v1/menu-items/restaurant/:restaurantId
// @access  Public
exports.getRestaurantMenuItems = async (req, res) => {
  try {
    const menuItems = await MenuItem.find({ restaurantId: req.params.restaurantId })
      .populate({
        path: 'category',
        select: 'name description'
      });

    res.status(200).json({
      success: true,
      count: menuItems.length,
      data: menuItems
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      error: 'Server Error'
    });
  }
};