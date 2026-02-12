const jwt = require('jsonwebtoken');

/**
 * Socket.IO authentication middleware
 * Verifies JWT token from socket handshake
 * Attaches userId to socket object
 */
const socketAuth = async (socket, next) => {
    try {
        // Extract token from handshake (query or auth)
        const token = socket.handshake.auth.token || socket.handshake.query.token;

        if (!token) {
            return next(new Error('Authentication error: No token provided'));
        }

        // Verify JWT token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // Attach userId to socket for use in other handlers
        socket.userId = decoded.userId;
        socket.userEmail = decoded.email;

        next();
    } catch (error) {
        console.error('Socket authentication failed:', error.message);
        return next(new Error('Authentication error: Invalid token'));
    }
};

module.exports = socketAuth;
