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
      employee_number: {
        type: DataTypes.STRING(20),
        allowNull: false,
        unique: true,
      },
      title: {
        type: DataTypes.STRING(100),
        allowNull: false,
      },
      department_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
    },
    {
      sequelize,
      modelName: 'Faculty',
      tableName: 'faculty',
      underscored: true,
    }
  );

  return Faculty;
};
