const express = require('express');
const subscriptionController = require('../controllers/subscriptionController');
const authenticate = require('../middlewares/auth');

const router = express.Router();

/**
 * @route   GET /api/subscriptions/plans
 * @desc    Get all available subscription plans
 * @access  Public
 */
router.get('/plans', subscriptionController.getPlans);

/**
 * @route   POST /api/subscriptions/create
 * @desc    Create a new subscription
 * @access  Private
 */
router.post('/create', authenticate, subscriptionController.createSubscription);

/**
 * @route   POST /api/subscriptions/webhook
 * @desc    Handle Razorpay webhooks
 * @access  Public (verified by HMAC signature)
 */
router.post('/webhook', subscriptionController.handleWebhook);

/**
 * @route   GET /api/subscriptions/status
 * @desc    Get user's subscription status
 * @access  Private
 */
router.get('/status', authenticate, subscriptionController.getStatus);

/**
 * @route   POST /api/subscriptions/cancel
 * @desc    Cancel user's subscription
 * @access  Private
 */
router.post('/cancel', authenticate, subscriptionController.cancelSubscription);

/**
 * @route   POST /api/subscriptions/upgrade
 * @desc    Upgrade user's subscription
 * @access  Private
 */
router.post('/upgrade', authenticate, subscriptionController.upgradeSubscription);

module.exports = router;
