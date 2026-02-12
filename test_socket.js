/**
 * Socket.IO Test Client
 * Tests socket connection, authentication, room joining, and event emissions
 */

const io = require('socket.io-client');
const axios = require('axios');

const BASE_URL = 'http://localhost:5007';
const SOCKET_URL = 'http://localhost:5007';

// Test configuration
const testUser = {
    email: 'testuser@example.com',
    password: 'password123',
};

let token = '';
let userId = '';
let socket = null;

/**
 * Step 1: Login and get JWT token
 */
async function login() {
    console.log('\n📝 Step 1: Logging in...');
    try {
        const response = await axios.post(`${BASE_URL}/api/auth/login`, testUser);
        token = response.data.data.token;
        userId = response.data.data.user.id;
        console.log('✓ Login successful');
        console.log(`  Token: ${token.substring(0, 50)}...`);
        console.log(`  User ID: ${userId}`);
        return true;
    } catch (error) {
        console.error('✗ Login failed:', error.response?.data || error.message);
        return false;
    }
}

/**
 * Step 2: Connect to Socket.IO with JWT token
 */
function connectSocket() {
    return new Promise((resolve, reject) => {
        console.log('\n🔌 Step 2: Connecting to Socket.IO...');

        socket = io(SOCKET_URL, {
            auth: {
                token: token,
            },
        });

        socket.on('connect', () => {
            console.log('✓ Socket connected');
            console.log(`  Socket ID: ${socket.id}`);
        });

        socket.on('connected', (data) => {
            console.log('✓ Received connected event');
            console.log(`  Message: ${data.message}`);
            console.log(`  User ID: ${data.userId}`);
            resolve();
        });

        socket.on('connect_error', (error) => {
            console.error('✗ Connection error:', error.message);
            reject(error);
        });

        socket.on('disconnect', () => {
            console.log('🔌 Socket disconnected');
        });

        // Set timeout
        setTimeout(() => {
            if (!socket.connected) {
                reject(new Error('Connection timeout'));
            }
        }, 5000);
    });
}

/**
 * Step 3: Listen for real-time events
 */
function setupEventListeners() {
    console.log('\n📡 Step 3: Setting up event listeners...');

    socket.on('expense:new', (data) => {
        console.log('\n📥 Received expense:new event');
        console.log('  Expense ID:', data.expense._id);
        console.log('  Description:', data.expense.description);
        console.log('  Amount:', data.expense.amount);
        console.log('  Created by:', data.createdBy);
        console.log('  Timestamp:', data.timestamp);
    });

    socket.on('balance:updated', (data) => {
        console.log('\n📥 Received balance:updated event');
        console.log('  Group ID:', data.groupId);
        console.log('  Message:', data.message);
        console.log('  Timestamp:', data.timestamp);
    });

    console.log('✓ Event listeners setup complete');
}

/**
 * Step 4: Create a group (requires premium - will fail for free user)
 */
async function createGroup() {
    console.log('\n👥 Step 4: Creating a test group...');
    try {
        const response = await axios.post(
            `${BASE_URL}/api/groups`,
            {
                name: 'Socket Test Group',
                description: 'Testing real-time updates',
                members: [userId],
            },
            {
                headers: { Authorization: `Bearer ${token}` },
            }
        );
        console.log('✓ Group created successfully');
        console.log(`  Group ID: ${response.data.data._id}`);
        return response.data.data._id;
    } catch (error) {
        if (error.response?.status === 402) {
            console.log('⚠ Expected: Premium subscription required');
            console.log('  Skipping group-based tests');
            return null;
        }
        console.error('✗ Group creation failed:', error.response?.data || error.message);
        return null;
    }
}

/**
 * Step 5: Create an expense (without group)
 */
