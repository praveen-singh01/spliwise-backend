const subscriptionService = require('../services/subscriptionService');

/**
 * Get all available subscription plans
 */
const getPlans = async (req, res, next) => {
    try {
        const plans = await subscriptionService.getPlans();

        res.status(200).json({
            success: true,
            data: plans,
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Create a new subscription
 */
const createSubscription = async (req, res, next) => {
    try {
        const { planId } = req.body;

        if (!planId) {
            return res.status(400).json({
                success: false,
                message: 'Plan ID is required',
            });
        }

        const result = await subscriptionService.createSubscription(req.user.userId, planId);

        res.status(201).json({
            success: true,
            message: 'Subscription created successfully',
            data: result,
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Handle Razorpay webhooks
 */
const handleWebhook = async (req, res, next) => {
    try {
        const signature = req.headers['x-razorpay-signature'];
        const payload = JSON.stringify(req.body);

        if (!signature) {
            return res.status(400).json({
                success: false,
                message: 'Missing signature',
            });
        }

        const result = await subscriptionService.handleWebhook(payload, signature);

        res.status(200).json({
            success: true,
            data: result,
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Get user's subscription status
 */
const getStatus = async (req, res, next) => {
    try {
        const status = await subscriptionService.getSubscriptionStatus(req.user.userId);

        res.status(200).json({
            success: true,
            data: status,
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Cancel user's subscription
 */
const cancelSubscription = async (req, res, next) => {
    try {
        const subscription = await subscriptionService.cancelSubscription(req.user.userId);

        res.status(200).json({
            success: true,
            message: 'Subscription cancelled successfully',
            data: subscription,
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Upgrade user's subscription
 */
const upgradeSubscription = async (req, res, next) => {
    try {
        const { newPlan } = req.body;

        if (!newPlan) {
            return res.status(400).json({
                success: false,
                message: 'New plan ID is required',
            });
        }

        const result = await subscriptionService.upgradeSubscription(req.user.userId, newPlan);

        res.status(200).json({
            success: true,
            message: 'Subscription upgraded successfully',
            data: result,
        });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    getPlans,
    createSubscription,
    handleWebhook,
    getStatus,
    cancelSubscription,
    upgradeSubscription,
};
