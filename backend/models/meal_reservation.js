'use strict';
const { Model } = require('sequelize');
module.exports = (sequelize, DataTypes) => {
    class MealReservation extends Model {
        static associate(models) {
            MealReservation.belongsTo(models.User, { foreignKey: 'user_id', as: 'user' });
            MealReservation.belongsTo(models.MealMenu, { foreignKey: 'menu_id', as: 'menu' });
            MealReservation.belongsTo(models.Cafeteria, { foreignKey: 'cafeteria_id', as: 'cafeteria' });
        }
    }
    MealReservation.init({
        user_id: DataTypes.INTEGER,
        menu_id: DataTypes.INTEGER,
        cafeteria_id: DataTypes.INTEGER,
        meal_type: DataTypes.ENUM('lunch', 'dinner'),
        date: DataTypes.DATEONLY,
        qr_code: DataTypes.TEXT, // Changed from STRING to TEXT to support base64 QR codes
        status: {
            type: DataTypes.ENUM('reserved', 'used', 'cancelled'),
            defaultValue: 'reserved'
        },
        used_at: DataTypes.DATE
    }, {
        sequelize,
        modelName: 'MealReservation',
        tableName: 'meal_reservations',
        underscored: true
    });
    return MealReservation;
};
