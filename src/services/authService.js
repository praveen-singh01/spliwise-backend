const jwt = require('jsonwebtoken');
const User = require('../models/User');

class AuthService {
    /**
     * Generate JWT token
     * @param {Object} payload - Data to encode in token
     * @returns {String} JWT token
     */
    generateToken(payload) {
        return jwt.sign(payload, process.env.JWT_SECRET, {
            expiresIn: process.env.JWT_EXPIRY || '7d',
        });
    }

    /**
     * Verify JWT token
     * @param {String} token - JWT token to verify
     * @returns {Object} Decoded token payload
     */
    verifyToken(token) {
        try {
            return jwt.verify(token, process.env.JWT_SECRET);
        } catch (error) {
            throw new Error('Invalid or expired token');
        }
    }

    /**
     * Register new user
     * @param {Object} userData - User registration data
     * @returns {Object} User and token
     */
    async signup(userData) {
        const { name, email, password } = userData;

        // Check if user already exists
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            throw new Error('User already exists with this email');
        }

        // Create new user
        const user = await User.create({
            name,
            email,
            password,
        });

        // Generate token
        const token = this.generateToken({
            userId: user._id,
            email: user.email,
        });

        return {
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                subscription: user.subscription,
                currentPlan: user.currentPlan,
            },
            token,
        };
    }

    /**
     * Login user
     * @param {Object} credentials - Login credentials
     * @returns {Object} User and token
     */
    async login(credentials) {
        const { email, password } = credentials;

        // Find user with password field
        const user = await User.findOne({ email }).select('+password');
        if (!user) {
            throw new Error('Invalid email or password');
        }

        // Verify password
        const isPasswordValid = await user.comparePassword(password);
        if (!isPasswordValid) {
            throw new Error('Invalid email or password');
        }

        // Generate token
        const token = this.generateToken({
            userId: user._id,
            email: user.email,
        });

        return {
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                subscription: user.subscription,
                currentPlan: user.currentPlan,
            },
            token,
        };
    }

    /**
     * Get user by ID
     * @param {String} userId - User ID
     * @returns {Object} User data
     */
    async getUserById(userId) {
        const user = await User.findById(userId);
        if (!user) {
            throw new Error('User not found');
        }

        return {
            id: user._id,
            name: user.name,
            email: user.email,
        };
    }
}

module.exports = new AuthService();
