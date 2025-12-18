'use strict';
const { Model } = require('sequelize');
module.exports = (sequelize, DataTypes) => {
    class Transaction extends Model {
        static associate(models) {
            Transaction.belongsTo(models.Wallet, { foreignKey: 'wallet_id', as: 'wallet' });
        }
    }
    Transaction.init({
        wallet_id: DataTypes.INTEGER,
        type: DataTypes.ENUM('credit', 'debit'),
        amount: DataTypes.DECIMAL(10, 2),
        balance_after: DataTypes.DECIMAL(10, 2),
        reference_type: DataTypes.STRING, // e.g., 'meal_reservation', 'topup'
        reference_id: DataTypes.INTEGER,
        description: DataTypes.STRING
    }, {
        sequelize,
        modelName: 'Transaction',
        tableName: 'transactions',
        underscored: true,
        timestamps: true
    });
    return Transaction;
};