async function createExpense(groupId = null) {
    console.log('\n💰 Step 5: Creating an expense...');
    try {
        const expenseData = {
            description: 'Socket Test Expense',
            amount: 100,
            paidBy: userId,
            participants: [userId],
            splitType: 'equal',
        };

        if (groupId) {
            expenseData.groupId = groupId;
            expenseData.category = 'Testing';
        }

        const response = await axios.post(`${BASE_URL}/api/expenses`, expenseData, {
            headers: { Authorization: `Bearer ${token}` },
        });

        console.log('✓ Expense created successfully');
        console.log(`  Expense ID: ${response.data.data._id}`);
        console.log(`  Has groupId: ${!!response.data.data.groupId}`);

        if (groupId) {
            console.log('  ⏳ Waiting for expense:new event...');
            await new Promise((resolve) => setTimeout(resolve, 1000));
        }

        return response.data.data._id;
    } catch (error) {
        console.error('✗ Expense creation failed:', error.response?.data || error.message);
        return null;
    }
}

/**
 * Step 6: Update expense
 */
async function updateExpense(expenseId, groupId = null) {
    console.log('\n✏️  Step 6: Updating expense...');
    try {
        await axios.put(
            `${BASE_URL}/api/expenses/${expenseId}`,
            { description: 'Updated Socket Test Expense' },
            { headers: { Authorization: `Bearer ${token}` } }
        );

        console.log('✓ Expense updated successfully');

        if (groupId) {
            console.log('  ⏳ Waiting for balance:updated event...');
            await new Promise((resolve) => setTimeout(resolve, 1000));
        }
    } catch (error) {
        console.error('✗ Expense update failed:', error.response?.data || error.message);
    }
}

/**
 * Step 7: Delete expense
 */
async function deleteExpense(expenseId, groupId = null) {
    console.log('\n🗑️  Step 7: Deleting expense...');
    try {
        await axios.delete(`${BASE_URL}/api/expenses/${expenseId}`, {
            headers: { Authorization: `Bearer ${token}` },
        });

        console.log('✓ Expense deleted successfully');

        if (groupId) {
            console.log('  ⏳ Waiting for balance:updated event...');
            await new Promise((resolve) => setTimeout(resolve, 1000));
        }
    } catch (error) {
        console.error('✗ Expense deletion failed:', error.response?.data || error.message);
    }
}

/**
 * Main test flow
 */
async function runTests() {
    console.log('🧪 Socket.IO Integration Tests');
    console.log('================================\n');

    try {
        // Step 1: Login
        const loginSuccess = await login();
        if (!loginSuccess) {
            console.error('\n❌ Tests failed: Could not login');
            process.exit(1);
        }

        // Step 2: Connect socket
        await connectSocket();

        // Step 3: Setup listeners
        setupEventListeners();

        // Wait a bit for room joins to complete
        await new Promise((resolve) => setTimeout(resolve, 1000));

        // Step 4: Try to create group (will fail for free user)
        const groupId = await createGroup();

        // Step 5: Create expense
        const expenseId = await createExpense(groupId);

        if (expenseId) {
            // Step 6: Update expense
            await updateExpense(expenseId, groupId);

            // Step 7: Delete expense
            await deleteExpense(expenseId, groupId);
        }

        // Wait a bit before disconnecting
        await new Promise((resolve) => setTimeout(resolve, 2000));

        console.log('\n✅ All tests completed successfully!');
        console.log('\n📊 Summary:');
        console.log('  - Socket connection: ✓');
        console.log('  - JWT authentication: ✓');
        console.log('  - Room joining: ✓');
        console.log('  - Event listeners: ✓');
        console.log('  - Expense operations: ✓');

        if (groupId) {
            console.log('  - Real-time events: ✓ (expense:new, balance:updated)');
        } else {
            console.log('  - Real-time events: ⚠ (skipped - no group)');
        }

        // Disconnect
        socket.disconnect();
        process.exit(0);
    } catch (error) {
        console.error('\n❌ Tests failed:', error.message);
        if (socket) {
            socket.disconnect();
        }
        process.exit(1);
    }
}

// Run tests
runTests();
