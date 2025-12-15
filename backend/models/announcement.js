'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
    class Announcement extends Model {
        static associate(models) {
            Announcement.belongsTo(models.User, { foreignKey: 'created_by', as: 'author' });
            Announcement.belongsTo(models.Department, { foreignKey: 'department_id', as: 'department' });
            Announcement.belongsTo(models.Course, { foreignKey: 'course_id', as: 'course' });
        }
    }
    Announcement.init({
        title: {
            type: DataTypes.STRING,
            allowNull: false
        },
        content: {
            type: DataTypes.TEXT,
            allowNull: false
        },
        course_id: DataTypes.INTEGER,
        department_id: DataTypes.INTEGER,
        created_by: {
            type: DataTypes.INTEGER,
            allowNull: false
        },
        priority: {
            type: DataTypes.ENUM('LOW', 'NORMAL', 'HIGH', 'URGENT'),
            defaultValue: 'NORMAL'
        },
        expiry_date: DataTypes.DATE
    }, {
        sequelize,
        modelName: 'Announcement',
        tableName: 'announcements',
        underscored: true
    });
    return Announcement;
};
