'use strict';

module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.createTable('Sensors', {
            id: {
                allowNull: false,
                autoIncrement: true,
                primaryKey: true,
                type: Sequelize.INTEGER
            },
            name: {
                type: Sequelize.STRING,
                allowNull: false
            },
            type: {
                type: Sequelize.STRING, // temperature, humidity, occupancy, etc.
                allowNull: false
            },
            location: {
                type: Sequelize.STRING,
                allowNull: true
            },
            status: {
                type: Sequelize.ENUM('active', 'inactive', 'maintenance'),
                defaultValue: 'active'
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

        await queryInterface.createTable('SensorData', {
            id: {
                allowNull: false,
                autoIncrement: true,
                primaryKey: true,
                type: Sequelize.INTEGER
            },
            sensorId: {
                type: Sequelize.INTEGER,
                allowNull: false,
                references: {
                    model: 'Sensors',
                    key: 'id'
                },
                onUpdate: 'CASCADE',
                onDelete: 'CASCADE'
            },
            value: {
                type: Sequelize.FLOAT,
                allowNull: false
            },
            unit: {
                type: Sequelize.STRING(20),
                allowNull: true
            },
            timestamp: {
                allowNull: false,
                type: Sequelize.DATE,
                defaultValue: Sequelize.NOW
            },
            createdAt: { // Technical field
                allowNull: false,
                type: Sequelize.DATE
            },
            updatedAt: {
                allowNull: false,
                type: Sequelize.DATE
            }
        });

        // Time-series queries will be frequent
        await queryInterface.addIndex('SensorData', ['sensorId', 'timestamp']);
    },

    async down(queryInterface, Sequelize) {
        await queryInterface.dropTable('SensorData');
        await queryInterface.dropTable('Sensors');
    }
};
