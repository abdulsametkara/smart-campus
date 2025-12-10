'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
    class ActivityLog extends Model {
        static associate(models) {
            ActivityLog.belongsTo(models.User, { foreignKey: 'user_id', as: 'user' });
        }
    }

    ActivityLog.init(
        {
            user_id: {
                type: DataTypes.INTEGER,
                allowNull: false,
            },
            action: {
                type: DataTypes.STRING,
                allowNull: false,
            },
            details: {
                type: DataTypes.TEXT,
                allowNull: true,
            },
            ip_address: {
                type: DataTypes.STRING(45),
                allowNull: true,
            },
            user_agent: {
                type: DataTypes.TEXT,
                allowNull: true,
            },
        },
        {
            sequelize,
            modelName: 'ActivityLog',
            tableName: 'activity_logs',
            underscored: true,
        }
    );

    return ActivityLog;
};
