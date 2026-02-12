const mongoose = require('mongoose');

const webhookEventSchema = new mongoose.Schema(
    {
        eventId: {
            type: String,
            required: true,
            unique: true,
            index: true,
        },
        eventType: {
            type: String,
            required: true,
            index: true,
        },
        processedAt: {
            type: Date,
            required: true,
            default: Date.now,
        },
        payload: {
            type: mongoose.Schema.Types.Mixed,
            required: true,
        },
        status: {
            type: String,
            enum: ['processed', 'failed'],
            default: 'processed',
        },
        error: {
            type: String,
        },
    },
    {
        timestamps: true,
    }
);

// TTL index to auto-delete old events after 90 days
webhookEventSchema.index({ createdAt: 1 }, { expireAfterSeconds: 7776000 });

module.exports = mongoose.model('WebhookEvent', webhookEventSchema);
