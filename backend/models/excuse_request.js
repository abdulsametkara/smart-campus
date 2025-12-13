'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
    class ExcuseRequest extends Model {
        static associate(models) {
            ExcuseRequest.belongsTo(models.User, { foreignKey: 'student_id', as: 'student' });
            ExcuseRequest.belongsTo(models.AttendanceSession, { foreignKey: 'session_id', as: 'session' });
            ExcuseRequest.belongsTo(models.User, { foreignKey: 'reviewed_by', as: 'reviewer' });
        }
    }
    ExcuseRequest.init({
        student_id: DataTypes.INTEGER,
        session_id: DataTypes.INTEGER,
        title: DataTypes.STRING,
        description: DataTypes.TEXT,
        document_url: DataTypes.STRING,
        status: DataTypes.ENUM('PENDING', 'APPROVED', 'REJECTED'),
        reviewed_by: DataTypes.INTEGER,
        reviewed_at: DataTypes.DATE,
        notes: DataTypes.TEXT
    }, { sequelize, modelName: 'ExcuseRequest', tableName: 'excuse_requests', underscored: true });

    return ExcuseRequest;
};
