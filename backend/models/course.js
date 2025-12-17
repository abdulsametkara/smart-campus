'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
    class Course extends Model {
        static associate(models) {
            Course.belongsTo(models.Department, { foreignKey: 'department_id', as: 'department' });
            Course.hasMany(models.CourseSection, { foreignKey: 'course_id', as: 'sections' });
            Course.belongsToMany(models.Course, {
                as: 'Prerequisites',
                through: 'course_prerequisites',
                foreignKey: 'course_id',
                otherKey: 'prerequisite_course_id'
            });
        }
    }
    Course.init({
        code: DataTypes.STRING,
        name: DataTypes.STRING,
        description: DataTypes.TEXT,
        credits: DataTypes.INTEGER,
        ects: DataTypes.INTEGER,
        weekly_hours: { type: DataTypes.INTEGER, defaultValue: 2 },
        department_id: DataTypes.INTEGER,
        syllabus_url: DataTypes.STRING,
        deleted_at: DataTypes.DATE
    }, { sequelize, modelName: 'Course', tableName: 'courses', underscored: true, paranoid: true });

    return Course;
};
