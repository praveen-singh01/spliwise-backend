const Group = require('../models/Group');
const User = require('../models/User');

class GroupService {
    /**
     * Create a new group
     * @param {string} userId - ID of the user creating the group
     * @param {Object} data - Group data (name, description, members)
     * @returns {Promise<Object>} Created group
     */
    async createGroup(userId, data) {
        const { name, description, members } = data;

        // Ensure creator is included in members
        const memberSet = new Set(members.map((id) => id.toString()));
        memberSet.add(userId.toString());
        const uniqueMembers = Array.from(memberSet);

        // Verify all members exist
        const memberCount = await User.countDocuments({
            _id: { $in: uniqueMembers },
        });

        if (memberCount !== uniqueMembers.length) {
            throw new Error('One or more members do not exist');
        }

        // Create group
        const group = await Group.create({
            name,
            description,
            members: uniqueMembers,
            createdBy: userId,
        });

        // Populate members
        await group.populate('members', 'name email');
        await group.populate('createdBy', 'name email');

        return group;
    }

    /**
     * Get all groups where user is a member
     * @param {string} userId - ID of the user
     * @returns {Promise<Array>} Array of groups
     */
    async getUserGroups(userId) {
        const groups = await Group.find({
            members: userId,
            isDeleted: false,
        })
            .populate('members', 'name email')
            .populate('createdBy', 'name email')
            .sort({ createdAt: -1 });

        return groups;
    }

    /**
     * Get group by ID
     * @param {string} groupId - ID of the group
     * @param {string} userId - ID of the requesting user
     * @returns {Promise<Object>} Group details
     */
    async getGroupById(groupId, userId) {
        const group = await Group.findOne({
            _id: groupId,
            isDeleted: false,
        })
            .populate('members', 'name email')
            .populate('createdBy', 'name email');

        if (!group) {
            throw new Error('Group not found');
        }

        // Verify user is a member
        if (!group.isMember(userId)) {
            throw new Error('You are not a member of this group');
        }

        return group;
    }

    /**
     * Update group details
     * @param {string} groupId - ID of the group
     * @param {string} userId - ID of the requesting user
     * @param {Object} data - Update data
     * @returns {Promise<Object>} Updated group
     */
    async updateGroup(groupId, userId, data) {
        const group = await Group.findOne({
            _id: groupId,
            isDeleted: false,
        });

        if (!group) {
            throw new Error('Group not found');
        }

        // Verify user is the creator
        if (group.createdBy.toString() !== userId.toString()) {
            throw new Error('Only the group creator can update the group');
        }

        // Update fields
        if (data.name) group.name = data.name;
        if (data.description !== undefined) group.description = data.description;

        if (data.members) {
            // Ensure creator remains in members
            const memberSet = new Set(data.members.map((id) => id.toString()));
            memberSet.add(userId.toString());
            const uniqueMembers = Array.from(memberSet);

            // Verify all members exist
            const memberCount = await User.countDocuments({
                _id: { $in: uniqueMembers },
            });

            if (memberCount !== uniqueMembers.length) {
                throw new Error('One or more members do not exist');
            }

            group.members = uniqueMembers;
        }

        await group.save();
        await group.populate('members', 'name email');
        await group.populate('createdBy', 'name email');

        return group;
    }

    /**
     * Soft delete a group
     * @param {string} groupId - ID of the group
     * @param {string} userId - ID of the requesting user
     * @returns {Promise<Object>} Success message
     */
    async deleteGroup(groupId, userId) {
        const group = await Group.findOne({
            _id: groupId,
            isDeleted: false,
        });

        if (!group) {
            throw new Error('Group not found');
        }

        // Verify user is the creator
        if (group.createdBy.toString() !== userId.toString()) {
            throw new Error('Only the group creator can delete the group');
        }

        await group.softDelete();

        return { message: 'Group deleted successfully' };
    }

    /**
     * Add a member to the group
     * @param {string} groupId - ID of the group
     * @param {string} userId - ID of the requesting user
     * @param {string} newMemberId - ID of the member to add
     * @returns {Promise<Object>} Updated group
     */
    async addMember(groupId, userId, newMemberId) {
        const group = await Group.findOne({
            _id: groupId,
            isDeleted: false,
        });

        if (!group) {
            throw new Error('Group not found');
        }

        // Verify user is the creator
        if (group.createdBy.toString() !== userId.toString()) {
            throw new Error('Only the group creator can add members');
        }

        // Check if member already exists
        if (group.isMember(newMemberId)) {
            throw new Error('User is already a member of this group');
        }

        // Verify new member exists
        const newMember = await User.findById(newMemberId);
        if (!newMember) {
            throw new Error('User not found');
        }

        // Add member
        group.members.push(newMemberId);
        await group.save();
        await group.populate('members', 'name email');
        await group.populate('createdBy', 'name email');

        return group;
    }

    /**
     * Remove a member from the group
     * @param {string} groupId - ID of the group
     * @param {string} userId - ID of the requesting user
     * @param {string} memberIdToRemove - ID of the member to remove
     * @returns {Promise<Object>} Updated group
     */
    async removeMember(groupId, userId, memberIdToRemove) {
        const group = await Group.findOne({
            _id: groupId,
            isDeleted: false,
        });

        if (!group) {
            throw new Error('Group not found');
        }

        // Verify user is the creator
        if (group.createdBy.toString() !== userId.toString()) {
            throw new Error('Only the group creator can remove members');
        }

        // Prevent removing the creator
        if (group.createdBy.toString() === memberIdToRemove.toString()) {
            throw new Error('Cannot remove the group creator');
        }

        // Check if member exists in group
        if (!group.isMember(memberIdToRemove)) {
            throw new Error('User is not a member of this group');
        }

        // Remove member
        group.members = group.members.filter(
            (memberId) => memberId.toString() !== memberIdToRemove.toString()
        );

        await group.save();
        await group.populate('members', 'name email');
        await group.populate('createdBy', 'name email');

        return group;
    }
}

module.exports = new GroupService();
