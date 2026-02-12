/**
 * Validation middleware factory
 * @param {Object} schema - Zod validation schema
 * @returns {Function} Express middleware
 */
const validate = (schema) => {
    return async (req, res, next) => {
        try {
            // Validate request body against schema
            const validatedData = await schema.parseAsync(req.body);

            // Replace req.body with validated and sanitized data
            req.body = validatedData;

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
                    message: 'Validation failed',
                    errors: validationErrors,
                });
            }

            // Other errors
            return res.status(400).json({
                success: false,
                message: 'Invalid request data',
            });
        }
    };
};

module.exports = validate;
