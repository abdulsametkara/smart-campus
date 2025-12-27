'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
    class SensorData extends Model {
        static associate(models) {
            SensorData.belongsTo(models.Sensor, { foreignKey: 'sensorId', as: 'sensor' });
        }
    }
    SensorData.init({
        sensorId: DataTypes.INTEGER,
        value: DataTypes.FLOAT,
        unit: DataTypes.STRING,
        timestamp: DataTypes.DATE
    }, {
        sequelize,
        modelName: 'SensorData',
    });
    return SensorData;
};
