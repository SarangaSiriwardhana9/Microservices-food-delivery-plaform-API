const User = require("../models/User");

// @desc    Register user
// @route   POST /api/v1/auth/register
// @access  Public
exports.register = async (req, res, next) => {
  try {
    // Destructure required fields from the request body
    const { name, email, password, phone, address, role } = req.body;

    // Check if a user with the same email already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        error: "Email already registered",
      });
    }

    // Create a new user in the database
    const user = await User.create({
      name,
      email,
      password, 
      phone,
      address,
      role,
    });

    // Send JWT token as response
    sendTokenResponse(user, 201, res);
  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      error: "Server Error", 
    
    });
  }
};

// @desc    Login user
// @route   POST /api/v1/auth/login
// @access  Public
exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: "Please provide an email and password",
      });
    }

    // Find the user by email and explicitly select the password field
    const user = await User.findOne({ email }).select("+password");
    if (!user) {
      return res.status(401).json({
        success: false,
        error: "Invalid credentials", // Unauthorized
      });
    }

    // Validate the password using a custom method defined in the User model
    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        error: "Invalid credentials",
      });
    }

    // Send JWT token if login is successful
    sendTokenResponse(user, 200, res);
  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      error: "Server Error",
    });
  }
};

// @desc    Get current logged in user details
// @route   GET /api/v1/auth/me
// @access  Private (requires JWT token)
exports.getMe = async (req, res, next) => {
  try {
    // Get the user by ID from the request (set by auth middleware)
    const user = await User.findById(req.user.id);

    res.status(200).json({
      success: true,
      data: user,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      error: "Server Error",
    });
  }
};

// @desc    Log user out / clear cookie
// @route   GET /api/v1/auth/logout
// @access  Private
exports.logout = async (req, res, next) => {
  // You can also clear cookies here if used
  res.status(200).json({
    success: true,
    message: "User logged out successfully",
  });
};

// Utility function
// Get token from user model, create cookie and send response
const sendTokenResponse = (user, statusCode, res) => {
  // Generate signed JWT token using user method
  const token = user.getSignedJwtToken();

  // Define cookie options (if needed)
  const options = {
    expires: new Date(
      Date.now() + process.env.JWT_EXPIRE * 24 * 60 * 60 * 1000 // days to ms
    ),
    httpOnly: true, // prevents client-side script access to cookie
  };

  // Remove password before sending user object
  user.password = undefined;

  // Send the response with the token and user info
  res.status(statusCode).json({
    success: true,
    token,
    data: user,
  });
};
