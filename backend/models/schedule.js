'use strict';
const { Model } = require('sequelize');
module.exports = (sequelize, DataTypes) => {
    class Schedule extends Model {
        static associate(models) {
            Schedule.belongsTo(models.CourseSection, { foreignKey: 'section_id', as: 'section' });
            Schedule.belongsTo(models.Classroom, { foreignKey: 'classroom_id', as: 'classroom' });
        }
    }
    Schedule.init({
        section_id: DataTypes.INTEGER,
        day_of_week: DataTypes.INTEGER, // 1=Monday, 5=Friday
        start_time: DataTypes.TIME,
        end_time: DataTypes.TIME,
        classroom_id: DataTypes.INTEGER
    }, {
        sequelize,
        modelName: 'Schedule',
        tableName: 'schedules',
        underscored: true
    });
    return Schedule;
};
