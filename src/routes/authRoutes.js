const express = require('express');
const authController = require('../controllers/authController');
const validate = require('../middlewares/validate');
const authenticate = require('../middlewares/auth');
const { signupSchema, loginSchema } = require('../utils/validation');

const router = express.Router();

/**
 * @route   POST /api/auth/signup
 * @desc    Register new user
 * @access  Public
 */
router.post(
    '/signup',
    validate(signupSchema),
    authController.signup
);

/**
 * @route   POST /api/auth/login
 * @desc    Login user
 * @access  Public
 */
router.post(
    '/login',
    validate(loginSchema),
    authController.login
);

/**
 * @route   GET /api/auth/me
 * @desc    Get current user profile
 * @access  Private
 */
router.get(
    '/me',
    authenticate,
    authController.getProfile
);

/**
 * @route   GET /api/auth/users
 * @desc    Get all users (for participant selection)
 * @access  Private
 */
router.get(
    '/users',
    authenticate,
    authController.getUsers
);

module.exports = router;
