/**
 * Update specific user to Premium subscription
 */

const mongoose = require('mongoose');
const User = require('./src/models/User');
require('dotenv').config();

const updateUserToPremium = async () => {
    try {
        console.log('🔄 Connecting to MongoDB...\n');
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✓ Connected to MongoDB\n');

        const email = 'praveenkumar1090@gmail.com';

        // Find user
        let user = await User.findOne({ email });

        if (!user) {
            console.log(`❌ User with email ${email} not found.`);
            console.log('Creating new user...\n');

            const bcrypt = require('bcrypt');
            const hashedPassword = await bcrypt.hash('password123', 10);

            user = await User.create({
                name: 'Praveen Kumar',
                email: email,
                password: hashedPassword,
                subscription: {
                    plan: 'premium',
                    status: 'active',
                    startDate: new Date(),
                    endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year
                    amount: 2999,
                },
            });

            console.log('✅ New user created with Premium subscription!\n');
        } else {
            // Update existing user to premium
            user.subscription = {
                plan: 'premium',
                status: 'active',
                startDate: new Date(),
                endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year
                amount: 2999,
            };

            await user.save();
            console.log('✅ User updated to Premium subscription!\n');
        }

        console.log('📊 User Details:');
        console.log('==================');
        console.log(`Name: ${user.name}`);
        console.log(`Email: ${user.email}`);
        console.log(`Plan: ${user.subscription.plan}`);
        console.log(`Status: ${user.subscription.status}`);
        console.log(`Amount: ₹${user.subscription.amount}`);
        console.log(`Start Date: ${user.subscription.startDate.toLocaleDateString()}`);
        console.log(`End Date: ${user.subscription.endDate.toLocaleDateString()}`);
        console.log('\n🔑 Login Credentials:');
        console.log('=====================');
        console.log(`Email: ${email}`);
        console.log('Password: password123');
        console.log('\n✅ Done!\n');

        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error);
        process.exit(1);
    }
};

updateUserToPremium();
