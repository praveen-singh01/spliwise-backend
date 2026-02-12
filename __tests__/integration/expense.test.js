const request = require('supertest');
const app = require('../../src/server');
const { connectTestDB, clearTestDB, closeTestDB } = require('../utils/testDb');
const { createTestUsers, generateTestToken } = require('../utils/fixtures');

describe('Expense API', () => {
    let token;
    let users;

    beforeAll(async () => {
        await connectTestDB();
    });

    beforeEach(async () => {
        await clearTestDB();
        users = await createTestUsers();
        token = generateTestToken(users[0]._id);
    });

    afterAll(async () => {
        await closeTestDB();
    });

    describe('POST /api/expenses', () => {
        test('should create expense with equal split', async () => {
            const res = await request(app)
                .post('/api/expenses')
                .set('Authorization', `Bearer ${token}`)
                .send({
                    description: 'Dinner',
                    amount: 300,
                    paidBy: users[0]._id.toString(),
                    participants: users.map((u) => u._id.toString()),
                    splitType: 'equal',
                });

            expect(res.status).toBe(201);
            expect(res.body.success).toBe(true);
            expect(res.body.data.splitDetails).toHaveLength(3);
            expect(res.body.data.splitDetails[0].amount).toBe(100);
        });

        test('should create expense with percentage split', async () => {
            const res = await request(app)
                .post('/api/expenses')
                .set('Authorization', `Bearer ${token}`)
                .send({
                    description: 'Rent',
                    amount: 1000,
                    paidBy: users[0]._id.toString(),
                    participants: [users[0]._id.toString(), users[1]._id.toString()],
                    splitType: 'percentage',
                    percentageSplits: [
                        { userId: users[0]._id.toString(), percentage: 60 },
                        { userId: users[1]._id.toString(), percentage: 40 },
                    ],
                });

            expect(res.status).toBe(201);
            expect(res.body.success).toBe(true);
            expect(res.body.data.splitDetails[0].amount).toBe(600);
            expect(res.body.data.splitDetails[1].amount).toBe(400);
        });

        test('should reject invalid percentage total', async () => {
            const res = await request(app)
                .post('/api/expenses')
                .set('Authorization', `Bearer ${token}`)
                .send({
                    description: 'Test',
                    amount: 1000,
                    paidBy: users[0]._id.toString(),
                    participants: [users[0]._id.toString(), users[1]._id.toString()],
                    splitType: 'percentage',
                    percentageSplits: [
                        { userId: users[0]._id.toString(), percentage: 50 },
                        { userId: users[1]._id.toString(), percentage: 40 },
                    ],
                });

            expect(res.status).toBe(500);
            expect(res.body.success).toBe(false);
        });

        test('should require authentication', async () => {
            const res = await request(app)
                .post('/api/expenses')
                .send({
                    description: 'Test',
                    amount: 100,
                    paidBy: users[0]._id.toString(),
                    participants: [users[0]._id.toString()],
                    splitType: 'equal',
                });

            expect(res.status).toBe(401);
        });
    });

    describe('GET /api/expenses', () => {
        beforeEach(async () => {
            // Create test expenses
            await request(app)
                .post('/api/expenses')
                .set('Authorization', `Bearer ${token}`)
                .send({
                    description: 'Expense 1',
                    amount: 100,
                    paidBy: users[0]._id.toString(),
                    participants: [users[0]._id.toString(), users[1]._id.toString()],
                    splitType: 'equal',
                });

            await request(app)
                .post('/api/expenses')
                .set('Authorization', `Bearer ${token}`)
                .send({
                    description: 'Expense 2',
                    amount: 200,
                    paidBy: users[1]._id.toString(),
                    participants: [users[1]._id.toString(), users[2]._id.toString()],
                    splitType: 'equal',
                });
        });

        test('should get all expenses', async () => {
            const res = await request(app)
                .get('/api/expenses')
                .set('Authorization', `Bearer ${token}`);

            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
            expect(res.body.count).toBe(2);
            expect(res.body.data).toHaveLength(2);
        });

        test('should filter expenses by user', async () => {
            const res = await request(app)
                .get(`/api/expenses?userId=${users[0]._id}`)
                .set('Authorization', `Bearer ${token}`);

            expect(res.status).toBe(200);
            expect(res.body.count).toBe(1);
        });
    });

    describe('PUT /api/expenses/:id', () => {
        let expenseId;

        beforeEach(async () => {
            const res = await request(app)
                .post('/api/expenses')
                .set('Authorization', `Bearer ${token}`)
                .send({
                    description: 'Original',
                    amount: 100,
                    paidBy: users[0]._id.toString(),
                    participants: [users[0]._id.toString()],
                    splitType: 'equal',
                });
            expenseId = res.body.data._id;
        });

        test('should update expense', async () => {
            const res = await request(app)
                .put(`/api/expenses/${expenseId}`)
                .set('Authorization', `Bearer ${token}`)
                .send({
                    description: 'Updated',
                    amount: 200,
                });

            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
            expect(res.body.data.description).toBe('Updated');
            expect(res.body.data.amount).toBe(200);
        });
    });

    describe('DELETE /api/expenses/:id', () => {
        let expenseId;

        beforeEach(async () => {
            const res = await request(app)
                .post('/api/expenses')
                .set('Authorization', `Bearer ${token}`)
                .send({
                    description: 'To Delete',
                    amount: 100,
                    paidBy: users[0]._id.toString(),
                    participants: [users[0]._id.toString()],
                    splitType: 'equal',
                });
            expenseId = res.body.data._id;
        });

        test('should soft delete expense', async () => {
            const res = await request(app)
                .delete(`/api/expenses/${expenseId}`)
                .set('Authorization', `Bearer ${token}`);

            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);

            // Verify expense is not in list
            const listRes = await request(app)
                .get('/api/expenses')
                .set('Authorization', `Bearer ${token}`);

            expect(listRes.body.count).toBe(0);
        });
    });

    describe('GET /api/balances', () => {
        beforeEach(async () => {
            // Create expenses to generate balances
            await request(app)
                .post('/api/expenses')
                .set('Authorization', `Bearer ${token}`)
                .send({
                    description: 'Expense 1',
                    amount: 300,
                    paidBy: users[0]._id.toString(),
                    participants: users.map((u) => u._id.toString()),
                    splitType: 'equal',
                });
        });

        test('should get settlement plan', async () => {
            const res = await request(app)
                .get('/api/balances')
                .set('Authorization', `Bearer ${token}`);

            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
            expect(res.body.data).toHaveProperty('balances');
            expect(res.body.data).toHaveProperty('settlements');
        });

        test('should get user-specific balances', async () => {
            const res = await request(app)
                .get(`/api/balances?userId=${users[1]._id}`)
                .set('Authorization', `Bearer ${token}`);

            expect(res.status).toBe(200);
            expect(res.body.data).toHaveProperty('netBalance');
            expect(res.body.data).toHaveProperty('owes');
            expect(res.body.data).toHaveProperty('owedBy');
        });
    });
});
