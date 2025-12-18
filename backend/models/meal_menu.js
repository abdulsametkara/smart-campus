'use strict';
const { Model } = require('sequelize');
module.exports = (sequelize, DataTypes) => {
    class MealMenu extends Model {
        static associate(models) {
            MealMenu.belongsTo(models.Cafeteria, { foreignKey: 'cafeteria_id', as: 'cafeteria' });
            MealMenu.hasMany(models.MealReservation, { foreignKey: 'menu_id', as: 'reservations' });
        }
    }
    MealMenu.init({
        cafeteria_id: DataTypes.INTEGER,
        date: DataTypes.DATEONLY,
        meal_type: DataTypes.ENUM('lunch', 'dinner'),
        items_json: DataTypes.JSONB,
        nutrition_json: DataTypes.JSONB,
        price: { type: DataTypes.DECIMAL(10, 2), defaultValue: 0 },
        is_published: { type: DataTypes.BOOLEAN, defaultValue: false }
    }, {
        sequelize,
        modelName: 'MealMenu',
        tableName: 'meal_menus',
        underscored: true
    });
    return MealMenu;
};
