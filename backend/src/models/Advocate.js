const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');
const User = require('./User');

const Advocate = sequelize.define('Advocate', {
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true
    },
    user_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: User,
            key: 'id'
        }
    },
    username: {
        type: DataTypes.STRING(100),
        allowNull: false,
        unique: true
    },
    email: {
        type: DataTypes.STRING(255),
        allowNull: false,
        unique: true
    },
    full_name: {
        type: DataTypes.STRING(255),
        allowNull: false
    },
    practice_areas: {
        type: DataTypes.JSON
    },
    state: DataTypes.STRING(100),
    city: DataTypes.STRING(100),
    languages: DataTypes.JSON,
    experience_years: {
        type: DataTypes.INTEGER,
        defaultValue: 0
    },
    hourly_rate: {
        type: DataTypes.DECIMAL(10, 2),
        defaultValue: 0.00
    },
    verification_status: {
        type: DataTypes.ENUM('pending', 'verified', 'suspended', 'rejected'),
        defaultValue: 'pending'
    },
    bar_council_id: DataTypes.STRING(100),
    bio: DataTypes.TEXT,
    is_active: {
        type: DataTypes.BOOLEAN,
        defaultValue: true
    }
}, {
    tableName: 'advocates',
    timestamps: true,
    updatedAt: false
});

module.exports = Advocate;
