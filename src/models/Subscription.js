const mongoose = require('mongoose');

const subscriptionSchema = new mongoose.Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
            index: true,
        },
        plan: {
            type: String,
            enum: ['free', 'premium', 'enterprise'],
            required: true,
            default: 'free',
        },
        status: {
            type: String,
            enum: ['active', 'cancelled', 'expired', 'pending'],
            required: true,
            default: 'pending',
        },
        razorpaySubscriptionId: {
            type: String,
            sparse: true,
            index: true,
        },
        razorpayCustomerId: {
            type: String,
            sparse: true,
        },
        startDate: {
            type: Date,
        },
        endDate: {
            type: Date,
        },
        autoRenew: {
            type: Boolean,
            default: true,
        },
        cancelledAt: {
            type: Date,
        },
        metadata: {
            type: mongoose.Schema.Types.Mixed,
            default: {},
        },
    },
    {
        timestamps: true,
    }
);

// Index for efficient queries
subscriptionSchema.index({ userId: 1, status: 1 });
subscriptionSchema.index({ razorpaySubscriptionId: 1 });

// Check if subscription is expired
subscriptionSchema.methods.isExpired = function () {
    if (this.status === 'expired') return true;
    if (this.endDate && new Date() > this.endDate) {
        return true;
    }
    return false;
};

// Check if subscription is active
subscriptionSchema.methods.isActive = function () {
    return this.status === 'active' && !this.isExpired();
};

module.exports = mongoose.model('Subscription', subscriptionSchema);
