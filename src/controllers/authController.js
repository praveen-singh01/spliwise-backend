const authService = require('../services/authService');

class AuthController {
    /**
     * Signup new user
     * POST /api/auth/signup
     */
    async signup(req, res, next) {
        try {
            const result = await authService.signup(req.body);

            res.status(201).json({
                success: true,
                message: 'User registered successfully',
                data: result,
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Login user
     * POST /api/auth/login
     */
    async login(req, res, next) {
        try {
            const result = await authService.login(req.body);

            res.status(200).json({
                success: true,
                message: 'Login successful',
                data: result,
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Get current user profile
     * GET /api/auth/me
     */
    async getProfile(req, res, next) {
        try {
            const user = await authService.getUserById(req.user.userId);

            res.status(200).json({
                success: true,
                data: user,
            });
        } catch (error) {
            next(error);
        }
    }
}

module.exports = new AuthController();
