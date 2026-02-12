const {
    calculateNetBalances,
    optimizeSettlements,
    getSettlementPlan,
} = require('../../src/utils/settlementOptimizer');

describe('Settlement Optimizer', () => {
    describe('calculateNetBalances', () => {
        test('should calculate net balances correctly', () => {
            const expenses = [
                {
                    amount: 300,
                    paidBy: 'alice',
                    splitDetails: [
                        { userId: 'alice', amount: 100 },
                        { userId: 'bob', amount: 100 },
                        { userId: 'carol', amount: 100 },
                    ],
                },
                {
                    amount: 150,
                    paidBy: 'bob',
                    splitDetails: [
                        { userId: 'bob', amount: 75 },
                        { userId: 'carol', amount: 75 },
                    ],
                },
            ];

            const balances = calculateNetBalances(expenses);

            expect(balances.alice).toBe(200); // Paid 300, owes 100
            expect(balances.bob).toBe(-25); // Paid 150, owes 175
            expect(balances.carol).toBe(-175); // Paid 0, owes 175
        });

        test('should handle single expense', () => {
            const expenses = [
                {
                    amount: 100,
                    paidBy: 'alice',
                    splitDetails: [
                        { userId: 'alice', amount: 50 },
                        { userId: 'bob', amount: 50 },
                    ],
                },
            ];

            const balances = calculateNetBalances(expenses);

            expect(balances.alice).toBe(50);
            expect(balances.bob).toBe(-50);
        });
    });

    describe('optimizeSettlements', () => {
        test('should minimize number of transactions', () => {
            const balances = {
                alice: 200,
                bob: -25,
                carol: -175,
            };

            const settlements = optimizeSettlements(balances);

            // Should need only 2 transactions instead of 4
            expect(settlements).toHaveLength(2);

            // Verify settlements
            expect(settlements).toContainEqual({
                from: 'carol',
                to: 'alice',
                amount: 175,
            });
            expect(settlements).toContainEqual({
                from: 'bob',
                to: 'alice',
                amount: 25,
            });
        });

        test('should handle balanced scenario', () => {
            const balances = {
                alice: 0,
                bob: 0,
                carol: 0,
            };

            const settlements = optimizeSettlements(balances);

            expect(settlements).toHaveLength(0);
        });

        test('should handle complex scenario', () => {
            const balances = {
                alice: 100,
                bob: 50,
                carol: -75,
                dave: -75,
            };

            const settlements = optimizeSettlements(balances);

            // Verify total settlements balance out
            const totalFrom = settlements.reduce((sum, s) => sum + s.amount, 0);
            const totalTo = settlements.reduce((sum, s) => sum + s.amount, 0);
            expect(totalFrom).toBe(totalTo);
        });
    });

    describe('getSettlementPlan', () => {
        test('should return complete settlement plan', () => {
            const expenses = [
                {
                    amount: 300,
                    paidBy: 'alice',
                    splitDetails: [
                        { userId: 'alice', amount: 100 },
                        { userId: 'bob', amount: 100 },
                        { userId: 'carol', amount: 100 },
                    ],
                },
            ];

            const plan = getSettlementPlan(expenses);

            expect(plan).toHaveProperty('balances');
            expect(plan).toHaveProperty('settlements');
            expect(plan.balances.alice).toBe(200);
            expect(plan.settlements.length).toBeGreaterThan(0);
        });

        test('should handle empty expenses', () => {
            const plan = getSettlementPlan([]);

            expect(plan.balances).toEqual({});
            expect(plan.settlements).toEqual([]);
        });
    });
});
