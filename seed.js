/**
 * Database Seeder
 * Seeds the database with sample data for testing
 */

const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const User = require('./src/models/User');
const Expense = require('./src/models/Expense');
const Group = require('./src/models/Group');
const Subscription = require('./src/models/Subscription');
require('dotenv').config();

const seedDatabase = async () => {
    try {
        console.log('🌱 Starting database seeding...\n');

        // Connect to MongoDB
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✓ Connected to MongoDB\n');

        // Clear existing data
        console.log('🗑️  Clearing existing data...');
        await User.deleteMany({});
        await Expense.deleteMany({});
        await Group.deleteMany({});
        await Subscription.deleteMany({});
        console.log('✓ Cleared all collections\n');

        // Create users
        console.log('👥 Creating users...');
        const hashedPassword = await bcrypt.hash('password123', 10);

        const users = await User.create([
            {
                name: 'Alice Johnson',
                email: 'alice@example.com',
                password: hashedPassword,
                subscription: {
                    plan: 'premium',
                    status: 'active',
                    startDate: new Date(),
                    endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
                },
            },
            {
                name: 'Bob Smith',
                email: 'bob@example.com',
                password: hashedPassword,
                subscription: {
                    plan: 'free',
                    status: 'active',
                },
            },
            {
                name: 'Charlie Brown',
                email: 'charlie@example.com',
                password: hashedPassword,
                subscription: {
                    plan: 'free',
                    status: 'active',
                },
            },
            {
                name: 'Diana Prince',
                email: 'diana@example.com',
                password: hashedPassword,
                subscription: {
                    plan: 'premium',
                    status: 'active',
                    startDate: new Date(),
                    endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
                },
            },
            {
                name: 'Eve Adams',
                email: 'eve@example.com',
                password: hashedPassword,
                subscription: {
                    plan: 'free',
                    status: 'active',
                },
            },
        ]);

        console.log(`✓ Created ${users.length} users`);
        console.log(`  - alice@example.com (Premium)`);
        console.log(`  - bob@example.com (Free)`);
        console.log(`  - charlie@example.com (Free)`);
        console.log(`  - diana@example.com (Premium)`);
        console.log(`  - eve@example.com (Free)\n`);

        const [alice, bob, charlie, diana, eve] = users;

        // Create groups (only premium users can create)
        console.log('👥 Creating groups...');
        const groups = await Group.create([
            {
                name: 'Weekend Trip',
                description: 'Our amazing weekend getaway',
                members: [alice._id, bob._id, charlie._id],
                createdBy: alice._id,
            },
            {
                name: 'Office Lunch',
                description: 'Weekly team lunches',
                members: [alice._id, diana._id, eve._id],
                createdBy: alice._id,
            },
            {
                name: 'Roommates',
                description: 'Shared apartment expenses',
                members: [diana._id, eve._id, bob._id],
                createdBy: diana._id,
            },
        ]);

        console.log(`✓ Created ${groups.length} groups`);
        console.log(`  - Weekend Trip (Alice, Bob, Charlie)`);
        console.log(`  - Office Lunch (Alice, Diana, Eve)`);
        console.log(`  - Roommates (Diana, Eve, Bob)\n`);

        const [weekendTrip, officeLunch, roommates] = groups;

        // Create expenses
        console.log('💰 Creating expenses...');

        // Personal expenses (no group)
        const personalExpenses = await Expense.create([
            {
                description: 'Coffee with Bob',
                amount: 25,
                paidBy: alice._id,
                participants: [alice._id, bob._id],
                splitType: 'equal',
                splitDetails: [
                    { userId: alice._id, amount: 12.5 },
                    { userId: bob._id, amount: 12.5 },
                ],
                date: new Date('2026-02-10'),
            },
            {
                description: 'Movie tickets',
                amount: 600,
                paidBy: charlie._id,
                participants: [charlie._id, eve._id],
                splitType: 'equal',
                splitDetails: [
                    { userId: charlie._id, amount: 300 },
                    { userId: eve._id, amount: 300 },
                ],
                date: new Date('2026-02-11'),
            },
        ]);

        // Group expenses
        const groupExpenses = await Expense.create([
            {
                description: 'Hotel Booking',
                amount: 6000,
                paidBy: alice._id,
                participants: [alice._id, bob._id, charlie._id],
                splitType: 'equal',
                splitDetails: [
                    { userId: alice._id, amount: 2000 },
                    { userId: bob._id, amount: 2000 },
                    { userId: charlie._id, amount: 2000 },
                ],
                groupId: weekendTrip._id,
                category: 'Accommodation',
                date: new Date('2026-02-08'),
            },
            {
                description: 'Gas for road trip',
                amount: 1500,
                paidBy: bob._id,
                participants: [alice._id, bob._id, charlie._id],
                splitType: 'percentage',
                percentageSplits: [
                    { userId: alice._id, percentage: 40 },
                    { userId: bob._id, percentage: 30 },
                    { userId: charlie._id, percentage: 30 },
                ],
                splitDetails: [
                    { userId: alice._id, amount: 600 },
                    { userId: bob._id, amount: 450 },
                    { userId: charlie._id, amount: 450 },
                ],
                groupId: weekendTrip._id,
                category: 'Travel',
                date: new Date('2026-02-09'),
            },
            {
                description: 'Team Lunch at Italian Restaurant',
                amount: 2400,
                paidBy: diana._id,
                participants: [alice._id, diana._id, eve._id],
                splitType: 'equal',
                splitDetails: [
                    { userId: alice._id, amount: 800 },
                    { userId: diana._id, amount: 800 },
                    { userId: eve._id, amount: 800 },
                ],
                groupId: officeLunch._id,
                category: 'Food',
                date: new Date('2026-02-12'),
            },
            {
                description: 'Electricity Bill',
                amount: 3000,
                paidBy: diana._id,
                participants: [diana._id, eve._id, bob._id],
                splitType: 'equal',
                splitDetails: [
                    { userId: diana._id, amount: 1000 },
                    { userId: eve._id, amount: 1000 },
                    { userId: bob._id, amount: 1000 },
                ],
                groupId: roommates._id,
                category: 'Utilities',
                date: new Date('2026-02-01'),
            },
            {
                description: 'Groceries',
                amount: 4500,
                paidBy: eve._id,
                participants: [diana._id, eve._id, bob._id],
                splitType: 'percentage',
                percentageSplits: [
                    { userId: diana._id, percentage: 40 },
                    { userId: eve._id, percentage: 35 },
                    { userId: bob._id, percentage: 25 },
                ],
                splitDetails: [
                    { userId: diana._id, amount: 1800 },
                    { userId: eve._id, amount: 1575 },
                    { userId: bob._id, amount: 1125 },
                ],
                groupId: roommates._id,
                category: 'Food',
                date: new Date('2026-02-05'),
            },
        ]);

        console.log(`✓ Created ${personalExpenses.length + groupExpenses.length} expenses`);
        console.log(`  - ${personalExpenses.length} personal expenses`);
        console.log(`  - ${groupExpenses.length} group expenses\n`);

        // Summary
        console.log('📊 Seeding Summary:');
        console.log('==================');
        console.log(`Users: ${users.length}`);
        console.log(`  - Premium: 2 (Alice, Diana)`);
        console.log(`  - Free: 3 (Bob, Charlie, Eve)`);
        console.log(`Groups: ${groups.length}`);
        console.log(`Expenses: ${personalExpenses.length + groupExpenses.length}`);
        console.log(`\n✅ Database seeded successfully!\n`);

        console.log('🔑 Login Credentials:');
        console.log('=====================');
        console.log('Email: alice@example.com | Password: password123 (Premium)');
        console.log('Email: bob@example.com | Password: password123 (Free)');
        console.log('Email: charlie@example.com | Password: password123 (Free)');
        console.log('Email: diana@example.com | Password: password123 (Premium)');
        console.log('Email: eve@example.com | Password: password123 (Free)\n');

        process.exit(0);
    } catch (error) {
        console.error('❌ Seeding failed:', error);
        process.exit(1);
    }
};

seedDatabase();
