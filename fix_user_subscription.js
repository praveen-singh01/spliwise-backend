/**
 * Direct MongoDB update to fix user subscription
 */

const mongoose = require('mongoose');
require('dotenv').config();

const fixUserSubscription = async () => {
    try {
        console.log('🔄 Connecting to MongoDB...\n');
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✓ Connected to MongoDB\n');

        const email = 'praveenkumar1090@gmail.com';

        // Direct update using MongoDB
        const result = await mongoose.connection.db.collection('users').updateOne(
            { email: email },
            {
                $set: {
                    subscription: {
                        plan: 'premium',
                        status: 'active',
                        startDate: new Date(),
                        endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
                        amount: 2999,
                    },
                },
                $unset: {
                    currentPlan: '' // Remove old field if it exists
                }
            }
        );

        if (result.matchedCount === 0) {
            console.log('❌ User not found!');
            process.exit(1);
        }

        console.log('✅ User subscription updated successfully!\n');

        // Fetch and display updated user
        const user = await mongoose.connection.db.collection('users').findOne({ email: email });

        console.log('📊 Updated User Document:');
        console.log('========================');
        console.log(JSON.stringify(user, null, 2));
        console.log('\n✅ Done!\n');

        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error);
        process.exit(1);
    }
};

fixUserSubscription();
