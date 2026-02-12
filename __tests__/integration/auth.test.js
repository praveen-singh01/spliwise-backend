const request = require('supertest');
const app = require('../../src/server');
const { connectTestDB, clearTestDB, closeTestDB } = require('../utils/testDb');

describe('Auth API', () => {
    beforeAll(async () => {
        await connectTestDB();
    });

    afterEach(async () => {
        await clearTestDB();
    });

    afterAll(async () => {
        await closeTestDB();
    });

    describe('POST /api/auth/signup', () => {
        test('should register a new user', async () => {
            const res = await request(app)
                .post('/api/auth/signup')
                .send({
                    name: 'John Doe',
                    email: 'john@test.com',
                    password: 'password123',
                });

            expect(res.status).toBe(201);
            expect(res.body.success).toBe(true);
            expect(res.body.data).toHaveProperty('user');
            expect(res.body.data).toHaveProperty('token');
            expect(res.body.data.user.email).toBe('john@test.com');
        });

        test('should reject duplicate email', async () => {
            // Create first user
            await request(app).post('/api/auth/signup').send({
                name: 'John Doe',
                email: 'john@test.com',
                password: 'password123',
            });

            // Try to create duplicate
            const res = await request(app)
                .post('/api/auth/signup')
                .send({
                    name: 'Jane Doe',
                    email: 'john@test.com',
                    password: 'password456',
                });

            expect(res.status).toBe(500);
            expect(res.body.success).toBe(false);
        });

        test('should validate required fields', async () => {
            const res = await request(app)
                .post('/api/auth/signup')
                .send({
                    email: 'john@test.com',
                    // Missing name and password
                });

            expect(res.status).toBe(400);
            expect(res.body.success).toBe(false);
            expect(res.body.errors).toBeDefined();
        });
    });

    describe('POST /api/auth/login', () => {
        beforeEach(async () => {
            // Create test user
            await request(app).post('/api/auth/signup').send({
                name: 'John Doe',
                email: 'john@test.com',
                password: 'password123',
            });
        });

        test('should login with correct credentials', async () => {
            const res = await request(app)
                .post('/api/auth/login')
                .send({
                    email: 'john@test.com',
                    password: 'password123',
                });

            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
            expect(res.body.data).toHaveProperty('token');
        });

        test('should reject invalid password', async () => {
            const res = await request(app)
                .post('/api/auth/login')
                .send({
                    email: 'john@test.com',
                    password: 'wrongpassword',
                });

            expect(res.status).toBe(500);
            expect(res.body.success).toBe(false);
        });

        test('should reject non-existent user', async () => {
            const res = await request(app)
                .post('/api/auth/login')
                .send({
                    email: 'nonexistent@test.com',
                    password: 'password123',
                });

            expect(res.status).toBe(500);
            expect(res.body.success).toBe(false);
        });
    });

    describe('GET /api/auth/me', () => {
        let token;

        beforeEach(async () => {
            const res = await request(app).post('/api/auth/signup').send({
                name: 'John Doe',
                email: 'john@test.com',
                password: 'password123',
            });
            token = res.body.data.token;
        });

        test('should get user profile with valid token', async () => {
            const res = await request(app)
                .get('/api/auth/me')
                .set('Authorization', `Bearer ${token}`);

            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
            expect(res.body.data.email).toBe('john@test.com');
        });

        test('should reject request without token', async () => {
            const res = await request(app).get('/api/auth/me');

            expect(res.status).toBe(401);
            expect(res.body.success).toBe(false);
        });

        test('should reject invalid token', async () => {
            const res = await request(app)
                .get('/api/auth/me')
                .set('Authorization', 'Bearer invalidtoken');

            expect(res.status).toBe(401);
            expect(res.body.success).toBe(false);
        });
    });
});
