'use strict';

module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.addColumn('enrollments', 'absence_hours_used', {
            type: Sequelize.INTEGER,
            defaultValue: 0,
            allowNull: false
        });

        await queryInterface.addColumn('enrollments', 'absence_limit', {
            type: Sequelize.INTEGER,
            defaultValue: 0, // Should be updated based on course/credits
            allowNull: false
        });
    },

    async down(queryInterface, Sequelize) {
        await queryInterface.removeColumn('enrollments', 'absence_limit');
        await queryInterface.removeColumn('enrollments', 'absence_hours_used');
    }
};
