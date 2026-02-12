const Razorpay = require('razorpay');

// Initialize Razorpay instance
// Use test values in test environment if not provided
const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID || 'rzp_test_dummy',
    key_secret: process.env.RAZORPAY_KEY_SECRET || 'dummy_secret',
});

module.exports = razorpay;
