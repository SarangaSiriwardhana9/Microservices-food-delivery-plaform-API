const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const connectDB = require('./config/db');
const errorHandler = require('./middleware/errorHandler');

// Load env vars
dotenv.config();

// Connect to database
connectDB();

// Route files
const categoryRoutes = require('./routes/categoryRoutes');
const menuItemRoutes = require('./routes/menuItemRoutes');

const app = express();

// Body parser
app.use(express.json());

// Set security headers
app.use(helmet());

// Enable CORS
app.use(cors());

// Rate limiting
const limiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});
app.use(limiter);

// Mount routers
app.use('/api/v1/categories', categoryRoutes);
app.use('/api/v1/menu-items', menuItemRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', service: 'menu-service' });
});

// Error handler middleware
app.use(errorHandler);

const PORT = process.env.PORT || 5001;

const server = app.listen(PORT,'0.0.0.0', () => {
  console.log(`Menu Service running on port ${PORT}`);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  console.log(`Error: ${err.message}`);
  // Close server & exit process
  server.close(() => process.exit(1));
});