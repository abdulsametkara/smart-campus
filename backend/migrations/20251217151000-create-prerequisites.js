'use strict';

module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.dropTable('course_prerequisites');
        await queryInterface.createTable('course_prerequisites', {
            id: {
                allowNull: false,
                autoIncrement: true,
                primaryKey: true,
                type: Sequelize.INTEGER
            },
            course_id: {
                type: Sequelize.INTEGER,
                allowNull: false,
                references: { model: 'courses', key: 'id' },
                onUpdate: 'CASCADE',
                onDelete: 'CASCADE'
            },
            prerequisite_course_id: {
                type: Sequelize.INTEGER,
                allowNull: false,
                references: { model: 'courses', key: 'id' },
                onUpdate: 'CASCADE',
                onDelete: 'CASCADE'
            },
            created_at: {
                allowNull: false,
                type: Sequelize.DATE,
                defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
            },
            updated_at: {
                allowNull: false,
                type: Sequelize.DATE,
                defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
            }
        });

        // Add prerequisite check constraint logic if needed, but for now simple table is enough
    },

    async down(queryInterface, Sequelize) {
        await queryInterface.dropTable('course_prerequisites');
    }
};
