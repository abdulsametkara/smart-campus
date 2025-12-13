'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
    class AttendanceSession extends Model {
        static associate(models) {
            AttendanceSession.belongsTo(models.CourseSection, { foreignKey: 'section_id', as: 'section' });
            AttendanceSession.belongsTo(models.User, { foreignKey: 'instructor_id', as: 'instructor' });
            AttendanceSession.hasMany(models.AttendanceRecord, { foreignKey: 'session_id', as: 'records' });
        }
    }
    AttendanceSession.init({
        section_id: DataTypes.INTEGER,
        instructor_id: DataTypes.INTEGER,
        start_time: DataTypes.DATE,
        end_time: DataTypes.DATE,
        latitude: DataTypes.DECIMAL,
        longitude: DataTypes.DECIMAL,
        radius: DataTypes.INTEGER,
        qr_code: DataTypes.STRING,
        status: DataTypes.ENUM('ACTIVE', 'CLOSED')
    }, { sequelize, modelName: 'AttendanceSession', tableName: 'attendance_sessions', underscored: true });

    return AttendanceSession;
};
