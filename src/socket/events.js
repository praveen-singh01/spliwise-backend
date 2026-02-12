const { getRoomName } = require('./rooms');

/**
 * Get Socket.IO instance
 * Must be called after initializeSocket
 */
let ioInstance = null;

const setIO = (io) => {
    ioInstance = io;
};

const getIO = () => {
    if (!ioInstance) {
        throw new Error('Socket.IO not initialized. Call initializeSocket first.');
    }
    return ioInstance;
};

/**
 * Emit new expense event to group room
 * Called from expense controller after creating expense
 */
const emitExpenseCreated = (groupId, expenseData, createdBy) => {
    try {
        const io = getIO();
        const roomName = getRoomName(groupId);

        io.to(roomName).emit('expense:new', {
            expense: expenseData,
            createdBy,
            timestamp: new Date(),
        });

        console.log(`📤 Emitted expense:new to room ${roomName}`);
    } catch (error) {
        console.error('Error emitting expense:new:', error.message);
    }
};

/**
 * Emit balance updated event to group room
 * Called from expense controller after updating/deleting expense
 */
const emitBalanceUpdated = (groupId, message = 'Balance updated') => {
    try {
        const io = getIO();
        const roomName = getRoomName(groupId);

        io.to(roomName).emit('balance:updated', {
            groupId,
            message,
            timestamp: new Date(),
        });

        console.log(`📤 Emitted balance:updated to room ${roomName}`);
    } catch (error) {
        console.error('Error emitting balance:updated:', error.message);
    }
};

module.exports = {
    setIO,
    getIO,
    emitExpenseCreated,
    emitBalanceUpdated,
};
