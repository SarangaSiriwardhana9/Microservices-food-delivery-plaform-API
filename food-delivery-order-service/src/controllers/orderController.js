const axios = require('axios');
const Order = require('../models/Order');
const calculateTotal = require('../utils/calculateTotal');

// @desc    Get all orders
// @route   GET /api/v1/orders
// @access  Private (Admin)
exports.getOrders = async (req, res) => {
  try {
    let query;

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
    query = Order.find(JSON.parse(queryStr));

    // Selecting the Fields
    if (req.query.select) {
      const fields = req.query.select.split(',').join(' ');
      query = query.select(fields);
    }

    // Sorting
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
    const total = await Order.countDocuments(JSON.parse(queryStr));

    query = query.skip(startIndex).limit(limit);

    // Executing query
    const orders = await query;

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
      count: orders.length,
      pagination,
      data: orders
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      error: 'Server Error'
    });
  }
};

// @desc    Get user orders
// @route   GET /api/v1/orders/user
// @access  Private
exports.getUserOrders = async (req, res) => {
  try {
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

    const orders = await Order.find({ user: userId }).sort('-createdAt');

    res.status(200).json({
      success: true,
      count: orders.length,
      data: orders
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      error: 'Server Error'
    });
  }
};

// @desc    Get restaurant orders
// @route   GET /api/v1/orders/restaurant
// @access  Private (Restaurant Owner)
exports.getRestaurantOrders = async (req, res) => {
  try {
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

    // Get restaurant owned by the user
    try {
      const restaurantResponse = await axios.get(
        `${process.env.RESTAURANT_SERVICE_URL}/restaurants/user`,
        {
          headers: {
            Authorization: req.headers.authorization
          }
        }
      );
      
      const restaurant = restaurantResponse.data.data;
      
      // Find orders for the restaurant
      const orders = await Order.find({ restaurant: restaurant._id }).sort('-createdAt');

      res.status(200).json({
        success: true,
        count: orders.length,
        data: orders
      });
    } catch (err) {
      if (err.response && err.response.status === 404) {
        return res.status(404).json({
          success: false,
          error: 'No restaurant found for this user'
        });
      }
      throw err;
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      error: 'Server Error'
    });
  }
};

// @desc    Get single order
// @route   GET /api/v1/orders/:id
// @access  Private
exports.getOrder = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({
        success: false,
        error: 'Order not found'
      });
    }

    // Check if user is authorized to view this order
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

    // Always allow access to the order owner
    if (order.user.toString() === userId) {
      return res.status(200).json({
        success: true,
        data: order
      });
    }

    // If we have user role info, check for admin access
    if (req.user && req.user.role === 'admin') {
      return res.status(200).json({
        success: true,
        data: order
      });
    }

    // Check if user is the restaurant owner
    if (req.user && req.user.role === 'restaurant') {
      try {
        const restaurantResponse = await axios.get(
          `${process.env.RESTAURANT_SERVICE_URL}/restaurants/user`,
          {
            headers: {
              Authorization: req.headers.authorization
            }
          }
        );
        
        const restaurant = restaurantResponse.data.data;
        
        if (order.restaurant.toString() === restaurant._id.toString()) {
          return res.status(200).json({
            success: true,
            data: order
          });
        }
      } catch (err) {
        console.error('Error checking restaurant ownership:', err.message);
      }
    }

    // If none of the above conditions are met, deny access
    return res.status(403).json({
      success: false,
      error: 'Not authorized to access this order'
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      error: 'Server Error'
    });
  }
};
// @desc    Create new order
// @route   POST /api/v1/orders
// @access  Private
exports.createOrder = async (req, res) => {
  try {
    const {
      restaurantId,
      items,
      deliveryAddress,
      deliveryInstructions,
      contactPhone,
      paymentMethod
    } = req.body;

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

    // Validate required fields
    if (!restaurantId || !items || !deliveryAddress || !contactPhone) {
      return res.status(400).json({
        success: false,
        error: 'Please provide all required fields'
      });
    }

    // Verify items and get details from menu service
    const orderItems = [];
    let subtotal = 0;

    for (const item of items) {
      if (!item.menuItemId || !item.quantity) {
        return res.status(400).json({
          success: false,
          error: 'Each order item must have menuItemId and quantity'
        });
      }

      try {
        // Get menu item details from menu service
        const menuItemResponse = await axios.get(
          `${process.env.MENU_SERVICE_URL}/menu-items/${item.menuItemId}`
        );
        
        const menuItem = menuItemResponse.data.data;
        
        // Check if item is available
        if (!menuItem.isAvailable) {
          return res.status(400).json({
            success: false,
            error: `Menu item ${menuItem.name} is not available`
          });
        }
        
        // Add to order items
        orderItems.push({
          menuItem: menuItem._id,
          name: menuItem.name,
          price: menuItem.price,
          quantity: item.quantity,
          specialInstructions: item.specialInstructions || ''
        });
        
        // Calculate item subtotal
        subtotal += menuItem.price * item.quantity;
      } catch (err) {
        console.error('Error fetching menu item:', err.message);
        return res.status(400).json({
          success: false,
          error: `Invalid menu item ID: ${item.menuItemId}`
        });
      }
    }

    // Calculate delivery fee (in a real app, this would be dynamic based on distance)
    const deliveryFee = 100; // Example fixed delivery fee in LKR
    
    // Calculate tax
    const taxRate = 0.05; // 5% tax
    
    // Calculate total
    const { subtotal: finalSubtotal, tax, deliveryFee: finalDeliveryFee, total } = 
      calculateTotal(orderItems, deliveryFee, taxRate);

    // Create order object
    const orderData = {
      user: userId,
      restaurant: restaurantId,
      items: orderItems,
      paymentDetails: {
        method: paymentMethod || 'cash',
        status: 'pending'
      },
      orderStatus: 'pending',
      deliveryAddress,
      deliveryInstructions: deliveryInstructions || '',
      contactPhone,
      subtotal: finalSubtotal,
      deliveryFee: finalDeliveryFee,
      tax,
      total
    };

    // Create order in DB
    const order = await Order.create(orderData);

    res.status(201).json({
      success: true,
      data: order
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      error: 'Server Error'
    });
  }
};

