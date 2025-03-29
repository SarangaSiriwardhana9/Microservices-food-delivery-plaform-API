const mongoose = require('mongoose');

const CategorySchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please add a category name'],
    trim: true,
    maxlength: [50, 'Name cannot be more than 50 characters'],
    unique: true
  },
  description: {
    type: String,
    required: false,
    maxlength: [500, 'Description cannot be more than 500 characters']
  },
  image: {
    type: String,
    required: false
  },
  isActive: {
    type: Boolean,
    default: true
  },
  restaurantId: {
    type: mongoose.Schema.ObjectId,
    required: true,
    ref: 'User' // Reference to User model in auth service
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
}, {
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Cascade delete menu items when a category is deleted
CategorySchema.pre('remove', async function(next) {
  await this.model('MenuItem').deleteMany({ category: this._id });
  next();
});

// Reverse populate with menu items
CategorySchema.virtual('menuItems', {
  ref: 'MenuItem',
  localField: '_id',
  foreignField: 'category',
  justOne: false
});

module.exports = mongoose.model('Category', CategorySchema);