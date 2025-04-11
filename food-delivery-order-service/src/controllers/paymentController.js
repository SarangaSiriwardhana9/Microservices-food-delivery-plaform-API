const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const Order = require('../models/Order');
const Payment = require('../models/Payment');

// @desc    Create payment intent for Stripe
// @route   POST /api/v1/payments/create-payment-intent
// @access  Private
exports.createPaymentIntent = async (req, res) => {
  try {
    const { orderId } = req.body;

    if (!orderId) {
      return res.status(400).json({
        success: false,
        error: 'Please provide an order ID'
      });
    }

    // Get order details
    const order = await Order.findById(orderId);

    if (!order) {
      return res.status(404).json({
        success: false,
        error: 'Order not found'
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
        error: 'Not authorized to pay for this order'
      });
    }

    // Check if payment already exists for this order
    const existingPayment = await Payment.findOne({ 
      order: orderId,
      status: { $in: ['completed', 'pending'] }
    });

    if (existingPayment) {
      return res.status(400).json({
        success: false,
        error: 'Payment already exists for this order'
      });
    }

    // Create payment intent with Stripe
    const amountInCents = Math.round(order.total * 100); // Convert to cents

    const paymentIntent = await stripe.paymentIntents.create({
      amount: amountInCents,
      currency: 'lkr', // Sri Lankan rupee
      metadata: {
        orderId: order._id.toString(),
        userId: userId
      }
    });

    // Create payment record in database
    const payment = await Payment.create({
      order: order._id,
      user: userId,
      amount: order.total,
      currency: 'LKR',
      method: 'card',
      status: 'pending',
      paymentIntentId: paymentIntent.id,
      metadata: {
        clientSecret: paymentIntent.client_secret
      }
    });

    // Update order with payment ID
    order.paymentDetails.paymentId = payment._id;
    await order.save();

    res.status(200).json({
      success: true,
      clientSecret: paymentIntent.client_secret,
      data: payment
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      error: 'Server Error'
    });
  }
};

// @desc    Handle Stripe webhook
// @route   POST /api/v1/payments/webhook
// @access  Public
exports.handleWebhook = async (req, res) => {
  const signature = req.headers['stripe-signature'];

  let event;

  try {
    // Verify the event came from Stripe
    event = stripe.webhooks.constructEvent(
      req.rawBody, // This requires a rawBody parser middleware
      signature,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    console.error(`Webhook signature verification failed: ${err.message}`);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // Handle the event
  switch (event.type) {
    case 'payment_intent.succeeded':
      const paymentIntent = event.data.object;
      await handlePaymentSuccess(paymentIntent);
      break;
    case 'payment_intent.payment_failed':
      const failedPayment = event.data.object;
      await handlePaymentFailure(failedPayment);
      break;
    default:
      console.log(`Unhandled event type ${event.type}`);
  }

  // Return a 200 response to acknowledge receipt of the event
  res.status(200).json({ received: true });
};

// Helper function to handle successful payment
const handlePaymentSuccess = async (paymentIntent) => {
  try {
    // Update payment record
    const payment = await Payment.findOne({ paymentIntentId: paymentIntent.id });
    
    if (payment) {
      payment.status = 'completed';
      payment.receiptUrl = paymentIntent.charges?.data[0]?.receipt_url;
      payment.paymentMethodId = paymentIntent.payment_method;
      await payment.save();
      
      // Update order payment status
      if (payment.order) {
        const order = await Order.findById(payment.order);
        if (order) {
          order.paymentDetails.status = 'completed';
          await order.save();
        }
      }
    }
  } catch (err) {
    console.error('Error handling payment success:', err);
  }
};

// Helper function to handle failed payment
const handlePaymentFailure = async (paymentIntent) => {
  try {
    // Update payment record
    const payment = await Payment.findOne({ paymentIntentId: paymentIntent.id });
    
    if (payment) {
      payment.status = 'failed';
      payment.metadata = {
        ...payment.metadata,
        error: paymentIntent.last_payment_error?.message || 'Payment failed'
      };
      await payment.save();
      
      // Update order payment status
      if (payment.order) {
        const order = await Order.findById(payment.order);
        if (order) {
          order.paymentDetails.status = 'failed';
          await order.save();
        }
      }
    }
  } catch (err) {
    console.error('Error handling payment failure:', err);
  }
};

// @desc    Update payment to cash on delivery
// @route   PATCH /api/v1/payments/cash/:orderId
// @access  Private
exports.updateToCashPayment = async (req, res) => {
  try {
    const orderId = req.params.orderId;

    // Get order details
    const order = await Order.findById(orderId);

    if (!order) {
      return res.status(404).json({
        success: false,
        error: 'Order not found'
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
        error: 'Not authorized to update this order payment'
      });
    }

    // Check if payment already exists for this order
    const existingPayment = await Payment.findOne({ 
      order: orderId,
      status: { $in: ['completed', 'pending'] }
    });

    if (existingPayment) {
      return res.status(400).json({
        success: false,
        error: 'Payment already exists for this order'
      });
    }

    // Create cash payment record
    const payment = await Payment.create({
      order: order._id,
      user: userId,
      amount: order.total,
      currency: 'LKR',
      method: 'cash',
      status: 'pending'
    });

    // Update order with payment ID and method
    order.paymentDetails.paymentId = payment._id;
    order.paymentDetails.method = 'cash';
    await order.save();

    res.status(200).json({
      success: true,
      data: payment
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      error: 'Server Error'
    });
  }
};

// @desc    Get user payments
// @route   GET /api/v1/payments/user
// @access  Private
exports.getUserPayments = async (req, res) => {
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

    const payments = await Payment.find({ user: userId })
      .sort('-createdAt')
      .populate({
        path: 'order',
        select: 'orderStatus createdAt'
      });

    res.status(200).json({
      success: true,
      count: payments.length,
      data: payments
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      error: 'Server Error'
    });
  }
};