'use strict';

module.exports = {
    async up(queryInterface, Sequelize) {
        // Add absence_hours_used column
        /*
        try {
            await queryInterface.addColumn('enrollments', 'absence_hours_used', {
                type: Sequelize.INTEGER,
                allowNull: false,
                defaultValue: 0,
                comment: 'Total absence hours used by the student for this enrollment'
            });
        } catch (e) { console.log('Column absence_hours_used already exists, skipping'); }

        // Add absence_limit column
        try {
            await queryInterface.addColumn('enrollments', 'absence_limit', {
                type: Sequelize.INTEGER,
                allowNull: false,
                defaultValue: 8,
                comment: 'Maximum allowed absence hours for this enrollment (default: 8 hours)'
            });
        } catch (e) { console.log('Column absence_limit already exists, skipping'); }
        */
    },

    async down(queryInterface, Sequelize) {
        // Remove columns in reverse order
        await queryInterface.removeColumn('enrollments', 'absence_limit');
        await queryInterface.removeColumn('enrollments', 'absence_hours_used');
    }
};

