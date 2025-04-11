const mongoose = require('mongoose');

const OrderSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.ObjectId,
    required: true,
    ref: 'User' // Reference to User model in auth service
  },
  restaurant: {
    type: mongoose.Schema.ObjectId,
    required: true,
    ref: 'Restaurant' // Reference to Restaurant model in restaurant service
  },
  items: [
    {
      menuItem: {
        type: mongoose.Schema.ObjectId,
        required: true,
        ref: 'MenuItem' // Reference to MenuItem model in menu service
      },
      name: {
        type: String,
        required: true
      },
      price: {
        type: Number,
        required: true
      },
      quantity: {
        type: Number,
        required: true,
        min: [1, 'Quantity cannot be less than 1'],
        default: 1
      },
      specialInstructions: {
        type: String,
        required: false
      }
    }
  ],
  paymentDetails: {
    method: {
      type: String,
      enum: ['card', 'cash', 'wallet'],
      default: 'cash'
    },
    paymentId: {
      type: String,
      required: false
    },
    status: {
      type: String,
      enum: ['pending', 'completed', 'failed', 'refunded'],
      default: 'pending'
    }
  },
  orderStatus: {
    type: String,
    enum: [
      'pending', // Order created but not confirmed by restaurant
      'confirmed', // Restaurant confirmed the order
      'preparing', // Food being prepared
      'ready', // Food ready for pickup by delivery person
      'in-transit', // Food in transit
      'delivered', // Food delivered
      'cancelled', // Order cancelled
      'rejected' // Order rejected by restaurant
    ],
    default: 'pending'
  },
  deliveryAddress: {
    street: {
      type: String,
      required: true
    },
    city: {
      type: String,
      required: true
    },
    state: {
      type: String,
      required: true
    },
    zipCode: {
      type: String,
      required: true
    },
    country: {
      type: String,
      required: true,
      default: 'Sri Lanka'
    },
    coordinates: {
      lat: {
        type: Number,
        required: false
      },
      lng: {
        type: Number,
        required: false
      }
    }
  },
  deliveryInstructions: {
    type: String,
    required: false
  },
  contactPhone: {
    type: String,
    required: true,
    match: [/^[0-9]{10}$/, 'Please add a valid phone number']
  },
  subtotal: {
    type: Number,
    required: true
  },
  deliveryFee: {
    type: Number,
    required: true,
    default: 0
  },
  tax: {
    type: Number,
    required: true,
    default: 0
  },
  total: {
    type: Number,
    required: true
  },
  estimatedDeliveryTime: {
    type: Date,
    required: false
  },
  actualDeliveryTime: {
    type: Date,
    required: false
  },
  deliveryPerson: {
    type: mongoose.Schema.ObjectId,
    required: false,
    ref: 'User' // Reference to User model in auth service
  },
  ratings: {
    food: {
      type: Number,
      min: 1,
      max: 5,
      required: false
    },
    delivery: {
      type: Number,
      min: 1,
      max: 5,
      required: false
    },
    review: {
      type: String,
      required: false
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Update timestamps on save
OrderSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Index for faster searches
OrderSchema.index({ user: 1, createdAt: -1 });
OrderSchema.index({ restaurant: 1, orderStatus: 1 });

module.exports = mongoose.model('Order', OrderSchema);