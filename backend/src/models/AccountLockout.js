const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const AccountLockout = sequelize.define('AccountLockout', {
    lockout_id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
    },
    username: {
        type: DataTypes.STRING(50),
        allowNull: false,
        unique: true
    },
    failed_attempts: {
        type: DataTypes.INTEGER,
        defaultValue: 0
    },
    locked_until: DataTypes.DATE,
    last_attempt_at: DataTypes.DATE
}, {
    tableName: 'account_lockouts',
    timestamps: true
});

module.exports = AccountLockout;
