const {
    calculateEqualSplit,
    calculatePercentageSplit,
    validateSplitDetails,
} = require('../../src/utils/splitCalculator');

describe('Split Calculator', () => {
    describe('calculateEqualSplit', () => {
        test('should split amount equally among participants', () => {
            const result = calculateEqualSplit(100, ['user1', 'user2', 'user3']);

            expect(result).toHaveLength(3);
            expect(result[0].amount).toBe(33.34);
            expect(result[1].amount).toBe(33.33);
            expect(result[2].amount).toBe(33.33);

            // Verify total
            const total = result.reduce((sum, split) => sum + split.amount, 0);
            expect(total).toBe(100);
        });

        test('should handle 2 participants', () => {
            const result = calculateEqualSplit(1000, ['user1', 'user2']);

            expect(result).toHaveLength(2);
            expect(result[0].amount).toBe(500);
            expect(result[1].amount).toBe(500);
        });

        test('should distribute remainder cents fairly', () => {
            const result = calculateEqualSplit(10, ['user1', 'user2', 'user3']);

            expect(result[0].amount).toBe(3.34);
            expect(result[1].amount).toBe(3.33);
            expect(result[2].amount).toBe(3.33);

            const total = result.reduce((sum, split) => sum + split.amount, 0);
            expect(total).toBe(10);
        });

        test('should throw error for empty participants', () => {
            expect(() => calculateEqualSplit(100, [])).toThrow(
                'At least one participant is required'
            );
        });

        test('should throw error for zero amount', () => {
            expect(() => calculateEqualSplit(0, ['user1'])).toThrow(
                'Total amount must be greater than 0'
            );
        });
    });

    describe('calculatePercentageSplit', () => {
        test('should split amount by percentages', () => {
            const percentageSplits = [
                { userId: 'user1', percentage: 50 },
                { userId: 'user2', percentage: 30 },
                { userId: 'user3', percentage: 20 },
            ];

            const result = calculatePercentageSplit(1000, percentageSplits);

            expect(result).toHaveLength(3);
            expect(result[0].amount).toBe(500);
            expect(result[1].amount).toBe(300);
            expect(result[2].amount).toBe(200);
        });

        test('should handle decimal percentages', () => {
            const percentageSplits = [
                { userId: 'user1', percentage: 33.33 },
                { userId: 'user2', percentage: 33.33 },
                { userId: 'user3', percentage: 33.34 },
            ];

            const result = calculatePercentageSplit(1000, percentageSplits);

            const total = result.reduce((sum, split) => sum + split.amount, 0);
            expect(total).toBe(1000);
        });

        test('should throw error if percentages do not sum to 100', () => {
            const percentageSplits = [
                { userId: 'user1', percentage: 50 },
                { userId: 'user2', percentage: 40 },
            ];

            expect(() => calculatePercentageSplit(1000, percentageSplits)).toThrow(
                'Percentages must sum to 100%'
            );
        });

        test('should throw error for invalid percentage range', () => {
            const percentageSplits = [
                { userId: 'user1', percentage: 150 },
                { userId: 'user2', percentage: -50 },
            ];

            expect(() => calculatePercentageSplit(1000, percentageSplits)).toThrow(
                'Each percentage must be between 0 and 100'
            );
        });
    });

    describe('validateSplitDetails', () => {
        test('should validate correct split details', () => {
            const splitDetails = [
                { userId: 'user1', amount: 50 },
                { userId: 'user2', amount: 50 },
            ];

            expect(() => validateSplitDetails(splitDetails, 100)).not.toThrow();
        });

        test('should throw error if split does not match total', () => {
            const splitDetails = [
                { userId: 'user1', amount: 50 },
                { userId: 'user2', amount: 40 },
            ];

            expect(() => validateSplitDetails(splitDetails, 100)).toThrow(
                'Split amounts (90.00) must equal total amount (100.00)'
            );
        });

        test('should allow small rounding errors', () => {
            const splitDetails = [
                { userId: 'user1', amount: 33.33 },
                { userId: 'user2', amount: 33.33 },
                { userId: 'user3', amount: 33.33 },
            ];

            // Total is 99.99, but should be accepted (within 0.01 tolerance)
            expect(() => validateSplitDetails(splitDetails, 99.99)).not.toThrow();
        });
    });
});
