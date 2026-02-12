const { z } = require('zod');

// Create group validation schema
const createGroupSchema = z.object({
    name: z
        .string()
        .min(2, 'Group name must be at least 2 characters')
        .max(100, 'Group name cannot exceed 100 characters')
        .trim(),
    description: z
        .string()
        .max(500, 'Description cannot exceed 500 characters')
        .trim()
        .optional(),
    members: z
        .array(
            z
                .string()
                .regex(/^[0-9a-fA-F]{24}$/, 'Invalid user ID format')
        )
        .min(1, 'At least one member is required'),
});

// Update group validation schema
const updateGroupSchema = z.object({
    name: z
        .string()
        .min(2, 'Group name must be at least 2 characters')
        .max(100, 'Group name cannot exceed 100 characters')
        .trim()
        .optional(),
    description: z
        .string()
        .max(500, 'Description cannot exceed 500 characters')
        .trim()
        .optional(),
    members: z
        .array(
            z
                .string()
                .regex(/^[0-9a-fA-F]{24}$/, 'Invalid user ID format')
        )
        .min(1, 'At least one member is required')
        .optional(),
});

// Add member validation schema
const addMemberSchema = z.object({
    userId: z
        .string()
        .regex(/^[0-9a-fA-F]{24}$/, 'Invalid user ID format'),
});

// Get group expenses query validation schema
const getGroupExpensesQuerySchema = z.object({
    page: z
        .string()
        .regex(/^\d+$/, 'Page must be a number')
        .optional(),
    limit: z
        .string()
        .regex(/^\d+$/, 'Limit must be a number')
        .optional(),
});

module.exports = {
    createGroupSchema,
    updateGroupSchema,
    addMemberSchema,
    getGroupExpensesQuerySchema,
};
