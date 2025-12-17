'use strict';
const { Model } = require('sequelize');
module.exports = (sequelize, DataTypes) => {
    class Reservation extends Model {
        static associate(models) {
            Reservation.belongsTo(models.Classroom, { foreignKey: 'classroom_id', as: 'classroom' });
            Reservation.belongsTo(models.User, { foreignKey: 'user_id', as: 'user' });
        }
    }
    Reservation.init({
        classroom_id: DataTypes.INTEGER,
        user_id: DataTypes.INTEGER,
        date: DataTypes.DATEONLY,
        start_time: DataTypes.TIME,
        end_time: DataTypes.TIME,
        purpose: DataTypes.STRING,
        status: {
            type: DataTypes.ENUM('pending', 'approved', 'rejected', 'cancelled'),
            defaultValue: 'pending'
        },
        approved_by: DataTypes.INTEGER // User ID of admin
    }, {
        sequelize,
        modelName: 'Reservation',
        tableName: 'reservations',
        underscored: true
    });
    return Reservation;
};
