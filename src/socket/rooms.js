const Group = require('../models/Group');

/**
 * Room naming convention: group:${groupId}
 */
const getRoomName = (groupId) => `group:${groupId}`;

/**
 * Join user to all their group rooms
 * Called when user connects
 */
const joinUserGroups = async (socket, userId) => {
    try {
        // Fetch all groups where user is a member
        const groups = await Group.find({
            members: userId,
            isDeleted: false,
        }).select('_id name');

        // Join each group room
        groups.forEach((group) => {
            const roomName = getRoomName(group._id);
            socket.join(roomName);
            console.log(`✓ User ${userId} joined room: ${roomName}`);
        });

        console.log(`User ${userId} joined ${groups.length} group rooms`);
        return groups.length;
    } catch (error) {
        console.error('Error joining user groups:', error.message);
        return 0;
    }
};

/**
 * Leave all group rooms
 * Called when user disconnects
 */
const leaveUserGroups = async (socket, userId) => {
    try {
        // Get all rooms the socket is in (excluding the socket's own room)
        const rooms = Array.from(socket.rooms).filter(
            (room) => room !== socket.id && room.startsWith('group:')
        );

        // Leave each room
        rooms.forEach((room) => {
            socket.leave(room);
            console.log(`✓ User ${userId} left room: ${room}`);
        });

        console.log(`User ${userId} left ${rooms.length} group rooms`);
        return rooms.length;
    } catch (error) {
        console.error('Error leaving user groups:', error.message);
        return 0;
    }
};

/**
 * Join a specific group room
 * Called when user is added to a group
 */
const joinGroupRoom = (socket, groupId) => {
    const roomName = getRoomName(groupId);
    socket.join(roomName);
    console.log(`✓ Socket ${socket.id} joined room: ${roomName}`);
};

/**
 * Leave a specific group room
 * Called when user is removed from a group
 */
const leaveGroupRoom = (socket, groupId) => {
    const roomName = getRoomName(groupId);
    socket.leave(roomName);
    console.log(`✓ Socket ${socket.id} left room: ${roomName}`);
};

/**
 * Get all sockets for a specific user
 * Useful for adding user to room when they're added to a group
 */
const getUserSockets = (io, userId) => {
    const sockets = [];
    for (const [id, socket] of io.of('/').sockets) {
        if (socket.userId === userId) {
            sockets.push(socket);
        }
    }
    return sockets;
};

module.exports = {
    getRoomName,
    joinUserGroups,
    leaveUserGroups,
    joinGroupRoom,
    leaveGroupRoom,
    getUserSockets,
};
