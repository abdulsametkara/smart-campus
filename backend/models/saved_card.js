'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
    class SavedCard extends Model {
        static associate(models) {
            SavedCard.belongsTo(models.User, { foreignKey: 'user_id', as: 'user' });
        }
    }

    SavedCard.init({
        user_id: {
            type: DataTypes.INTEGER,
            allowNull: false
        },
        card_holder: {
            type: DataTypes.STRING,
            allowNull: false
        },
        card_last_four: {
            type: DataTypes.STRING(4),
            allowNull: false
        },
        card_brand: {
            type: DataTypes.STRING(20),
            allowNull: true,
            defaultValue: 'Visa'
        },
        expiry_month: {
            type: DataTypes.STRING(2),
            allowNull: false
        },
        expiry_year: {
            type: DataTypes.STRING(2),
            allowNull: false
        },
        is_default: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: false
        }
    }, {
        sequelize,
        modelName: 'SavedCard',
        tableName: 'saved_cards',
        underscored: true,
        timestamps: true
    });

    return SavedCard;
};
