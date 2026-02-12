const express = require('express');
const expenseController = require('../controllers/expenseController');
const validate = require('../middlewares/validate');
const validateQuery = require('../middlewares/validateQuery');
const authenticate = require('../middlewares/auth');
const {
    createExpenseSchema,
    updateExpenseSchema,
    getExpensesQuerySchema,
    getBalancesQuerySchema,
} = require('../utils/expenseValidation');

const router = express.Router();

// All expense routes require authentication
router.use(authenticate);

/**
 * @route   POST /api/expenses
 * @desc    Create a new expense
 * @access  Private
 */
router.post(
    '/',
    validate(createExpenseSchema),
    expenseController.createExpense.bind(expenseController)
);

/**
 * @route   GET /api/expenses
 * @desc    Get all expenses with optional filters
 * @access  Private
 */
router.get(
    '/',
    validateQuery(getExpensesQuerySchema),
    expenseController.getExpenses.bind(expenseController)
);

/**
 * @route   GET /api/expenses/:id
 * @desc    Get expense by ID
 * @access  Private
 */
router.get(
    '/:id',
    expenseController.getExpenseById.bind(expenseController)
);

/**
 * @route   PUT /api/expenses/:id
 * @desc    Update expense
 * @access  Private
 */
router.put(
    '/:id',
    validate(updateExpenseSchema),
    expenseController.updateExpense.bind(expenseController)
);

/**
 * @route   DELETE /api/expenses/:id
 * @desc    Soft delete expense
 * @access  Private
 */
router.delete(
    '/:id',
    expenseController.deleteExpense.bind(expenseController)
);

module.exports = router;
