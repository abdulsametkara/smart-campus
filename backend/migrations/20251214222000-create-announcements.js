'use strict';
module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.createTable('announcements', {
            id: {
                allowNull: false,
                autoIncrement: true,
                primaryKey: true,
                type: Sequelize.INTEGER
            },
            title: {
                type: Sequelize.STRING,
                allowNull: false
            },
            content: {
                type: Sequelize.TEXT,
                allowNull: false
            },
            // Optional: link to a specific course/section. If null, it's a general announcement.
            course_id: {
                type: Sequelize.INTEGER,
                allowNull: true,
                references: { model: 'courses', key: 'id' },
                onUpdate: 'CASCADE',
                onDelete: 'SET NULL'
            },
            department_id: {
                type: Sequelize.INTEGER,
                allowNull: true,
                references: { model: 'departments', key: 'id' },
                onUpdate: 'CASCADE',
                onDelete: 'SET NULL'
            },
            created_by: {
                type: Sequelize.INTEGER,
                allowNull: false,
                references: { model: 'users', key: 'id' }
            },
            priority: {
                type: Sequelize.ENUM('LOW', 'NORMAL', 'HIGH', 'URGENT'),
                defaultValue: 'NORMAL'
            },
            expiry_date: {
                type: Sequelize.DATE,
                allowNull: true
            },
            created_at: {
                allowNull: false,
                type: Sequelize.DATE
            },
            updated_at: {
                allowNull: false,
                type: Sequelize.DATE
            }
        });

        await queryInterface.addIndex('announcements', ['created_at']);
        await queryInterface.addIndex('announcements', ['course_id']);
    },
    async down(queryInterface, Sequelize) {
        await queryInterface.dropTable('announcements');
    }
};
