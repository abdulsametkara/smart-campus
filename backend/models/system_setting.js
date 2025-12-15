'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
    class SystemSetting extends Model {
        static associate(models) {
            // define association here
        }
    }
    SystemSetting.init({
        key: {
            type: DataTypes.STRING,
            allowNull: false,
            unique: true
        },
        value: {
            type: DataTypes.TEXT, // Store as stringified JSON if complex
            allowNull: false
        },
        description: {
            type: DataTypes.STRING,
            allowNull: true
        }
    }, {
        sequelize,
        modelName: 'SystemSetting',
        tableName: 'system_settings',
        underscored: true
    });
    return SystemSetting;
};
