const jwt = require('jsonwebtoken');
const axios = require('axios');

// Protect routes
exports.protect = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    // Set token from Bearer token in header
    token = req.headers.authorization.split(' ')[1];
  }

  // Make sure token exists
  if (!token) {
    return res.status(401).json({
      success: false,
      error: 'Not authorized to access this route'
    });
  }

  try {
    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Set user ID from decoded token
    req.userId = decoded.id;
    
    next();
  } catch (err) {
    return res.status(401).json({
      success: false,
      error: 'Not authorized to access this route'
    });
  }
};

// Grant access to specific roles
exports.authorize = (...roles) => {
  return async (req, res, next) => {
    try {
      // Get user from auth service
      const response = await axios.get(`${process.env.AUTH_SERVICE_URL}/auth/me`, {
        headers: {
          Authorization: req.headers.authorization
        }
      });
      
      const user = response.data.data;
      
      if (!roles.includes(user.role)) {
        return res.status(403).json({
          success: false,
          error: `User role ${user.role} is not authorized to access this route`
        });
      }
      
      // Add full user object to request
      req.user = user;
      next();
    } catch (err) {
      console.error('Error verifying role:', err.message);
      return res.status(401).json({
        success: false,
        error: 'Not authorized to access this route'
      });
    }
  };
};