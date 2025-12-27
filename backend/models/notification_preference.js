'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
    class NotificationPreference extends Model {
        static associate(models) {
            NotificationPreference.belongsTo(models.User, { foreignKey: 'userId', as: 'user' });
        }
    }
    NotificationPreference.init({
        userId: {
            type: DataTypes.INTEGER,
            allowNull: false,
            unique: true
        },
        email_academic: { type: DataTypes.BOOLEAN, defaultValue: true },
        email_attendance: { type: DataTypes.BOOLEAN, defaultValue: true },
        email_meal: { type: DataTypes.BOOLEAN, defaultValue: false },
        email_event: { type: DataTypes.BOOLEAN, defaultValue: true },
        email_payment: { type: DataTypes.BOOLEAN, defaultValue: true },
        email_system: { type: DataTypes.BOOLEAN, defaultValue: true },

        push_academic: { type: DataTypes.BOOLEAN, defaultValue: true },
        push_attendance: { type: DataTypes.BOOLEAN, defaultValue: true },
        push_meal: { type: DataTypes.BOOLEAN, defaultValue: true },
        push_event: { type: DataTypes.BOOLEAN, defaultValue: true },
        push_payment: { type: DataTypes.BOOLEAN, defaultValue: true },
        push_system: { type: DataTypes.BOOLEAN, defaultValue: false },

        sms_attendance: { type: DataTypes.BOOLEAN, defaultValue: true },
        sms_payment: { type: DataTypes.BOOLEAN, defaultValue: false }
    }, {
        sequelize,
        modelName: 'NotificationPreference',
    });
    return NotificationPreference;
};
