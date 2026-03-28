const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');
const User = require('./User');
const Advocate = require('./Advocate');

const Appointment = sequelize.define('Appointment', {
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true
    },
    appointment_id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        allowNull: false
    },
    user_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: User,
            key: 'id'
        }
    },
    advocate_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: Advocate,
            key: 'id'
        }
    },
    appointment_type: {
        type: DataTypes.ENUM('video', 'voice'),
        defaultValue: 'video'
    },
    scheduled_start_time: {
        type: DataTypes.DATE,
        allowNull: false
    },
    scheduled_end_time: {
        type: DataTypes.DATE,
        allowNull: false
    },
    duration_minutes: {
        type: DataTypes.INTEGER,
        defaultValue: 0
    },
    status: {
        type: DataTypes.ENUM('scheduled', 'in_progress', 'completed', 'cancelled', 'no_show'),
        defaultValue: 'scheduled'
    },
    problem_description: DataTypes.TEXT,
    appointment_notes: DataTypes.TEXT,
    practice_area: DataTypes.STRING(100),
    amount: {
        type: DataTypes.DECIMAL(10, 2),
        defaultValue: 0.00
    },
    confirmation_number: DataTypes.STRING(20)
}, {
    tableName: 'appointments',
    timestamps: true,
    updatedAt: false
});

module.exports = Appointment;
