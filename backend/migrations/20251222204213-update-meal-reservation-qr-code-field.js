'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    // Change qr_code field from STRING(255) to TEXT to support base64 QR codes
    await queryInterface.changeColumn('meal_reservations', 'qr_code', {
      type: Sequelize.TEXT,
      allowNull: true
    });
  },

  async down (queryInterface, Sequelize) {
    // Revert back to STRING(255)
    await queryInterface.changeColumn('meal_reservations', 'qr_code', {
      type: Sequelize.STRING(255),
      allowNull: true
    });
  }
};
