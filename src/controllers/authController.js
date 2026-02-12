const User = require('../models/User');

/**
 * Get all users (for participant selection)
 */
const getUsers = async (req, res, next) => {
    try {
        const users = await User.find().select('name email');
        res.status(200).json({
            success: true,
            count: users.length,
            data: users,
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Get current user profile
 */
const getProfile = async (req, res, next) => {
    try {
        const user = await User.findById(req.user.userId).select('-password');
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found',
            });
        }
        res.status(200).json({
            success: true,
            data: user,
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Signup user
 */
const signup = async (req, res, next) => {
    try {
        const authService = require('../services/authService');
        const { name, email, password } = req.body;

        const result = await authService.signup(name, email, password);

        res.status(201).json({
            success: true,
            data: result,
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Login user
 */
const login = async (req, res, next) => {
    try {
        const authService = require('../services/authService');
        const { email, password } = req.body;

        const result = await authService.login(email, password);

        res.status(200).json({
            success: true,
            data: result,
        });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    signup,
    login,
    getProfile,
    getUsers,
};
