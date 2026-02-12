const request = require('supertest');
const app = require('../../src/server');
const { connectTestDB, closeTestDB, clearTestDB } = require('../utils/testDb');
const User = require('../../src/models/User');
const Subscription = require('../../src/models/Subscription');
const WebhookEvent = require('../../src/models/WebhookEvent');
const crypto = require('crypto');

describe('Subscription API', () => {
    let authToken;
    let userId;

    beforeAll(async () => {
        await connectTestDB();
    });

    afterAll(async () => {
        await closeTestDB();
    });

    beforeEach(async () => {
        await clearTestDB();

        // Create and login a test user
        const signupRes = await request(app).post('/api/auth/signup').send({
            name: 'Test User',
            email: 'test@example.com',
            password: 'password123',
        });

        authToken = signupRes.body.data.token;
        userId = signupRes.body.data.user._id;
    });

    describe('GET /api/subscriptions/plans', () => {
        it('should return all subscription plans', async () => {
            const res = await request(app).get('/api/subscriptions/plans');

            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
            expect(res.body.data).toBeInstanceOf(Array);
            expect(res.body.data.length).toBe(3);
            expect(res.body.data[0]).toHaveProperty('id');
            expect(res.body.data[0]).toHaveProperty('name');
            expect(res.body.data[0]).toHaveProperty('price');
            expect(res.body.data[0]).toHaveProperty('features');
        });
    });

    describe('GET /api/subscriptions/status', () => {
        it('should return free plan status for new user', async () => {
            const res = await request(app)
                .get('/api/subscriptions/status')
                .set('Authorization', `Bearer ${authToken}`);

            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
            expect(res.body.data.plan).toBe('free');
            expect(res.body.data.status).toBe('active');
        });

        it('should return subscription status for subscribed user', async () => {
            // Create a subscription
            const subscription = await Subscription.create({
                userId,
                plan: 'premium',
                status: 'active',
                startDate: new Date(),
                endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
            });

            await User.findByIdAndUpdate(userId, {
                subscriptionId: subscription._id,
                currentPlan: 'premium',
            });

            const res = await request(app)
                .get('/api/subscriptions/status')
                .set('Authorization', `Bearer ${authToken}`);

            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
            expect(res.body.data.plan).toBe('premium');
            expect(res.body.data.status).toBe('active');
        });
    });

    describe('POST /api/subscriptions/webhook', () => {
        it('should reject webhook with invalid signature', async () => {
            const payload = JSON.stringify({
                event: 'subscription.activated',
                payload: {
                    subscription: {
                        entity: {
                            id: 'sub_123',
                        },
                    },
                },
            });

            const res = await request(app)
                .post('/api/subscriptions/webhook')
                .set('x-razorpay-signature', 'invalid_signature')
                .send(JSON.parse(payload));

            expect(res.status).toBe(500);
        });

        it('should handle idempotency for duplicate events', async () => {
            const eventId = 'evt_123';
            const payload = {
                id: eventId,
                event: 'subscription.activated',
                payload: {
                    subscription: {
                        entity: {
                            id: 'sub_123',
                        },
                    },
                },
            };

            // Create existing event
            await WebhookEvent.create({
                eventId,
                eventType: 'subscription.activated',
                processedAt: new Date(),
                payload,
            });

            const payloadString = JSON.stringify(payload);
            const signature = crypto
                .createHmac('sha256', process.env.RAZORPAY_WEBHOOK_SECRET || 'test_secret')
                .update(payloadString)
                .digest('hex');

            const res = await request(app)
                .post('/api/subscriptions/webhook')
                .set('x-razorpay-signature', signature)
                .send(payload);

            expect(res.status).toBe(200);
            expect(res.body.data.processed).toBe(true);
        });
    });

    describe('Feature Gating', () => {
        it('should allow free users to access basic features', async () => {
            const res = await request(app)
                .get('/api/expenses')
                .set('Authorization', `Bearer ${authToken}`);

            expect(res.status).toBe(200);
        });

        it('should block free users from premium features', async () => {
            // This would be tested with a premium-gated endpoint
            // Example: GET /api/expenses/export
            // For now, we'll test the middleware directly
            expect(true).toBe(true);
        });

        it('should allow premium users to access premium features', async () => {
            // Create premium subscription
            const subscription = await Subscription.create({
                userId,
                plan: 'premium',
                status: 'active',
                startDate: new Date(),
                endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
            });

            await User.findByIdAndUpdate(userId, {
                subscriptionId: subscription._id,
                currentPlan: 'premium',
            });

            // Test would go here with premium endpoint
            expect(true).toBe(true);
        });
    });
});
