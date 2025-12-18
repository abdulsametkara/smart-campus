'use strict';

module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.createTable('saved_cards', {
            id: {
                allowNull: false,
                autoIncrement: true,
                primaryKey: true,
                type: Sequelize.INTEGER
            },
            user_id: {
                type: Sequelize.INTEGER,
                allowNull: false,
                references: { model: 'users', key: 'id' },
                onUpdate: 'CASCADE',
                onDelete: 'CASCADE'
            },
            card_holder: {
                type: Sequelize.STRING,
                allowNull: false
            },
            card_last_four: {
                type: Sequelize.STRING(4),
                allowNull: false
            },
            card_brand: {
                type: Sequelize.STRING(20),
                allowNull: true,
                defaultValue: 'Visa'
            },
            expiry_month: {
                type: Sequelize.STRING(2),
                allowNull: false
            },
            expiry_year: {
                type: Sequelize.STRING(2),
                allowNull: false
            },
            is_default: {
                type: Sequelize.BOOLEAN,
                allowNull: false,
                defaultValue: false
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

        // Index for faster user lookups
        await queryInterface.addIndex('saved_cards', ['user_id']);
    },

    async down(queryInterface, Sequelize) {
        await queryInterface.dropTable('saved_cards');
    }
};
