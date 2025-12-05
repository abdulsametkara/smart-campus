'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('users', 'full_name', {
      type: Sequelize.STRING(150),
      allowNull: true,
      defaultValue: null,
    });

    await queryInterface.addColumn('users', 'phone_number', {
      type: Sequelize.STRING(30),
      allowNull: true,
      defaultValue: null,
    });

    await queryInterface.addColumn('users', 'profile_picture_url', {
      type: Sequelize.STRING(255),
      allowNull: true,
      defaultValue: null,
    });
  },

  async down(queryInterface) {
    await queryInterface.removeColumn('users', 'profile_picture_url');
    await queryInterface.removeColumn('users', 'phone_number');
    await queryInterface.removeColumn('users', 'full_name');
  },
};
