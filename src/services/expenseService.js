const Expense = require('../models/Expense');
const User = require('../models/User');
const {
    calculateEqualSplit,
    calculatePercentageSplit,
    validateSplitDetails,
} = require('../utils/splitCalculator');
const {
    getSettlementPlan,
    getUserSettlements,
} = require('../utils/settlementOptimizer');

class ExpenseService {
    /**
     * Create a new expense
     * @param {Object} expenseData - Expense data
     * @param {String} expenseData.description - Expense description
     * @param {Number} expenseData.amount - Total amount
     * @param {String} expenseData.paidBy - User ID who paid
     * @param {Array} expenseData.participants - Array of participant user IDs
     * @param {String} expenseData.splitType - 'equal' or 'percentage'
     * @param {Array} expenseData.percentageSplits - For percentage split: [{userId, percentage}]
     * @returns {Object} Created expense
     */
    async createExpense(expenseData) {
        const {
            description,
            amount,
            paidBy,
            participants,
            splitType,
            percentageSplits,
            date,
        } = expenseData;

        // Validate payer exists
        const payer = await User.findById(paidBy);
        if (!payer) {
            throw new Error('Payer not found');
        }

        // Validate all participants exist
        const participantUsers = await User.find({ _id: { $in: participants } });
        if (participantUsers.length !== participants.length) {
            throw new Error('One or more participants not found');
        }

        // Calculate split details based on split type
        let splitDetails;

        if (splitType === 'equal') {
            splitDetails = calculateEqualSplit(amount, participants);
        } else if (splitType === 'percentage') {
            if (!percentageSplits || percentageSplits.length === 0) {
                throw new Error('Percentage splits are required for percentage split type');
            }
            splitDetails = calculatePercentageSplit(amount, percentageSplits);
        } else {
            throw new Error('Invalid split type. Must be "equal" or "percentage"');
        }

        // Validate split details
        validateSplitDetails(splitDetails, amount);

        // Create expense
        const expense = await Expense.create({
            description,
            amount,
            paidBy,
            participants,
            splitType,
            splitDetails,
            date: date || Date.now(),
        });

        // Populate user details
        await expense.populate('paidBy', 'name email');
        await expense.populate('participants', 'name email');
        await expense.populate('splitDetails.userId', 'name email');

        return expense;
    }

    /**
     * Get all expenses with optional filters
     * @param {Object} filters - Query filters
     * @param {String} filters.userId - Filter by participant or payer
     * @param {Date} filters.startDate - Filter by start date
     * @param {Date} filters.endDate - Filter by end date
     * @returns {Array} Array of expenses
     */
    async getExpenses(filters = {}) {
        const query = {};

        // Filter by user (either as payer or participant)
        if (filters.userId) {
            query.$or = [
                { paidBy: filters.userId },
                { participants: filters.userId },
            ];
        }

        // Filter by date range
        if (filters.startDate || filters.endDate) {
            query.date = {};
            if (filters.startDate) {
                query.date.$gte = new Date(filters.startDate);
            }
            if (filters.endDate) {
                query.date.$lte = new Date(filters.endDate);
            }
        }

        const expenses = await Expense.find(query)
            .populate('paidBy', 'name email')
            .populate('participants', 'name email')
            .populate('splitDetails.userId', 'name email')
            .sort({ date: -1 });

        return expenses;
    }

    /**
     * Get expense by ID
     * @param {String} expenseId - Expense ID
     * @returns {Object} Expense
     */
    async getExpenseById(expenseId) {
        const expense = await Expense.findById(expenseId)
            .populate('paidBy', 'name email')
            .populate('participants', 'name email')
            .populate('splitDetails.userId', 'name email');

        if (!expense) {
            throw new Error('Expense not found');
        }

        return expense;
    }

