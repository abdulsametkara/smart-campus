'use strict';

module.exports = {
    async up(queryInterface, Sequelize) {
        // Notifications Table
        await queryInterface.createTable('Notifications', {
            id: {
                allowNull: false,
                autoIncrement: true,
                primaryKey: true,
                type: Sequelize.INTEGER
            },
            userId: {
                type: Sequelize.INTEGER,
                allowNull: false,
                references: {
                    model: 'users',
                    key: 'id'
                },
                onUpdate: 'CASCADE',
                onDelete: 'CASCADE'
            },
            title: {
                type: Sequelize.STRING,
                allowNull: false
            },
            message: {
                type: Sequelize.TEXT,
                allowNull: false
            },
            type: {
                type: Sequelize.ENUM('academic', 'attendance', 'meal', 'event', 'payment', 'system'),
                defaultValue: 'system'
            },
            isRead: {
                type: Sequelize.BOOLEAN,
                defaultValue: false
            },
            relatedId: {
                type: Sequelize.INTEGER,
                allowNull: true,
                comment: 'ID of the related entity (e.g., CourseId, EventId)'
            },
            createdAt: {
                allowNull: false,
                type: Sequelize.DATE
            },
            updatedAt: {
                allowNull: false,
                type: Sequelize.DATE
            }
        });

        // Notification Preferences Table
        await queryInterface.createTable('NotificationPreferences', {
            id: {
                allowNull: false,
                autoIncrement: true,
                primaryKey: true,
                type: Sequelize.INTEGER
            },
            userId: {
                type: Sequelize.INTEGER,
                allowNull: false,
                unique: true,
                references: {
                    model: 'users',
                    key: 'id'
                },
                onUpdate: 'CASCADE',
                onDelete: 'CASCADE'
            },
            // Email Preferences
            email_academic: { type: Sequelize.BOOLEAN, defaultValue: true },
            email_attendance: { type: Sequelize.BOOLEAN, defaultValue: true },
            email_meal: { type: Sequelize.BOOLEAN, defaultValue: false },
            email_event: { type: Sequelize.BOOLEAN, defaultValue: true },
            email_payment: { type: Sequelize.BOOLEAN, defaultValue: true },
            email_system: { type: Sequelize.BOOLEAN, defaultValue: true },

            // Push Preferences
            push_academic: { type: Sequelize.BOOLEAN, defaultValue: true },
            push_attendance: { type: Sequelize.BOOLEAN, defaultValue: true },
            push_meal: { type: Sequelize.BOOLEAN, defaultValue: true },
            push_event: { type: Sequelize.BOOLEAN, defaultValue: true },
            push_payment: { type: Sequelize.BOOLEAN, defaultValue: true },
            push_system: { type: Sequelize.BOOLEAN, defaultValue: false },

            // SMS Preferences
            sms_attendance: { type: Sequelize.BOOLEAN, defaultValue: true },
            sms_payment: { type: Sequelize.BOOLEAN, defaultValue: false },

            createdAt: {
                allowNull: false,
                type: Sequelize.DATE
            },
            updatedAt: {
                allowNull: false,
                type: Sequelize.DATE
            }
        });

        // Add index for fast retrieval of user notifications
        await queryInterface.addIndex('Notifications', ['userId', 'isRead']);
    },

    async down(queryInterface, Sequelize) {
        await queryInterface.dropTable('NotificationPreferences');
        await queryInterface.dropTable('Notifications');
    }
};
