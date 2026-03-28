const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const DocumentVersion = sequelize.define('DocumentVersion', {
    version_id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
    },
    document_id: {
        type: DataTypes.UUID,
        allowNull: false
    },
    version_number: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    storage_path: DataTypes.STRING,
    file_hash: DataTypes.STRING,
    file_size_bytes: DataTypes.BIGINT,
    uploaded_by: DataTypes.UUID
}, {
    tableName: 'document_versions',
    timestamps: true,
    updatedAt: false,
    createdAt: 'created_at'
});

module.exports = DocumentVersion;
