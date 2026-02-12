const express = require('express');
const expenseController = require('../controllers/expenseController');
const validateQuery = require('../middlewares/validateQuery');
const authenticate = require('../middlewares/auth');
const { getBalancesQuerySchema } = require('../utils/expenseValidation');

const router = express.Router();

// All balance routes require authentication
router.use(authenticate);

/**
 * @route   GET /api/balances
 * @desc    Get settlement-optimized balances
 * @access  Private
 */
router.get(
    '/',
    validateQuery(getBalancesQuerySchema),
    expenseController.getBalances.bind(expenseController)
);

module.exports = router;
