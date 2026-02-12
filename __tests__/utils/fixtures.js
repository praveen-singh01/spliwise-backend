const User = require('../../src/models/User');

/**
 * Create test users
 */
const createTestUsers = async () => {
    const users = await User.create([
        {
            name: 'Alice',
            email: 'alice@test.com',
            password: 'password123',
        },
        {
            name: 'Bob',
            email: 'bob@test.com',
            password: 'password123',
        },
        {
            name: 'Carol',
            email: 'carol@test.com',
            password: 'password123',
        },
    ]);

    return users;
};

/**
 * Generate JWT token for user
 */
const generateTestToken = (userId) => {
    const authService = require('../../src/services/authService');
    return authService.generateToken({
        userId,
        email: 'test@test.com',
    });
};

module.exports = {
    createTestUsers,
    generateTestToken,
};
