'use strict';

module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.addColumn('users', 'student_number', {
            type: Sequelize.STRING(50),
            allowNull: true,
            unique: true
        });
    },

    async down(queryInterface, Sequelize) {
        await queryInterface.removeColumn('users', 'student_number');
    }
};
