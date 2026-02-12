const express = require('express');
const groupController = require('../controllers/groupController');
const validate = require('../middlewares/validate');
const authenticate = require('../middlewares/auth');
const requireSubscription = require('../middlewares/requireSubscription');
const {
    createGroupSchema,
    updateGroupSchema,
    addMemberSchema,
} = require('../utils/groupValidation');

const router = express.Router();

// All routes require authentication
router.use(authenticate);

/**
 * @route   POST /api/groups
 * @desc    Create a new group (Premium only)
 * @access  Private (Premium/Enterprise)
 */
router.post(
    '/',
    requireSubscription('premium'),
    validate(createGroupSchema),
    groupController.createGroup
);

/**
 * @route   GET /api/groups
 * @desc    Get all groups where user is a member
 * @access  Private
 */
router.get('/', groupController.getUserGroups);

/**
 * @route   GET /api/groups/:id
 * @desc    Get group details by ID
 * @access  Private
 */
router.get('/:id', groupController.getGroupById);

/**
 * @route   PUT /api/groups/:id
 * @desc    Update group details
 * @access  Private (Creator only)
 */
router.put('/:id', validate(updateGroupSchema), groupController.updateGroup);

/**
 * @route   DELETE /api/groups/:id
 * @desc    Soft delete group
 * @access  Private (Creator only)
 */
router.delete('/:id', groupController.deleteGroup);

/**
 * @route   POST /api/groups/:id/members
 * @desc    Add member to group
 * @access  Private (Creator only)
 */
router.post('/:id/members', validate(addMemberSchema), groupController.addMember);

/**
 * @route   DELETE /api/groups/:id/members/:userId
 * @desc    Remove member from group
 * @access  Private (Creator only)
 */
router.delete('/:id/members/:userId', groupController.removeMember);

module.exports = router;
