'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
    class Classroom extends Model {
        static associate(models) {
            // Potentially linked to CourseSections via schedule JSON but no FK
        }
    }
    Classroom.init({
        name: DataTypes.STRING,
        building: DataTypes.STRING,
        room_number: DataTypes.STRING,
        capacity: DataTypes.INTEGER,
        latitude: DataTypes.DECIMAL,
        longitude: DataTypes.DECIMAL,
        features: DataTypes.JSONB
    }, { sequelize, modelName: 'Classroom', tableName: 'classrooms', underscored: true });

    return Classroom;
};
