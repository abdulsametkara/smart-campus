'use strict';

const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class EmailVerification extends Model {
    static associate(models) {
      EmailVerification.belongsTo(models.User, { foreignKey: 'user_id', as: 'user' });
    }
  }

  EmailVerification.init(
    {
      user_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      token: {
        type: DataTypes.STRING(255),
        allowNull: false,
        unique: true,
      },
      expires_at: {
        type: DataTypes.DATE,
        allowNull: false,
      },
      used_at: {
        type: DataTypes.DATE,
        allowNull: true,
      },
    },
    {
      sequelize,
      modelName: 'EmailVerification',
      tableName: 'email_verifications',
      underscored: true,
    }
  );

  return EmailVerification;
};
