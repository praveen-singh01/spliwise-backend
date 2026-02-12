/**
 * Query validation middleware factory
 * Similar to body validation but for query parameters
 * @param {Object} schema - Zod validation schema
 * @returns {Function} Express middleware
 */
const validateQuery = (schema) => {
    return async (req, res, next) => {
        try {
            // Validate query parameters against schema
            const validatedData = await schema.parseAsync(req.query);

            // Replace req.query with validated and sanitized data
            req.query = validatedData;

            next();
        } catch (error) {
            // Zod validation error
            if (error.errors) {
                const validationErrors = error.errors.map((err) => ({
                    field: err.path.join('.'),
                    message: err.message,
                }));

                return res.status(400).json({
                    success: false,
                    message: 'Query validation failed',
                    errors: validationErrors,
                });
            }

            // Other errors
            return res.status(400).json({
                success: false,
                message: 'Invalid query parameters',
            });
        }
    };
};

module.exports = validateQuery;
