'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
    class Sensor extends Model {
        static associate(models) {
            Sensor.hasMany(models.SensorData, { foreignKey: 'sensorId', as: 'readings' });
        }
    }
    Sensor.init({
        name: DataTypes.STRING,
        type: DataTypes.STRING,
        location: DataTypes.STRING,
        status: {
            type: DataTypes.ENUM('active', 'inactive', 'maintenance'),
            defaultValue: 'active'
        }
    }, {
        sequelize,
        modelName: 'Sensor',
    });
    return Sensor;
};
