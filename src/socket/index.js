const { Server } = require('socket.io');
const socketAuth = require('./auth');
const { joinUserGroups, leaveUserGroups } = require('./rooms');
const { setIO } = require('./events');

/**
 * Initialize Socket.IO server
 * @param {http.Server} server - HTTP server instance
 */
const initializeSocket = (server) => {
    // Create Socket.IO server with CORS configuration
    const io = new Server(server, {
        cors: {
            origin: process.env.FRONTEND_URL || 'http://localhost:5173',
            methods: ['GET', 'POST'],
            credentials: true,
        },
    });

    // Apply authentication middleware
    io.use(socketAuth);

    // Store io instance for use in controllers
    setIO(io);

    // Handle connections
    io.on('connection', async (socket) => {
        console.log(`🔌 Socket connected: ${socket.id} (User: ${socket.userId})`);

        // Join user to all their group rooms
        await joinUserGroups(socket, socket.userId);

        // Send connection success message
        socket.emit('connected', {
            message: 'Connected to real-time updates',
            userId: socket.userId,
        });

        // Handle disconnection
        socket.on('disconnect', async () => {
            console.log(`🔌 Socket disconnected: ${socket.id} (User: ${socket.userId})`);
            await leaveUserGroups(socket, socket.userId);
        });

        // Handle errors
        socket.on('error', (error) => {
            console.error(`Socket error for ${socket.id}:`, error.message);
        });
    });

    console.log('✓ Socket.IO initialized');
    return io;
};

module.exports = {
    initializeSocket,
};