// @desc    Update order status
// @route   PATCH /api/v1/orders/:id/status
// @access  Private (Restaurant Owner and Admin)
exports.updateOrderStatus = async (req, res) => {
  try {
    const { orderStatus } = req.body;

    if (!orderStatus) {
      return res.status(400).json({
        success: false,
        error: 'Please provide order status'
      });
    }

    // Valid status transitions
    const validStatusTransitions = {
      'pending': ['confirmed', 'rejected', 'cancelled'],
      'confirmed': ['preparing', 'cancelled'],
      'preparing': ['ready', 'cancelled'],
      'ready': ['in-transit', 'cancelled'],
      'in-transit': ['delivered', 'cancelled'],
      'delivered': [],
      'cancelled': [],
      'rejected': []
    };

    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({
        success: false,
        error: 'Order not found'
      });
    }

    // Check if the requested status transition is valid
    if (!validStatusTransitions[order.orderStatus].includes(orderStatus) && 
        req.user.role !== 'admin') {
      return res.status(400).json({
        success: false,
        error: `Cannot transition from ${order.orderStatus} to ${orderStatus}`
      });
    }

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

    // Check authorization based on role and order status
    if (req.user.role === 'restaurant') {
      try {
        const restaurantResponse = await axios.get(
          `${process.env.RESTAURANT_SERVICE_URL}/restaurants/user`,
          {
            headers: {
              Authorization: req.headers.authorization
            }
          }
        );
        
        const restaurant = restaurantResponse.data.data;
        
        if (order.restaurant.toString() !== restaurant._id.toString()) {
          return res.status(403).json({
            success: false,
            error: 'Not authorized to update this order'
          });
        }
      } catch (err) {
        console.error('Error checking restaurant ownership:', err.message);
        return res.status(500).json({
          success: false,
          error: 'Error verifying restaurant ownership'
        });
      }
    } else if (req.user.role === 'user' && order.user.toString() !== userId) {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to update this order'
      });
    }

    // User role specific restrictions
    if (req.user.role === 'user' && !['cancelled'].includes(orderStatus)) {
      return res.status(403).json({
        success: false,
        error: 'Users can only cancel their orders'
      });
    }

    // Update order status
    order.orderStatus = orderStatus;
    
    // If status is 'delivered', set actualDeliveryTime
    if (orderStatus === 'delivered') {
      order.actualDeliveryTime = Date.now();
    }

    await order.save();

    res.status(200).json({
      success: true,
      data: order
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      error: 'Server Error'
    });
  }
};

// @desc    Add rating to order
// @route   POST /api/v1/orders/:id/rating
// @access  Private (Order Owner)
exports.addOrderRating = async (req, res) => {
  try {
    const { foodRating, deliveryRating, review } = req.body;

    // Validate input
    if (!foodRating && !deliveryRating) {
      return res.status(400).json({
        success: false,
        error: 'Please provide at least one rating'
      });
    }

    if (foodRating && (foodRating < 1 || foodRating > 5)) {
      return res.status(400).json({
        success: false,
        error: 'Food rating must be between 1 and 5'
      });
    }

    if (deliveryRating && (deliveryRating < 1 || deliveryRating > 5)) {
      return res.status(400).json({
        success: false,
        error: 'Delivery rating must be between 1 and 5'
      });
    }

    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({
        success: false,
        error: 'Order not found'
      });
    }

    // Check if order is delivered
    if (order.orderStatus !== 'delivered') {
      return res.status(400).json({
        success: false,
        error: 'Can only rate delivered orders'
      });
    }

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
// Check if user is the order owner
if (order.user.toString() !== userId) {
    return res.status(403).json({
      success: false,
      error: 'Not authorized to rate this order'
    });
  }

  // Check if order already has a rating
  if (order.ratings && order.ratings.food) {
    return res.status(400).json({
      success: false,
      error: 'Order has already been rated'
    });
  }

  // Add rating to order
  order.ratings = {
    food: foodRating,
    delivery: deliveryRating,
    review: review || '',
    createdAt: Date.now()
  };

  await order.save();

  res.status(200).json({
    success: true,
    data: order
  });
} catch (err) {
  console.error(err);
  res.status(500).json({
    success: false,
    error: 'Server Error'
  });
}
};