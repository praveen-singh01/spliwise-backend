/**
 * Settlement Optimization Algorithm
 * Minimizes the number of transactions needed to settle all debts
 * Uses a greedy approach to match largest debtor with largest creditor
 */

/**
 * Calculate net balances for all users from expenses
 * @param {Array} expenses - Array of expense objects
 * @returns {Object} Map of userId to net balance (positive = owed, negative = owes)
 */
const calculateNetBalances = (expenses) => {
    const balances = {};

    expenses.forEach((expense) => {
        const paidBy = expense.paidBy.toString();
        const amount = expense.amount;

        // Initialize payer balance if not exists
        if (!balances[paidBy]) {
            balances[paidBy] = 0;
        }

        // Payer gets credited the full amount
        balances[paidBy] += amount;

        // Deduct each participant's share
        expense.splitDetails.forEach((split) => {
            const userId = split.userId.toString();

            if (!balances[userId]) {
                balances[userId] = 0;
            }

            balances[userId] -= split.amount;
        });
    });

    return balances;
};

/**
 * Optimize settlements to minimize number of transactions
 * @param {Object} balances - Map of userId to net balance
 * @returns {Array} Array of settlement transactions {from, to, amount}
 */
const optimizeSettlements = (balances) => {
    // Separate debtors (owe money) and creditors (are owed money)
    const debtors = [];
    const creditors = [];

    Object.entries(balances).forEach(([userId, balance]) => {
        // Round to 2 decimal places to avoid floating point issues
        const roundedBalance = Math.round(balance * 100) / 100;

        if (roundedBalance < -0.01) {
            // User owes money
            debtors.push({ userId, amount: Math.abs(roundedBalance) });
        } else if (roundedBalance > 0.01) {
            // User is owed money
            creditors.push({ userId, amount: roundedBalance });
        }
    });

    // Sort in descending order for greedy matching
    debtors.sort((a, b) => b.amount - a.amount);
    creditors.sort((a, b) => b.amount - a.amount);

    const settlements = [];
    let debtorIndex = 0;
    let creditorIndex = 0;

    // Greedy algorithm: match largest debtor with largest creditor
    while (debtorIndex < debtors.length && creditorIndex < creditors.length) {
        const debtor = debtors[debtorIndex];
        const creditor = creditors[creditorIndex];

        // Calculate settlement amount (minimum of what debtor owes and creditor is owed)
        const settlementAmount = Math.min(debtor.amount, creditor.amount);
        const roundedAmount = Math.round(settlementAmount * 100) / 100;

        if (roundedAmount > 0.01) {
            settlements.push({
                from: debtor.userId,
                to: creditor.userId,
                amount: roundedAmount,
            });
        }

        // Update remaining amounts
        debtor.amount = Math.round((debtor.amount - settlementAmount) * 100) / 100;
        creditor.amount = Math.round((creditor.amount - settlementAmount) * 100) / 100;

        // Move to next debtor/creditor if current one is settled
        if (debtor.amount < 0.01) {
            debtorIndex++;
        }
        if (creditor.amount < 0.01) {
            creditorIndex++;
        }
    }

    return settlements;
};

/**
 * Get optimized settlement plan from expenses
 * @param {Array} expenses - Array of expense objects
 * @returns {Object} { balances, settlements }
 */
const getSettlementPlan = (expenses) => {
    if (!expenses || expenses.length === 0) {
        return {
            balances: {},
            settlements: [],
        };
    }

    const balances = calculateNetBalances(expenses);
    const settlements = optimizeSettlements(balances);

    return {
        balances,
        settlements,
    };
};

/**
 * Get settlement plan for specific user
 * @param {Array} expenses - Array of expense objects
 * @param {String} userId - User ID to get settlements for
 * @returns {Object} { owes: [], owedBy: [], netBalance }
 */
const getUserSettlements = (expenses, userId) => {
    const { balances, settlements } = getSettlementPlan(expenses);

    const userBalance = balances[userId] || 0;
    const owes = settlements.filter((s) => s.from === userId);
    const owedBy = settlements.filter((s) => s.to === userId);

    return {
        netBalance: Math.round(userBalance * 100) / 100,
        owes,
        owedBy,
    };
};

module.exports = {
    calculateNetBalances,
    optimizeSettlements,
    getSettlementPlan,
    getUserSettlements,
};
