'use strict';

const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Department extends Model {
    static associate(models) {
      Department.hasMany(models.Student, { foreignKey: 'department_id', as: 'students' });
      Department.hasMany(models.Faculty, { foreignKey: 'department_id', as: 'facultyMembers' });
      Department.hasMany(models.Course, { foreignKey: 'department_id', as: 'courses' });
    }
  }

  Department.init(
    {
      name: {
        type: DataTypes.STRING(150),
        allowNull: false,
      },
      code: {
        type: DataTypes.STRING(20),
        allowNull: false,
        unique: true,
      },
      faculty: {
        type: DataTypes.STRING(150),
        allowNull: false,
      },
    },
    {
      sequelize,
      modelName: 'Department',
      tableName: 'departments',
      underscored: true,
    }
  );

  return Department;
};
