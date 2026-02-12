const razorpay = require('../config/razorpay');
const Subscription = require('../models/Subscription');
const WebhookEvent = require('../models/WebhookEvent');
const User = require('../models/User');
const crypto = require('crypto');

// Subscription plans configuration
const PLANS = {
    free: {
        id: 'free',
        name: 'Free',
        price: 0,
        currency: 'INR',
        interval: 'lifetime',
        features: [
            'Up to 10 expenses per month',
            'Basic split calculations',
            'Email support',
        ],
    },
    premium: {
        id: 'premium',
        name: 'Premium',
        price: 999, // ₹9.99 in paise
        currency: 'INR',
        interval: 'monthly',
        razorpayPlanId: process.env.RAZORPAY_PREMIUM_PLAN_ID,
        features: [
            'Unlimited expenses',
            'Advanced filtering',
            'Export to CSV/PDF',
            'Priority support',
        ],
    },
    enterprise: {
        id: 'enterprise',
        name: 'Enterprise',
        price: 2999, // ₹29.99 in paise
        currency: 'INR',
        interval: 'monthly',
        razorpayPlanId: process.env.RAZORPAY_ENTERPRISE_PLAN_ID,
        features: [
            'Everything in Premium',
            'Group management',
            'API access',
            'Dedicated support',
        ],
    },
};

class SubscriptionService {
    /**
     * Get all available subscription plans
     */
    async getPlans() {
        return Object.values(PLANS);
    }

    /**
     * Create a new subscription
     */
    async createSubscription(userId, planId) {
        // Validate plan
        const plan = PLANS[planId];
        if (!plan) {
            throw new Error('Invalid plan selected');
        }

        if (planId === 'free') {
            throw new Error('Free plan does not require subscription');
        }

        // Check if user already has an active subscription
        const existingSubscription = await Subscription.findOne({
            userId,
            status: 'active',
        });

        if (existingSubscription) {
            throw new Error('User already has an active subscription');
        }

        // Get or create Razorpay customer
        const user = await User.findById(userId);
        let customerId;

        try {
            const customer = await razorpay.customers.create({
                name: user.name,
                email: user.email,
            });
            customerId = customer.id;
        } catch (error) {
            throw new Error(`Failed to create customer: ${error.message}`);
        }

        // Create Razorpay subscription
        let razorpaySubscription;
        try {
            razorpaySubscription = await razorpay.subscriptions.create({
                plan_id: plan.razorpayPlanId,
                customer_id: customerId,
                total_count: 12, // 12 months
                quantity: 1,
                notify_info: {
                    notify_email: user.email,
                },
            });
        } catch (error) {
            throw new Error(`Failed to create subscription: ${error.message}`);
        }

        // Create subscription record
        const subscription = await Subscription.create({
            userId,
            plan: planId,
            status: 'pending',
            razorpaySubscriptionId: razorpaySubscription.id,
            razorpayCustomerId: customerId,
            autoRenew: true,
            metadata: {
                razorpayPlanId: plan.razorpayPlanId,
            },
        });

        // Update user
        await User.findByIdAndUpdate(userId, {
            subscriptionId: subscription._id,
        });

        return {
            subscription,
            checkoutUrl: razorpaySubscription.short_url,
            razorpaySubscriptionId: razorpaySubscription.id,
        };
    }

    /**
     * Handle webhook events with idempotency
     */
    async handleWebhook(payload, signature) {
        // Verify signature
        const isValid = this.verifyWebhookSignature(payload, signature);
        if (!isValid) {
            throw new Error('Invalid webhook signature');
        }

        const event = JSON.parse(payload);
        const eventId = event.id || event.payload?.subscription?.entity?.id + '_' + event.event;

        // Check if already processed (idempotency)
        const existingEvent = await WebhookEvent.findOne({ eventId });
        if (existingEvent) {
            return { processed: true, message: 'Event already processed' };
        }

        let result;
        try {
            // Process event based on type
            switch (event.event) {
                case 'subscription.activated':
                    result = await this.handleSubscriptionActivated(event.payload.subscription.entity);
                    break;
                case 'subscription.charged':
                    result = await this.handleSubscriptionCharged(event.payload.payment.entity);
                    break;
                case 'subscription.cancelled':
                    result = await this.handleSubscriptionCancelled(event.payload.subscription.entity);
                    break;
                case 'subscription.completed':
                    result = await this.handleSubscriptionCompleted(event.payload.subscription.entity);
                    break;
                case 'subscription.paused':
                    result = await this.handleSubscriptionPaused(event.payload.subscription.entity);
                    break;
                default:
                    result = { message: 'Event type not handled' };
            }

            // Store event as processed
            await WebhookEvent.create({
                eventId,
                eventType: event.event,
                processedAt: new Date(),
                payload: event,
                status: 'processed',
            });

            return result;
        } catch (error) {
            // Store failed event
            await WebhookEvent.create({
                eventId,
                eventType: event.event,
                processedAt: new Date(),
                payload: event,
                status: 'failed',
                error: error.message,
            });

            throw error;
        }
    }

    /**
     * Verify webhook signature using HMAC
     */
    verifyWebhookSignature(payload, signature) {
        const expectedSignature = crypto
            .createHmac('sha256', process.env.RAZORPAY_WEBHOOK_SECRET)
            .update(payload)
            .digest('hex');

        return expectedSignature === signature;
    }

