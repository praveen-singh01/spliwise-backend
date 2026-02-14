require('dotenv').config();
const express = require('express');
const http = require('http');
const cors = require('cors');
const connectDB = require('./config/database');
const authRoutes = require('./routes/authRoutes');
const errorHandler = require('./middlewares/errorHandler');
const { initializeSocket } = require('./socket');

const app = express();
const server = http.createServer(app);

// Connect to database only if not in test environment
if (process.env.NODE_ENV !== 'test') {
    connectDB();
}

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/health', require('./routes/health'));
app.use('/api/auth', require('./routes/auth'));
app.use('/api/expenses', require('./routes/expenses'));
app.use('/api/balances', require('./routes/balances'));
app.use('/api/subscriptions', require('./routes/subscription'));
app.use('/api/groups', require('./routes/groups'));

// Health check
app.get('/health', (req, res) => {
    res.status(200).json({
        success: true,
        message: 'Server is running',
    });
});

// 404 handler
app.use((req, res) => {
    res.status(404).json({
        success: false,
        message: 'Route not found',
    });
});

// Error handler (must be last)
app.use(errorHandler);

// Initialize Socket.IO (only if not in test environment)
if (process.env.NODE_ENV !== 'test') {
    initializeSocket(server);
}

// Start server
const PORT = process.env.PORT || 5007;
if (process.env.NODE_ENV !== 'test') {
    server.listen(PORT, () => {
        console.log(`🚀 Server running on port ${PORT}`);
        console.log(`📍 Environment: ${process.env.NODE_ENV || 'development'}`);
    });
}

// Export app for testing
module.exports = app;
