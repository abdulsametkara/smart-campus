'use strict';
const { Model } = require('sequelize');
module.exports = (sequelize, DataTypes) => {
    class NotificationLog extends Model {
        static associate(models) {
            NotificationLog.belongsTo(models.User, { foreignKey: 'userId', as: 'user' });
        }
    }
    NotificationLog.init({
        userId: DataTypes.INTEGER,
        type: DataTypes.STRING, // e.g. EVENT_REGISTER
        channel: DataTypes.STRING, // SMS, EMAIL, PUSH
        recipient: DataTypes.STRING, // Phone num or Token
        content: DataTypes.TEXT,
        status: DataTypes.STRING // SENT, FAILED
    }, {
        sequelize,
        modelName: 'NotificationLog',
        tableName: 'notification_logs',
        underscored: true
    });
    return NotificationLog;
};
