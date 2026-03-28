const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const Call = sequelize.define('Call', {
    call_id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
    },
    caller_id: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    advocate_id: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    call_type: {
        type: DataTypes.ENUM('voice', 'video'),
        defaultValue: 'video'
    },
    start_time: DataTypes.DATE,
    end_time: DataTypes.DATE,
    duration_seconds: {
        type: DataTypes.INTEGER,
        defaultValue: 0
    },
    call_status: {
        type: DataTypes.ENUM('initiated', 'ringing', 'connected', 'ended', 'failed'),
        defaultValue: 'initiated'
    },
    billing_amount: {
        type: DataTypes.DECIMAL(10, 2),
        defaultValue: 0.00
    },
    recording_consent: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    }
}, {
    tableName: 'calls',
    timestamps: true,
    updatedAt: false
});

module.exports = Call;
