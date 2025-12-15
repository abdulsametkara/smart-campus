'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
    class Grade extends Model {
        static associate(models) {
            Grade.belongsTo(models.Exam, { foreignKey: 'exam_id', as: 'exam' });
            Grade.belongsTo(models.User, { foreignKey: 'student_id', as: 'student' });
        }
    }
    Grade.init({
        exam_id: {
            type: DataTypes.INTEGER,
            allowNull: false
        },
        student_id: {
            type: DataTypes.INTEGER,
            allowNull: false
        },
        score: {
            type: DataTypes.FLOAT,
            allowNull: false
        },
        feedback: DataTypes.TEXT
    }, {
        sequelize,
        modelName: 'Grade',
        tableName: 'grades',
        underscored: true
    });
    return Grade;
};
