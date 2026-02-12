/**
 * Split Calculator Utility
 * Handles equal and percentage-based expense splitting
 */

/**
 * Calculate equal split for all participants
 * @param {Number} totalAmount - Total expense amount
 * @param {Array} participantIds - Array of user IDs
 * @returns {Array} Split details with userId and amount
 */
const calculateEqualSplit = (totalAmount, participantIds) => {
    if (!participantIds || participantIds.length === 0) {
        throw new Error('At least one participant is required');
    }

    if (totalAmount <= 0) {
        throw new Error('Total amount must be greater than 0');
    }

    const participantCount = participantIds.length;
    const baseAmount = Math.floor((totalAmount * 100) / participantCount) / 100;

    // Calculate remainder to distribute
    let totalAllocated = baseAmount * participantCount;
    let remainder = Math.round((totalAmount - totalAllocated) * 100) / 100;

    const splitDetails = participantIds.map((userId, index) => {
        let amount = baseAmount;

        // Distribute remainder cents to first few participants
        if (remainder > 0) {
            amount += 0.01;
            remainder = Math.round((remainder - 0.01) * 100) / 100;
        }

        return {
            userId,
            amount: Math.round(amount * 100) / 100,
        };
    });

    return splitDetails;
};

/**
 * Calculate percentage-based split
 * @param {Number} totalAmount - Total expense amount
 * @param {Array} percentageSplits - Array of {userId, percentage}
 * @returns {Array} Split details with userId and amount
 */
const calculatePercentageSplit = (totalAmount, percentageSplits) => {
    if (!percentageSplits || percentageSplits.length === 0) {
        throw new Error('At least one percentage split is required');
    }

    if (totalAmount <= 0) {
        throw new Error('Total amount must be greater than 0');
    }

    // Validate percentages
    const totalPercentage = percentageSplits.reduce(
        (sum, split) => sum + split.percentage,
        0
    );

    // Allow small rounding errors (0.01%)
    if (Math.abs(totalPercentage - 100) > 0.01) {
        throw new Error(
            `Percentages must sum to 100%. Current total: ${totalPercentage.toFixed(2)}%`
        );
    }

    // Validate individual percentages
    percentageSplits.forEach((split) => {
        if (split.percentage < 0 || split.percentage > 100) {
            throw new Error('Each percentage must be between 0 and 100');
        }
    });

    // Calculate amounts
    let totalAllocated = 0;
    const splitDetails = percentageSplits.map((split, index) => {
        let amount;

        // For the last participant, use remaining amount to avoid rounding errors
        if (index === percentageSplits.length - 1) {
            amount = Math.round((totalAmount - totalAllocated) * 100) / 100;
        } else {
            amount = Math.round((totalAmount * split.percentage) / 100 * 100) / 100;
            totalAllocated += amount;
        }

        return {
            userId: split.userId,
            amount,
        };
    });

    return splitDetails;
};

/**
 * Validate split details against total amount
 * @param {Array} splitDetails - Array of {userId, amount}
 * @param {Number} totalAmount - Total expense amount
 * @returns {Boolean} True if valid
 * @throws {Error} If validation fails
 */
const validateSplitDetails = (splitDetails, totalAmount) => {
    if (!splitDetails || splitDetails.length === 0) {
        throw new Error('Split details cannot be empty');
    }

    const totalSplit = splitDetails.reduce((sum, split) => sum + split.amount, 0);
    const difference = Math.abs(totalSplit - totalAmount);

    // Allow small rounding errors (0.01)
    if (difference > 0.01) {
        throw new Error(
            `Split amounts (${totalSplit.toFixed(2)}) must equal total amount (${totalAmount.toFixed(2)})`
        );
    }

    return true;
};

module.exports = {
    calculateEqualSplit,
    calculatePercentageSplit,
    validateSplitDetails,
};
