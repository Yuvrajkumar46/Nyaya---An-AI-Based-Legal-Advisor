const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const LegalQuery = sequelize.define('LegalQuery', {
    query_id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
    },
    user_id: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    query_text: {
        type: DataTypes.TEXT,
        allowNull: false
    },
    practice_area: {
        type: DataTypes.ENUM('Criminal', 'Civil', 'Corporate', 'Family', 'Labour', 'Tax', 'IP', 'RealEstate')
    },
    language: {
        type: DataTypes.STRING(20),
        defaultValue: 'en'
    },
    response_text: DataTypes.TEXT,
    disclaimer_accepted: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    },
    rating: DataTypes.INTEGER
}, {
    tableName: 'legal_queries',
    timestamps: true,
    updatedAt: false
});

module.exports = LegalQuery;
