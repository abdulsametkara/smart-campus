'use strict';

const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class User extends Model {
    static associate(models) {
      User.hasOne(models.Student, { foreignKey: 'user_id', as: 'studentProfile' });
      User.hasOne(models.Faculty, { foreignKey: 'user_id', as: 'facultyProfile' });
    }
  }

  User.init(
    {
      email: {
        type: DataTypes.STRING(255),
        allowNull: false,
        unique: true,
        validate: {
          isEmail: true,
        },
      },
      password_hash: {
        type: DataTypes.STRING(255),
        allowNull: false,
      },
      full_name: {
        type: DataTypes.STRING(150),
        allowNull: true,
      },
      phone_number: {
        type: DataTypes.STRING(30),
        allowNull: true,
      },
      student_number: {
        type: DataTypes.STRING(50),
        allowNull: true,
      },
      profile_picture_url: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },
      role: {
        type: DataTypes.ENUM('student', 'faculty', 'admin', 'cafeteria_staff', 'event_manager'),
        allowNull: false,
        defaultValue: 'student',
      },
      is_email_verified: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      failed_login_attempts: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
      },
      account_locked_until: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      two_factor_secret: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      is_2fa_enabled: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },
    },
    {
      sequelize,
      modelName: 'User',
      tableName: 'users',
      underscored: true,
    }
  );

  return User;
};
