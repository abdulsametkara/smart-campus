'use strict';
const { Model } = require('sequelize');
module.exports = (sequelize, DataTypes) => {
    class Cafeteria extends Model {
        static associate(models) {
            Cafeteria.hasMany(models.MealMenu, { foreignKey: 'cafeteria_id', as: 'menus' });
        }
    }
    Cafeteria.init({
        name: DataTypes.STRING,
        location: DataTypes.STRING,
        capacity: DataTypes.INTEGER,
        is_active: { type: DataTypes.BOOLEAN, defaultValue: true }
    }, {
        sequelize,
        modelName: 'Cafeteria',
        tableName: 'cafeterias',
        underscored: true
    });
    return Cafeteria;
};
