'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
    class Notification extends Model {
        static associate(models) {
            Notification.belongsTo(models.User, { foreignKey: 'userId', as: 'user' });
        }
    }
    Notification.init({
        userId: {
            type: DataTypes.INTEGER,
            allowNull: false
        },
        title: {
            type: DataTypes.STRING,
            allowNull: false
        },
        message: {
            type: DataTypes.TEXT,
            allowNull: false
        },
        type: {
            type: DataTypes.ENUM('academic', 'attendance', 'meal', 'event', 'payment', 'system'),
            defaultValue: 'system'
        },
        isRead: {
            type: DataTypes.BOOLEAN,
            defaultValue: false
        },
        relatedId: DataTypes.INTEGER
    }, {
        sequelize,
        modelName: 'Notification',
    });
    return Notification;
};
