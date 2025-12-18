'use strict';

const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Faculty extends Model {
    static associate(models) {
      Faculty.belongsTo(models.User, { foreignKey: 'user_id', as: 'user' });
      Faculty.belongsTo(models.Department, { foreignKey: 'department_id', as: 'department' });
    }
  }

  Faculty.init(
    {
      user_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      title: {
        type: DataTypes.STRING(100),
        allowNull: true,
      },
      department_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      office_hours: {
        type: DataTypes.STRING,
        allowNull: true,
      },
    },
    {
      sequelize,
      modelName: 'Faculty',
      tableName: 'faculties',
      underscored: true,
    }
  );

  return Faculty;
};
