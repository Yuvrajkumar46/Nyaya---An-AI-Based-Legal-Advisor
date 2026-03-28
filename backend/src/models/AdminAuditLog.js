const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const AdminAuditLog = sequelize.define('AdminAuditLog', {
    log_id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
    },
    admin_id: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    action: {
        type: DataTypes.STRING(100),
        allowNull: false
    },
    target_id: DataTypes.STRING(36),
    target_type: DataTypes.STRING(50),
    details: DataTypes.TEXT
}, {
    tableName: 'admin_audit_log',
    timestamps: true,
    updatedAt: false
});

module.exports = AdminAuditLog;
