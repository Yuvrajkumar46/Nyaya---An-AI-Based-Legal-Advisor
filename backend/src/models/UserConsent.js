const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const UserConsent = sequelize.define('UserConsent', {
    consent_id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
    },
    user_id: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    consent_type: {
        type: DataTypes.STRING(100),
        allowNull: false
    },
    is_granted: {
        type: DataTypes.BOOLEAN,
        allowNull: false
    },
    consent_version: {
        type: DataTypes.STRING(20),
        defaultValue: 'v1.0'
    },
    granted_at: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW
    },
    revoked_at: DataTypes.DATE
}, {
    tableName: 'user_consents',
    timestamps: false // Manually handling granted_at and revoked_at
});

module.exports = UserConsent;
