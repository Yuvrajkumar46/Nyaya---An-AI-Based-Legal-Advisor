require('dotenv').config({ path: __dirname + '/../../.env' });
const sequelize = require('../config/db');
const { Sequelize, DataTypes } = require('sequelize');
const Notification = require('../models/Notification');
const User = require('../models/User');

Notification.belongsTo(User, { foreignKey: 'user_id' });
User.hasMany(Notification, { foreignKey: 'user_id' });

const seedNotifications = async () => {
    try {
        await Notification.sync({ force: true });
        console.log('Database synced for Notifications.');

        // Find a user to seed notifications to, e.g., an Admin or first user
        const user = await User.findOne();
        if (!user) {
            console.log('No user found to seed notifications.');
            process.exit(0);
        }

        await Notification.bulkCreate([
            {
                user_id: user.id,
                type: 'payment_success',
                title: 'Welcome to Nyaya!',
                message: 'Your account has been created successfully. Add money to your wallet to book consultations.',
                action_url: '/billing/add-money',
                is_read: false
            },
            {
                user_id: user.id,
                type: 'system',
                title: 'Complete Your Profile',
                message: 'Add your phone number and preferences to get the most out of Nyaya.',
                action_url: '/settings',
                is_read: false
            },
            {
                user_id: user.id,
                type: 'appointment_reminder',
                title: 'Find Your First Advocate',
                message: 'Browse verified advocates and book your first consultation.',
                action_url: '/find-advocates',
                is_read: true
            }
        ]);
        console.log('Notifications seeded successfully.');
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}
seedNotifications();
