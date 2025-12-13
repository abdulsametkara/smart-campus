'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
    class AttendanceRecord extends Model {
        static associate(models) {
            AttendanceRecord.belongsTo(models.AttendanceSession, { foreignKey: 'session_id', as: 'session' });
            AttendanceRecord.belongsTo(models.User, { foreignKey: 'student_id', as: 'student' });
        }
    }
    AttendanceRecord.init({
        session_id: DataTypes.INTEGER,
        student_id: DataTypes.INTEGER,
        check_in_time: DataTypes.DATE,
        latitude: DataTypes.DECIMAL,
        longitude: DataTypes.DECIMAL,
        distance_from_center: DataTypes.FLOAT,
        status: DataTypes.ENUM('PRESENT', 'ABSENT', 'EXCUSED'),
        is_flagged: DataTypes.BOOLEAN,
        flag_reason: DataTypes.STRING
    }, { sequelize, modelName: 'AttendanceRecord', tableName: 'attendance_records', underscored: true });

    return AttendanceRecord;
};
