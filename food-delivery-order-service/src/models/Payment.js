const mongoose = require('mongoose');

const PaymentSchema = new mongoose.Schema({
  order: {
    type: mongoose.Schema.ObjectId,
    required: true,
    ref: 'Order'
  },
  user: {
    type: mongoose.Schema.ObjectId,
    required: true,
    ref: 'User' // Reference to User model in auth service
  },
  amount: {
    type: Number,
    required: true
  },
  currency: {
    type: String,
    required: true,
    default: 'LKR' // Sri Lankan Rupee
  },
  method: {
    type: String,
    enum: ['card', 'cash', 'wallet'],
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'completed', 'failed', 'refunded'],
    default: 'pending'
  },
  paymentIntentId: {
    type: String,
    required: false // Required for Stripe payments
  },
  paymentMethodId: {
    type: String,
    required: false
  },
  receiptUrl: {
    type: String,
    required: false
  },
  refundId: {
    type: String,
    required: false
  },
  metadata: {
    type: Object,
    required: false
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
PaymentSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Index for faster searches
PaymentSchema.index({ order: 1 });
PaymentSchema.index({ user: 1 });
PaymentSchema.index({ status: 1 });

module.exports = mongoose.model('Payment', PaymentSchema);