    /**
     * Handle subscription activated event
     */
    async handleSubscriptionActivated(subscriptionData) {
        const subscription = await Subscription.findOne({
            razorpaySubscriptionId: subscriptionData.id,
        });

        if (!subscription) {
            throw new Error('Subscription not found');
        }

        // Update subscription status
        subscription.status = 'active';
        subscription.startDate = new Date(subscriptionData.start_at * 1000);
        subscription.endDate = new Date(subscriptionData.end_at * 1000);
        await subscription.save();

        // Update user's current plan
        await User.findByIdAndUpdate(subscription.userId, {
            currentPlan: subscription.plan,
        });

        return { message: 'Subscription activated', subscriptionId: subscription._id };
    }

    /**
     * Handle subscription charged event
     */
    async handleSubscriptionCharged(paymentData) {
        const subscription = await Subscription.findOne({
            razorpaySubscriptionId: paymentData.subscription_id,
        });

        if (!subscription) {
            throw new Error('Subscription not found');
        }

        // Update metadata with payment info
        subscription.metadata = {
            ...subscription.metadata,
            lastPayment: {
                id: paymentData.id,
                amount: paymentData.amount,
                status: paymentData.status,
                createdAt: new Date(paymentData.created_at * 1000),
            },
        };
        await subscription.save();

        return { message: 'Payment recorded', subscriptionId: subscription._id };
    }

    /**
     * Handle subscription cancelled event
     */
    async handleSubscriptionCancelled(subscriptionData) {
        const subscription = await Subscription.findOne({
            razorpaySubscriptionId: subscriptionData.id,
        });

        if (!subscription) {
            throw new Error('Subscription not found');
        }

        subscription.status = 'cancelled';
        subscription.cancelledAt = new Date();
        subscription.autoRenew = false;
        await subscription.save();

        // Downgrade user to free plan
        await User.findByIdAndUpdate(subscription.userId, {
            currentPlan: 'free',
        });

        return { message: 'Subscription cancelled', subscriptionId: subscription._id };
    }

    /**
     * Handle subscription completed event
     */
    async handleSubscriptionCompleted(subscriptionData) {
        const subscription = await Subscription.findOne({
            razorpaySubscriptionId: subscriptionData.id,
        });

        if (!subscription) {
            throw new Error('Subscription not found');
        }

        subscription.status = 'expired';
        await subscription.save();

        // Downgrade user to free plan
        await User.findByIdAndUpdate(subscription.userId, {
            currentPlan: 'free',
        });

        return { message: 'Subscription completed', subscriptionId: subscription._id };
    }

    /**
     * Handle subscription paused event
     */
    async handleSubscriptionPaused(subscriptionData) {
        const subscription = await Subscription.findOne({
            razorpaySubscriptionId: subscriptionData.id,
        });

        if (!subscription) {
            throw new Error('Subscription not found');
        }

        subscription.status = 'cancelled';
        await subscription.save();

        return { message: 'Subscription paused', subscriptionId: subscription._id };
    }

    /**
     * Cancel a subscription
     */
    async cancelSubscription(userId) {
        const subscription = await Subscription.findOne({
            userId,
            status: 'active',
        });

        if (!subscription) {
            throw new Error('No active subscription found');
        }

        // Cancel on Razorpay
        try {
            await razorpay.subscriptions.cancel(subscription.razorpaySubscriptionId);
        } catch (error) {
            throw new Error(`Failed to cancel subscription: ${error.message}`);
        }

        // Update local record
        subscription.status = 'cancelled';
        subscription.cancelledAt = new Date();
        subscription.autoRenew = false;
        await subscription.save();

        // Downgrade user
        await User.findByIdAndUpdate(userId, {
            currentPlan: 'free',
        });

        return subscription;
    }

    /**
     * Get subscription status for a user
     */
    async getSubscriptionStatus(userId) {
        const user = await User.findById(userId).populate('subscriptionId');

        if (!user.subscriptionId) {
            return {
                plan: 'free',
                status: 'active',
                features: PLANS.free.features,
            };
        }

        const subscription = user.subscriptionId;

        // Check if expired
        if (subscription.isExpired()) {
            subscription.status = 'expired';
            await subscription.save();

            await User.findByIdAndUpdate(userId, {
                currentPlan: 'free',
            });

            return {
                plan: 'free',
                status: 'expired',
                previousPlan: subscription.plan,
                expiredAt: subscription.endDate,
            };
        }

        return {
            plan: subscription.plan,
            status: subscription.status,
            startDate: subscription.startDate,
            endDate: subscription.endDate,
            autoRenew: subscription.autoRenew,
            features: PLANS[subscription.plan]?.features || [],
        };
    }

    /**
     * Upgrade subscription to a higher plan
     */
    async upgradeSubscription(userId, newPlan) {
        const plan = PLANS[newPlan];
        if (!plan || newPlan === 'free') {
            throw new Error('Invalid plan for upgrade');
        }

        // Cancel current subscription
        const currentSubscription = await Subscription.findOne({
            userId,
            status: 'active',
        });

        if (currentSubscription) {
            await this.cancelSubscription(userId);
        }

        // Create new subscription
        return await this.createSubscription(userId, newPlan);
    }
}

module.exports = new SubscriptionService();
