const mongoose = require('mongoose');

const groupSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: [true, 'Group name is required'],
            trim: true,
            minlength: [2, 'Group name must be at least 2 characters'],
            maxlength: [100, 'Group name cannot exceed 100 characters'],
        },
        description: {
            type: String,
            trim: true,
            maxlength: [500, 'Description cannot exceed 500 characters'],
        },
        members: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'User',
                required: true,
            },
        ],
        createdBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
            index: true,
        },
        isDeleted: {
            type: Boolean,
            default: false,
            index: true,
        },
        deletedAt: {
            type: Date,
        },
    },
    {
        timestamps: true,
    }
);

// Index for efficient member queries
groupSchema.index({ members: 1 });
groupSchema.index({ createdBy: 1, isDeleted: 1 });

// Check if user is a member of the group
groupSchema.methods.isMember = function (userId) {
    return this.members.some((memberId) => memberId.toString() === userId.toString());
};

// Soft delete the group
groupSchema.methods.softDelete = function () {
    this.isDeleted = true;
    this.deletedAt = new Date();
    return this.save();
};

module.exports = mongoose.model('Group', groupSchema);
