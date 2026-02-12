const User = require('../models/User');

/**
 * Feature-gating middleware to require active subscription
 * @param {string} requiredPlan - Minimum plan required ('premium' or 'enterprise')
 */
const requireSubscription = (requiredPlan = 'premium') => {
    return async (req, res, next) => {
        try {
            // Get user with subscription details
            const user = await User.findById(req.user.userId).populate('subscriptionId');

            if (!user) {
                return res.status(404).json({
                    success: false,
                    message: 'User not found',
                });
            }

            // Check if user has an active subscription
            if (!user.subscriptionId || user.subscriptionId.status !== 'active') {
                return res.status(402).json({
                    success: false,
                    message: 'Payment Required',
                    error: 'Active subscription required to access this feature',
                    currentPlan: user.currentPlan,
                    requiredPlan,
                    upgradeUrl: '/api/subscriptions/plans',
                });
            }

            // Check if subscription is expired
            if (user.subscriptionId.isExpired()) {
                return res.status(402).json({
                    success: false,
                    message: 'Payment Required',
                    error: 'Subscription has expired',
                    currentPlan: user.currentPlan,
                    requiredPlan,
                    upgradeUrl: '/api/subscriptions/plans',
                });
            }

            // Define plan hierarchy
            const planHierarchy = {
                free: 0,
                premium: 1,
                enterprise: 2,
            };

            // Check if user's plan meets the requirement
            const userPlanLevel = planHierarchy[user.currentPlan] || 0;
            const requiredPlanLevel = planHierarchy[requiredPlan] || 1;

            if (userPlanLevel < requiredPlanLevel) {
                return res.status(402).json({
                    success: false,
                    message: 'Payment Required',
                    error: `${requiredPlan.charAt(0).toUpperCase() + requiredPlan.slice(1)} plan required to access this feature`,
                    currentPlan: user.currentPlan,
                    requiredPlan,
                    upgradeUrl: '/api/subscriptions/plans',
                });
            }

            // Attach subscription info to request for use in controller
            req.subscription = user.subscriptionId;
            req.userPlan = user.currentPlan;

            next();
        } catch (error) {
            next(error);
        }
    };
};

module.exports = requireSubscription;
