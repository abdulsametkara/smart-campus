'use strict';

const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class SessionToken extends Model {
    static associate(models) {
      SessionToken.belongsTo(models.User, { foreignKey: 'user_id', as: 'user' });
    }
  }

  SessionToken.init(
    {
      user_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      token: {
        type: DataTypes.STRING(500),
        allowNull: false,
        unique: true,
      },
      user_agent: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },
      ip_address: {
        type: DataTypes.STRING(50),
        allowNull: true,
      },
      expires_at: {
        type: DataTypes.DATE,
        allowNull: false,
      },
      revoked_at: {
        type: DataTypes.DATE,
        allowNull: true,
      },
    },
    {
      sequelize,
      modelName: 'SessionToken',
      tableName: 'session_tokens',
      underscored: true,
    }
  );

  return SessionToken;
};
