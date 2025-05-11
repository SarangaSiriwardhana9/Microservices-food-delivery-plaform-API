const Restaurant = require('../models/Restaurant');

// @desc    Get all restaurants
// @route   GET /api/v1/restaurants
// @access  Public
exports.getRestaurants = async (req, res) => {
  try {
    let query;

    // Copy req.query
    const reqQuery = { ...req.query };

    // Fields to exclude
    const removeFields = ['select', 'sort', 'page', 'limit', 'search'];

    // Loop over removeFields and delete them from reqQuery
    removeFields.forEach(param => delete reqQuery[param]);

    // Create query string
    let queryStr = JSON.stringify(reqQuery);

    // Create operators ($gt, $gte, etc)
    queryStr = queryStr.replace(/\b(gt|gte|lt|lte|in)\b/g, match => `$${match}`);

    // Finding resource
    query = Restaurant.find(JSON.parse(queryStr));

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
    const total = await Restaurant.countDocuments(JSON.parse(queryStr));

    query = query.skip(startIndex).limit(limit);

    // Executing query
    const restaurants = await query;

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
      count: restaurants.length,
      pagination,
      data: restaurants
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      error: 'Server Error'
    });
  }
};

// @desc    Get single restaurant
// @route   GET /api/v1/restaurants/:id
// @access  Public
exports.getRestaurant = async (req, res) => {
  try {
    const restaurant = await Restaurant.findById(req.params.id);

    if (!restaurant) {
      return res.status(404).json({
        success: false,
        error: 'Restaurant not found'
      });
    }

    res.status(200).json({
      success: true,
      data: restaurant
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      error: 'Server Error'
    });
  }
};

// @desc    Create new restaurant
// @route   POST /api/v1/restaurants
// @access  Private (only restaurant owner and admin)
exports.createRestaurant = async (req, res) => {
  try {
    // Check if we have a user ID from token verification
    if (req.userId) {
      // Set the userId to the authenticated user's ID
      req.body.userId = req.userId;
    } else if (req.user && req.user.id) {
      req.body.userId = req.user.id;
    } else {
      return res.status(400).json({
        success: false,
        error: 'User ID is required. Make sure you are authenticated.'
      });
    }

    // Check if user already has a restaurant
    const existingRestaurant = await Restaurant.findOne({ userId: req.body.userId });
    if (existingRestaurant) {
      return res.status(400).json({
        success: false,
        error: 'You already have a registered restaurant'
      });
    }

    const restaurant = await Restaurant.create(req.body);

    res.status(201).json({
      success: true,
      data: restaurant
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      error: 'Server Error'
    });
  }
};
// @desc    Update restaurant
// @route   PUT /api/v1/restaurants/:id
// @access  Private (only restaurant owner and admin)
exports.updateRestaurant = async (req, res) => {
  try {
    let restaurant = await Restaurant.findById(req.params.id);

    if (!restaurant) {
      return res.status(404).json({
        success: false,
        error: 'Restaurant not found'
      });
    }

    // Make sure user is restaurant owner or admin
    if (restaurant.userId.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(401).json({
        success: false,
        error: 'Not authorized to update this restaurant'
      });
    }

    restaurant = await Restaurant.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });

    res.status(200).json({
      success: true,
      data: restaurant
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      error: 'Server Error'
    });
  }
};

