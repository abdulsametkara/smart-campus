'use strict';

const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Student extends Model {
    static associate(models) {
      Student.belongsTo(models.User, { foreignKey: 'user_id', as: 'user' });
      Student.belongsTo(models.Department, { foreignKey: 'department_id', as: 'department' });
      Student.belongsTo(models.Faculty, { foreignKey: 'advisor_id', as: 'advisor' });
    }
  }

  Student.init(
    {
      user_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      student_number: {
        type: DataTypes.STRING(20),
        allowNull: false,
        unique: true,
      },
      department_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      advisor_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
          model: 'faculty',
          key: 'id'
        }
      },
      gpa: {
        type: DataTypes.DECIMAL(3, 2),
        allowNull: true,
      },
      cgpa: {
        type: DataTypes.DECIMAL(3, 2),
        allowNull: true,
      },
    },
    {
      sequelize,
      modelName: 'Student',
      tableName: 'students',
      underscored: true,
    }
  );

  return Student;
};
