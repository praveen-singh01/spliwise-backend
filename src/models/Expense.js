const mongoose = require('mongoose');

const expenseSchema = new mongoose.Schema(
    {
        description: {
            type: String,
            required: [true, 'Description is required'],
            trim: true,
            minlength: [3, 'Description must be at least 3 characters'],
            maxlength: [200, 'Description cannot exceed 200 characters'],
        },
        amount: {
            type: Number,
            required: [true, 'Amount is required'],
            min: [0.01, 'Amount must be greater than 0'],
            validate: {
                validator: function (value) {
                    // Ensure amount has at most 2 decimal places
                    return /^\d+(\.\d{1,2})?$/.test(value.toString());
                },
                message: 'Amount can have at most 2 decimal places',
            },
        },
        paidBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: [true, 'Payer is required'],
        },
        participants: {
            type: [
                {
                    type: mongoose.Schema.Types.ObjectId,
                    ref: 'User',
                },
            ],
            required: [true, 'At least one participant is required'],
            validate: {
                validator: function (value) {
                    return value && value.length > 0;
                },
                message: 'At least one participant is required',
            },
        },
        splitType: {
            type: String,
            enum: {
                values: ['equal', 'percentage'],
                message: 'Split type must be either "equal" or "percentage"',
            },
            required: [true, 'Split type is required'],
        },
        splitDetails: {
            type: [
                {
                    userId: {
                        type: mongoose.Schema.Types.ObjectId,
                        ref: 'User',
                        required: true,
                    },
                    amount: {
                        type: Number,
                        required: true,
                        min: [0, 'Split amount cannot be negative'],
                    },
                    _id: false, // Disable _id for subdocuments
                },
            ],
            required: [true, 'Split details are required'],
            validate: {
                validator: function (value) {
                    return value && value.length > 0;
                },
                message: 'Split details cannot be empty',
            },
        },
        date: {
            type: Date,
            default: Date.now,
        },
        isDeleted: {
            type: Boolean,
            default: false,
        },
    },
    {
        timestamps: true,
    }
);

// Index for efficient queries
expenseSchema.index({ paidBy: 1, isDeleted: 1 });
expenseSchema.index({ participants: 1, isDeleted: 1 });
expenseSchema.index({ date: -1 });

// Custom validation: Ensure paidBy is in participants
expenseSchema.pre('save', function (next) {
    const paidByInParticipants = this.participants.some(
        (participantId) => participantId.toString() === this.paidBy.toString()
    );

    if (!paidByInParticipants) {
        return next(new Error('Payer must be included in participants'));
    }

    next();
});

// Custom validation: Ensure all splitDetails users are in participants
expenseSchema.pre('save', function (next) {
    const participantIds = this.participants.map((id) => id.toString());
    const splitUserIds = this.splitDetails.map((split) => split.userId.toString());

    const allInParticipants = splitUserIds.every((userId) =>
        participantIds.includes(userId)
    );

    if (!allInParticipants) {
        return next(new Error('All users in splitDetails must be participants'));
    }

    // Ensure all participants have split details
    const allParticipantsHaveSplit = participantIds.every((userId) =>
        splitUserIds.includes(userId)
    );

    if (!allParticipantsHaveSplit) {
        return next(new Error('All participants must have split details'));
    }

    next();
});

// Custom validation: Ensure split amounts sum to total amount
expenseSchema.pre('save', function (next) {
    const totalSplit = this.splitDetails.reduce(
        (sum, split) => sum + split.amount,
        0
    );

    // Allow small rounding errors (0.01)
    const difference = Math.abs(totalSplit - this.amount);
    if (difference > 0.01) {
        return next(
            new Error(
                `Split amounts (${totalSplit.toFixed(2)}) must equal total amount (${this.amount.toFixed(2)})`
            )
        );
    }

    next();
});

// Soft delete query middleware
expenseSchema.pre(/^find/, function (next) {
    // Exclude soft-deleted expenses by default
    this.where({ isDeleted: false });
    next();
});

module.exports = mongoose.model('Expense', expenseSchema);
