const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const RefreshToken = sequelize.define('RefreshToken', {
    token_id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
    },
    user_id: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    token_hash: {
        type: DataTypes.STRING,
        allowNull: false
    },
    device_info: DataTypes.STRING(500),
    ip_address: DataTypes.STRING(100),
    expires_at: {
        type: DataTypes.DATE,
        allowNull: false
    },
    is_revoked: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    }
}, {
    tableName: 'refresh_tokens',
    timestamps: true,
    updatedAt: false
});

module.exports = RefreshToken;
