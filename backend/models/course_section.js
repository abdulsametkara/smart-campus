'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
    class CourseSection extends Model {
        static associate(models) {
            CourseSection.belongsTo(models.Course, { foreignKey: 'course_id', as: 'course' });
            CourseSection.belongsTo(models.User, { foreignKey: 'instructor_id', as: 'instructor' });
            CourseSection.hasMany(models.Enrollment, { foreignKey: 'section_id', as: 'enrollments' });
            CourseSection.hasMany(models.AttendanceSession, { foreignKey: 'section_id', as: 'sessions' });
        }
    }
    CourseSection.init({
        course_id: DataTypes.INTEGER,
        section_number: DataTypes.INTEGER,
        semester: DataTypes.STRING,
        instructor_id: DataTypes.INTEGER,
        capacity: DataTypes.INTEGER,
        enrolled_count: DataTypes.INTEGER,
        schedule: DataTypes.JSONB
    }, { sequelize, modelName: 'CourseSection', tableName: 'course_sections', underscored: true });

    return CourseSection;
};
