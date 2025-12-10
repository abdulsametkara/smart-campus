'use strict';

module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.addColumn('users', 'two_factor_secret', {
            type: Sequelize.STRING,
            allowNull: true,
        });
        await queryInterface.addColumn('users', 'is_2fa_enabled', {
            type: Sequelize.BOOLEAN,
            defaultValue: false,
            allowNull: false,
        });
    },

    async down(queryInterface, Sequelize) {
        await queryInterface.removeColumn('users', 'two_factor_secret');
        await queryInterface.removeColumn('users', 'is_2fa_enabled');
    },
};
