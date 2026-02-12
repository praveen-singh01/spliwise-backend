const { z } = require('zod');

// Create expense validation schema
const createExpenseSchema = z.object({
    description: z
        .string()
        .min(3, 'Description must be at least 3 characters')
        .max(200, 'Description cannot exceed 200 characters')
        .trim(),
    amount: z
        .number()
        .positive('Amount must be greater than 0')
        .refine(
            (val) => /^\d+(\.\d{1,2})?$/.test(val.toString()),
            'Amount can have at most 2 decimal places'
        ),
    paidBy: z
        .string()
        .regex(/^[0-9a-fA-F]{24}$/, 'Invalid payer ID format'),
    participants: z
        .array(z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid participant ID format'))
        .min(1, 'At least one participant is required'),
    splitType: z
        .enum(['equal', 'percentage'], {
            errorMap: () => ({ message: 'Split type must be either "equal" or "percentage"' }),
        }),
    percentageSplits: z
        .array(
            z.object({
                userId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid user ID format'),
                percentage: z
                    .number()
                    .min(0, 'Percentage cannot be negative')
                    .max(100, 'Percentage cannot exceed 100'),
            })
        )
        .optional(),
    date: z
        .string()
        .datetime()
        .optional()
        .or(z.date().optional()),
});

// Update expense validation schema
const updateExpenseSchema = z.object({
    description: z
        .string()
        .min(3, 'Description must be at least 3 characters')
        .max(200, 'Description cannot exceed 200 characters')
        .trim()
        .optional(),
    amount: z
        .number()
        .positive('Amount must be greater than 0')
        .refine(
            (val) => /^\d+(\.\d{1,2})?$/.test(val.toString()),
            'Amount can have at most 2 decimal places'
        )
        .optional(),
    participants: z
        .array(z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid participant ID format'))
        .min(1, 'At least one participant is required')
        .optional(),
    splitType: z
        .enum(['equal', 'percentage'], {
            errorMap: () => ({ message: 'Split type must be either "equal" or "percentage"' }),
        })
        .optional(),
    percentageSplits: z
        .array(
            z.object({
                userId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid user ID format'),
                percentage: z
                    .number()
                    .min(0, 'Percentage cannot be negative')
                    .max(100, 'Percentage cannot exceed 100'),
            })
        )
        .optional(),
    date: z
        .string()
        .datetime()
        .optional()
        .or(z.date().optional()),
});

// Get expenses query validation schema
const getExpensesQuerySchema = z.object({
    userId: z
        .string()
        .regex(/^[0-9a-fA-F]{24}$/, 'Invalid user ID format')
        .optional(),
    startDate: z
        .string()
        .datetime()
        .optional(),
    endDate: z
        .string()
        .datetime()
        .optional(),
});

// Get balances query validation schema
const getBalancesQuerySchema = z.object({
    userId: z
        .string()
        .regex(/^[0-9a-fA-F]{24}$/, 'Invalid user ID format')
        .optional(),
});

module.exports = {
    createExpenseSchema,
    updateExpenseSchema,
    getExpensesQuerySchema,
    getBalancesQuerySchema,
};
