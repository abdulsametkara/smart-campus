'use strict';

module.exports = {
    up: async (queryInterface, Sequelize) => {
        await queryInterface.addColumn('meal_reservations', 'amount', {
            type: Sequelize.DECIMAL(10, 2),
            defaultValue: 0.00,
            allowNull: false
        });
    },

    down: async (queryInterface, Sequelize) => {
        await queryInterface.removeColumn('meal_reservations', 'amount');
    }
};