// @desc    Delete 
// @route   DELETE /api/v1/restaurants/:id
// @access  Private (only restaurant owner and admin)
exports.deleteRestaurant = async (req, res) => {
  try {
    const restaurant = await Restaurant.findById(req.params.id);

    if (!restaurant) {
      return res.status(404).json({
        success: false,
        error: 'Restaurant not found'
      });
    }

    // Make sure user is restaurant owner or admin
    if (restaurant.userId.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(401).json({
        success: false,
        error: 'Not authorized to delete this restaurant'
      });
    }

    await Restaurant.findByIdAndDelete(req.params.id);

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

// @desc    Toggle restaurant active status
// @route   PATCH /api/v1/restaurants/:id/status
// @access  Private (only restaurant owner and admin)
exports.toggleStatus = async (req, res) => {
  try {
    const { isActive } = req.body;

    if (isActive === undefined) {
      return res.status(400).json({
        success: false,
        error: 'Please provide active status'
      });
    }

    let restaurant = await Restaurant.findById(req.params.id);

    if (!restaurant) {
      return res.status(404).json({
        success: false,
        error: 'Restaurant not found'
      });
    }

    // Make sure user is restaurant owner or admin
    if (restaurant.userId.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(401).json({
        success: false,
        error: 'Not authorized to update this restaurant'
      });
    }

    restaurant = await Restaurant.findByIdAndUpdate(
      req.params.id, 
      { isActive }, 
      { new: true }
    );

    res.status(200).json({
      success: true,
      data: restaurant
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      error: 'Server Error'
    });
  }
};

// @desc    Get restaurants by user ID (owner)
// @route   GET /api/v1/restaurants/user
// @access  Private
exports.getUserRestaurant = async (req, res) => {
  try {
    // Check if we have a user ID from token verification
    let userId;
    
    if (req.userId) {
      userId = req.userId;
    } else if (req.user && req.user.id) {
      userId = req.user.id;
    } else {
      return res.status(400).json({
        success: false,
        error: 'User ID is required. Make sure you are authenticated.'
      });
    }

    const restaurant = await Restaurant.findOne({ userId: userId });

    if (!restaurant) {
      return res.status(404).json({
        success: false,
        error: 'No restaurant found for this user'
      });
    }

    res.status(200).json({
      success: true,
      data: restaurant
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      error: 'Server Error'
    });
  }
};

// @desc    Get featured restaurants
// @route   GET /api/v1/restaurants/featured
// @access  Public
exports.getFeaturedRestaurants = async (req, res) => {
  try {
    const restaurants = await Restaurant.find({ isFeatured: true, isActive: true })
      .sort('-averageRating')
      .limit(10);

    res.status(200).json({
      success: true,
      count: restaurants.length,
      data: restaurants
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      error: 'Server Error'
    });
  }
};

// @desc    Search nearby restaurants
// @route   GET /api/v1/restaurants/nearby
// @access  Public
exports.getNearbyRestaurants = async (req, res) => {
  try {
    const { lat, lng, radius = 10 } = req.query; // radius in kilometers

    if (!lat || !lng) {
      return res.status(400).json({
        success: false,
        error: 'Please provide latitude and longitude coordinates'
      });
    }

    // Find restaurants within the given radius (simple implementation)
    // In a production environment, you would use MongoDB's geospatial queries
    const restaurants = await Restaurant.find({
      isActive: true,
      'address.coordinates.lat': { $exists: true },
      'address.coordinates.lng': { $exists: true }
    });

    // Calculate distance and filter
    const nearbyRestaurants = restaurants.filter(restaurant => {
      const distance = calculateDistance(
        lat, 
        lng, 
        restaurant.address.coordinates.lat, 
        restaurant.address.coordinates.lng
      );
      
      restaurant._doc.distance = distance.toFixed(2);
      return distance <= radius;
    });

    // Sort by distance
    nearbyRestaurants.sort((a, b) => a._doc.distance - b._doc.distance);

    res.status(200).json({
      success: true,
      count: nearbyRestaurants.length,
      data: nearbyRestaurants
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      error: 'Server Error'
    });
  }
};

// Helper function to calculate distance between two coordinates using the Haversine formula
const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371; // Radius of the earth in km
  const dLat = deg2rad(lat2 - lat1);
  const dLon = deg2rad(lon2 - lon1);
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) * 
    Math.sin(dLon/2) * Math.sin(dLon/2); 
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
  const distance = R * c; // Distance in km
  return distance;
};

const deg2rad = (deg) => {
  return deg * (Math.PI/180);
};