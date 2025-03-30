const mongoose = require('mongoose');

const RestaurantSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please add a restaurant name'],
    trim: true,
    maxlength: [100, 'Name cannot be more than 100 characters']
  },
  userId: {
    type: mongoose.Schema.ObjectId,
    required: true,
    ref: 'User' // Reference to User model in auth service
  },
  description: {
    type: String,
    required: [true, 'Please add a description'],
    maxlength: [1000, 'Description cannot be more than 1000 characters']
  },
  address: {
    street: {
      type: String,
      required: [true, 'Please add a street address']
    },
    city: {
      type: String,
      required: [true, 'Please add a city']
    },
    state: {
      type: String,
      required: [true, 'Please add a state']
    },
    zipCode: {
      type: String,
      required: [true, 'Please add a zip code']
    },
    country: {
      type: String,
      required: [true, 'Please add a country'],
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
  contactPhone: {
    type: String,
    required: [true, 'Please add a contact phone number'],
    match: [/^[0-9]{10}$/, 'Please add a valid phone number']
  },
  contactEmail: {
    type: String,
    required: [true, 'Please add a contact email'],
    match: [
      /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
      'Please add a valid email'
    ]
  },
  cuisineType: {
    type: [String],
    required: [true, 'Please specify at least one cuisine type']
  },
  openingHours: {
    monday: {
      open: String,
      close: String,
      isClosed: {
        type: Boolean,
        default: false
      }
    },
    tuesday: {
      open: String,
      close: String,
      isClosed: {
        type: Boolean,
        default: false
      }
    },
    wednesday: {
      open: String,
      close: String,
      isClosed: {
        type: Boolean,
        default: false
      }
    },
    thursday: {
      open: String,
      close: String,
      isClosed: {
        type: Boolean,
        default: false
      }
    },
    friday: {
      open: String,
      close: String,
      isClosed: {
        type: Boolean,
        default: false
      }
    },
    saturday: {
      open: String,
      close: String,
      isClosed: {
        type: Boolean,
        default: false
      }
    },
    sunday: {
      open: String,
      close: String,
      isClosed: {
        type: Boolean,
        default: false
      }
    }
  },
  averageRating: {
    type: Number,
    min: 0,
    max: 5,
    default: 0
  },
  totalReviews: {
    type: Number,
    default: 0
  },
  images: {
    logo: {
      type: String,
      required: false
    },
    cover: {
      type: String,
      required: false
    },
    gallery: {
      type: [String],
      required: false
    }
  },
  deliveryOptions: {
    delivery: {
      type: Boolean,
      default: true
    },
    pickup: {
      type: Boolean,
      default: true
    },
    dineIn: {
      type: Boolean,
      default: false
    }
  },
  deliveryRadius: {
    type: Number,
    min: 0,
    default: 5, // in kilometers
    required: false
  },
  minimumOrderAmount: {
    type: Number,
    min: 0,
    default: 0,
    required: false
  },
  averageDeliveryTime: {
    type: Number,
    min: 0,
    default: 30, // in minutes
    required: false
  },
  isActive: {
    type: Boolean,
    default: true
  },
  isVerified: {
    type: Boolean,
    default: false
  },
  isFeatured: {
    type: Boolean,
    default: false
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Create index for faster searches
RestaurantSchema.index({ name: 'text', 'address.city': 'text', cuisineType: 'text' });

module.exports = mongoose.model('Restaurant', RestaurantSchema);