    /**
     * Update expense
     * @param {String} expenseId - Expense ID
     * @param {Object} updateData - Data to update
     * @returns {Object} Updated expense
     */
    async updateExpense(expenseId, updateData) {
        const expense = await Expense.findById(expenseId);
        if (!expense) {
            throw new Error('Expense not found');
        }

        const {
            description,
            amount,
            participants,
            splitType,
            percentageSplits,
            date,
        } = updateData;

        // Update basic fields
        if (description !== undefined) expense.description = description;
        if (date !== undefined) expense.date = date;

        // If amount, participants, or splitType changed, recalculate splits
        if (amount !== undefined || participants !== undefined || splitType !== undefined) {
            const newAmount = amount !== undefined ? amount : expense.amount;
            const newParticipants = participants !== undefined ? participants : expense.participants;
            const newSplitType = splitType !== undefined ? splitType : expense.splitType;

            // Validate participants exist
            if (participants !== undefined) {
                const participantUsers = await User.find({ _id: { $in: participants } });
                if (participantUsers.length !== participants.length) {
                    throw new Error('One or more participants not found');
                }
            }

            // Recalculate split details
            let splitDetails;
            if (newSplitType === 'equal') {
                splitDetails = calculateEqualSplit(newAmount, newParticipants);
            } else if (newSplitType === 'percentage') {
                if (!percentageSplits || percentageSplits.length === 0) {
                    throw new Error('Percentage splits are required for percentage split type');
                }
                splitDetails = calculatePercentageSplit(newAmount, percentageSplits);
            }

            expense.amount = newAmount;
            expense.participants = newParticipants;
            expense.splitType = newSplitType;
            expense.splitDetails = splitDetails;
        }

        await expense.save();

        // Populate user details
        await expense.populate('paidBy', 'name email');
        await expense.populate('participants', 'name email');
        await expense.populate('splitDetails.userId', 'name email');

        return expense;
    }

    /**
     * Soft delete expense
     * @param {String} expenseId - Expense ID
     * @returns {Object} Success message
     */
    async deleteExpense(expenseId) {
        const expense = await Expense.findById(expenseId);
        if (!expense) {
            throw new Error('Expense not found');
        }

        expense.isDeleted = true;
        await expense.save();

        return { message: 'Expense deleted successfully' };
    }

    /**
     * Get settlement-optimized balances
     * @param {String} userId - Optional: Get balances for specific user
     * @returns {Object} Balances and settlement plan
     */
    async getBalances(userId = null) {
        // Get all non-deleted expenses
        const query = userId
            ? {
                $or: [{ paidBy: userId }, { participants: userId }],
            }
            : {};

        const expenses = await Expense.find(query);

        if (userId) {
            // Get settlements for specific user
            const userSettlements = getUserSettlements(expenses, userId);
            return userSettlements;
        } else {
            // Get overall settlement plan
            const settlementPlan = getSettlementPlan(expenses);
            return settlementPlan;
        }
    }

    /**
     * Get expenses by group with pagination
     * @param {string} groupId - ID of the group
     * @param {string} userId - ID of the requesting user
     * @param {Object} options - Pagination options
     * @returns {Promise<Object>} Paginated expenses
     */
    async getExpensesByGroup(groupId, userId, options = {}) {
        const Group = require('../models/Group');

        // Verify group exists and user is a member
        const group = await Group.findOne({
            _id: groupId,
            isDeleted: false,
        });

        if (!group) {
            throw new Error('Group not found');
        }

        if (!group.isMember(userId)) {
            throw new Error('You are not a member of this group');
        }

        // Pagination
        const page = parseInt(options.page) || 1;
        const limit = parseInt(options.limit) || 10;
        const skip = (page - 1) * limit;

        // Get expenses for the group
        const expenses = await Expense.find({
            groupId,
            isDeleted: false,
        })
            .populate('paidBy', 'name email')
            .populate('participants', 'name email')
            .populate('splitDetails.userId', 'name email')
            .sort({ date: -1 })
            .skip(skip)
            .limit(limit);

        // Get total count
        const total = await Expense.countDocuments({
            groupId,
            isDeleted: false,
        });

        return {
            expenses,
            pagination: {
                page,
                limit,
                total,
                pages: Math.ceil(total / limit),
            },
        };
    }
}

module.exports = new ExpenseService();
