const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const BillingTransaction = sequelize.define('BillingTransaction', {
    transaction_id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
    },
    user_id: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    amount: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false
    },
    transaction_type: {
        type: DataTypes.ENUM('credit', 'debit'),
        allowNull: false
    },
    description: DataTypes.STRING(255),
    payment_method: DataTypes.STRING(50),
    status: {
        type: DataTypes.ENUM('pending', 'completed', 'failed', 'refunded'),
        defaultValue: 'pending'
    },
    razorpay_order_id: DataTypes.STRING(255)
}, {
    tableName: 'billing_transactions',
    timestamps: true,
    updatedAt: false
});

module.exports = BillingTransaction;
