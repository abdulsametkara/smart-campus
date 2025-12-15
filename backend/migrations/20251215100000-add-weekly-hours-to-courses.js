'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
    async up(queryInterface, Sequelize) {
        // Add weekly_hours column to courses table if it doesn't exist
        const tableInfo = await queryInterface.describeTable('courses');

        if (!tableInfo.weekly_hours) {
            await queryInterface.addColumn('courses', 'weekly_hours', {
                type: Sequelize.INTEGER,
                allowNull: true,
                defaultValue: 3
            });
        }
    },

    async down(queryInterface, Sequelize) {
        await queryInterface.removeColumn('courses', 'weekly_hours');
    }
};
