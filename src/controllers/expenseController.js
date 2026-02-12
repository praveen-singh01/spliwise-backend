const expenseService = require('../services/expenseService');
const { emitExpenseCreated, emitBalanceUpdated } = require('../socket/events');

class ExpenseController {
    /**
     * Create a new expense
     * POST /api/expenses
     */
    async createExpense(req, res, next) {
        try {
            const expense = await expenseService.createExpense(req.body);

            // Emit real-time event if expense belongs to a group
            if (expense.groupId) {
                emitExpenseCreated(expense.groupId, expense, req.user.userId);
            }

            res.status(201).json({
                success: true,
                message: 'Expense created successfully',
                data: expense,
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Get all expenses with optional filters
     * GET /api/expenses
     */
    async getExpenses(req, res, next) {
        try {
            const filters = req.query;
            const expenses = await expenseService.getExpenses(filters);

            res.status(200).json({
                success: true,
                count: expenses.length,
                data: expenses,
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Get expense by ID
     * GET /api/expenses/:id
     */
    async getExpenseById(req, res, next) {
        try {
            const expense = await expenseService.getExpenseById(req.params.id);

            res.status(200).json({
                success: true,
                data: expense,
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Update expense
     * PUT /api/expenses/:id
     */
    async updateExpense(req, res, next) {
        try {
            const expense = await expenseService.updateExpense(
                req.params.id,
                req.body
            );

            // Emit real-time event if expense belongs to a group
            if (expense.groupId) {
                emitBalanceUpdated(expense.groupId, 'Expense updated');
            }

            res.status(200).json({
                success: true,
                message: 'Expense updated successfully',
                data: expense,
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Soft delete expense
     * DELETE /api/expenses/:id
     */
    async deleteExpense(req, res, next) {
        try {
            // Get expense before deleting to check groupId
            const expense = await expenseService.getExpenseById(req.params.id);
            const groupId = expense.groupId;

            const result = await expenseService.deleteExpense(req.params.id);

            // Emit real-time event if expense belonged to a group
            if (groupId) {
                emitBalanceUpdated(groupId, 'Expense deleted');
            }

            res.status(200).json({
                success: true,
                message: result.message,
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Get settlement-optimized balances
     * GET /api/balances
     */
    async getBalances(req, res, next) {
        try {
            const { userId } = req.query;
            const balances = await expenseService.getBalances(userId);

            res.status(200).json({
                success: true,
                data: balances,
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Get expenses by group with pagination
     */
    async getExpensesByGroup(req, res, next) {
        try {
            const { groupId } = req.params;
            const { page, limit } = req.query;

            const result = await expenseService.getExpensesByGroup(
                groupId,
                req.user.userId,
                { page, limit }
            );

            res.status(200).json({
                success: true,
                data: result.expenses,
                pagination: result.pagination,
            });
        } catch (error) {
            next(error);
        }
    }
}

module.exports = new ExpenseController();
