'use strict';
const { Model } = require('sequelize');
module.exports = (sequelize, DataTypes) => {
    class Wallet extends Model {
        static associate(models) {
            Wallet.belongsTo(models.User, { foreignKey: 'user_id', as: 'user' });
            Wallet.hasMany(models.Transaction, { foreignKey: 'wallet_id', as: 'transactions' });
        }
    }
    Wallet.init({
        user_id: DataTypes.INTEGER,
        balance: { type: DataTypes.DECIMAL(10, 2), defaultValue: 0 },
        currency: { type: DataTypes.STRING, defaultValue: 'TRY' },
        is_active: { type: DataTypes.BOOLEAN, defaultValue: true }
    }, {
        sequelize,
        modelName: 'Wallet',
        tableName: 'wallets',
        underscored: true
    });
    return Wallet;
};
