'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
    class Exam extends Model {
        static associate(models) {
            Exam.belongsTo(models.CourseSection, { foreignKey: 'section_id', as: 'section' });
            Exam.hasMany(models.Grade, { foreignKey: 'exam_id', as: 'grades' });
        }
    }
    Exam.init({
        section_id: {
            type: DataTypes.INTEGER,
            allowNull: false
        },
        title: {
            type: DataTypes.STRING,
            allowNull: false
        },
        type: {
            type: DataTypes.ENUM('MIDTERM', 'FINAL', 'QUIZ', 'PROJECT', 'OTHER'),
            defaultValue: 'MIDTERM'
        },
        weight: {
            type: DataTypes.INTEGER,
            allowNull: false
        },
        date: DataTypes.DATE,
        is_published: {
            type: DataTypes.BOOLEAN,
            defaultValue: false
        },
        average_score: {
            type: DataTypes.FLOAT,
            defaultValue: 0
        }
    }, {
        sequelize,
        modelName: 'Exam',
        tableName: 'exams',
        underscored: true
    });
    return Exam;
};
