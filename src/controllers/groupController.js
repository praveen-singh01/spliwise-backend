const groupService = require('../services/groupService');

/**
 * Create a new group
 */
const createGroup = async (req, res, next) => {
    try {
        const group = await groupService.createGroup(req.user.userId, req.body);

        res.status(201).json({
            success: true,
            message: 'Group created successfully',
            data: group,
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Get all groups where user is a member
 */
const getUserGroups = async (req, res, next) => {
    try {
        const groups = await groupService.getUserGroups(req.user.userId);

        res.status(200).json({
            success: true,
            data: groups,
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Get group by ID
 */
const getGroupById = async (req, res, next) => {
    try {
        const group = await groupService.getGroupById(req.params.id, req.user.userId);

        res.status(200).json({
            success: true,
            data: group,
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Update group
 */
const updateGroup = async (req, res, next) => {
    try {
        const group = await groupService.updateGroup(
            req.params.id,
            req.user.userId,
            req.body
        );

        res.status(200).json({
            success: true,
            message: 'Group updated successfully',
            data: group,
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Delete group (soft delete)
 */
const deleteGroup = async (req, res, next) => {
    try {
        const result = await groupService.deleteGroup(req.params.id, req.user.userId);

        res.status(200).json({
            success: true,
            message: result.message,
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Add member to group
 */
const addMember = async (req, res, next) => {
    try {
        const group = await groupService.addMember(
            req.params.id,
            req.user.userId,
            req.body.userId
        );

        res.status(200).json({
            success: true,
            message: 'Member added successfully',
            data: group,
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Remove member from group
 */
const removeMember = async (req, res, next) => {
    try {
        const group = await groupService.removeMember(
            req.params.id,
            req.user.userId,
            req.params.userId
        );

        res.status(200).json({
            success: true,
            message: 'Member removed successfully',
            data: group,
        });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    createGroup,
    getUserGroups,
    getGroupById,
    updateGroup,
    deleteGroup,
    addMember,
    removeMember,
};
