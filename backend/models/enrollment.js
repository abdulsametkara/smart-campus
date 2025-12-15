'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
    class Enrollment extends Model {
        static associate(models) {
            Enrollment.belongsTo(models.User, { foreignKey: 'student_id', as: 'student' });
            Enrollment.belongsTo(models.CourseSection, { foreignKey: 'section_id', as: 'section' });
            Enrollment.belongsTo(models.User, { foreignKey: 'approved_by', as: 'approver' });
        }
    }
    Enrollment.init({
        student_id: DataTypes.INTEGER,
        section_id: DataTypes.INTEGER,
        status: DataTypes.ENUM('PENDING', 'APPROVED', 'REJECTED', 'ACTIVE', 'DROPPED', 'FAILED', 'PASSED'),
        enrollment_date: DataTypes.DATE,
        approved_by: {
            type: DataTypes.INTEGER,
            allowNull: true,
            references: {
                model: 'users',
                key: 'id'
            }
        },
        approved_at: {
            type: DataTypes.DATE,
            allowNull: true
        },
        rejection_reason: {
            type: DataTypes.STRING,
            allowNull: true
        },
        midterm_grade: DataTypes.FLOAT,
        final_grade: DataTypes.FLOAT,
        letter_grade: DataTypes.STRING,
        grade_point: DataTypes.FLOAT,
        absence_hours_used: { type: DataTypes.INTEGER, defaultValue: 0 },
        absence_limit: { type: DataTypes.INTEGER, defaultValue: 8 }
    }, { sequelize, modelName: 'Enrollment', tableName: 'enrollments', underscored: true });

    return Enrollment;
};
