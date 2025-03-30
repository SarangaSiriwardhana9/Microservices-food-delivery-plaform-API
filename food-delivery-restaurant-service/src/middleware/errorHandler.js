const errorHandler = (err, req, res, next) => {
    // Log error for dev
    console.error(err);
  
    // Default error response
    let statusCode = err.statusCode || 500;
    let message = err.message || 'Server Error';
  
    // Handle specific error types
    if (err.name === 'ValidationError') {
      statusCode = 400;
      message = Object.values(err.errors).map(val => val.message);
    } else if (err.code === 11000) {
      statusCode = 400;
      message = 'Duplicate field value entered';
    } else if (err.name === 'CastError') {
      statusCode = 404;
      message = `Resource not found`;
    }
  
    res.status(statusCode).json({
      success: false,
      error: message
    });
  };
  
  module.exports = errorHandler;