const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const DocumentSharing = sequelize.define('DocumentSharing', {
    sharing_id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
    },
    document_id: {
        type: DataTypes.UUID,
        allowNull: false
    },
    shared_by_user_id: {
        type: DataTypes.UUID,
        allowNull: false
    },
    shared_with_advocate_id: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    access_level: {
        type: DataTypes.ENUM('view', 'view_download'),
        defaultValue: 'view'
    },
    share_token: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true
    },
    expires_at: {
        type: DataTypes.DATE,
        allowNull: false
    },
    is_revoked: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    }
}, {
    tableName: 'document_sharing',
    timestamps: true,
    updatedAt: false,
    createdAt: 'created_at'
});

module.exports = DocumentSharing;
