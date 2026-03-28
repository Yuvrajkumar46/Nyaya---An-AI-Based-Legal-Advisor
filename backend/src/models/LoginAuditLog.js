const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const LoginAuditLog = sequelize.define('LoginAuditLog', {
    log_id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
    },
    user_id: DataTypes.INTEGER,
    username_attempted: DataTypes.STRING(50),
    status: {
        type: DataTypes.ENUM('success', 'failed', 'blocked'),
        allowNull: false
    },
    failure_reason: DataTypes.STRING(100),
    ip_address: DataTypes.STRING(100),
    user_agent: DataTypes.TEXT
}, {
    tableName: 'login_audit_log',
    timestamps: true,
    updatedAt: false
});

module.exports = LoginAuditLog;
