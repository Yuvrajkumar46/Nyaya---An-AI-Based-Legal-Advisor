const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const Document = sequelize.define('Document', {
    document_id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
    },
    user_id: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    advocate_id: DataTypes.INTEGER,
    document_name: {
        type: DataTypes.STRING(255),
        allowNull: false
    },
    document_type: {
        type: DataTypes.ENUM('Pleading', 'Evidence', 'Order', 'Correspondence', 'Other'),
        defaultValue: 'Other'
    },
    file_format: {
        type: DataTypes.ENUM('PDF', 'DOCX', 'JPG', 'PNG', 'TXT'),
        defaultValue: 'PDF'
    },
    file_size_bytes: DataTypes.BIGINT,
    storage_path: DataTypes.STRING(500),
    file_hash: DataTypes.STRING(255)
}, {
    tableName: 'documents',
    timestamps: true
});

module.exports = Document;
