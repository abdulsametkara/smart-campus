'use strict';
module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.createTable('grades', {
            id: {
                allowNull: false,
                autoIncrement: true,
                primaryKey: true,
                type: Sequelize.INTEGER
            },
            exam_id: {
                type: Sequelize.INTEGER,
                allowNull: false,
                references: { model: 'exams', key: 'id' },
                onUpdate: 'CASCADE',
                onDelete: 'CASCADE'
            },
            student_id: {
                type: Sequelize.INTEGER,
                allowNull: false,
                references: { model: 'users', key: 'id' }, // Linking to Users table (students are users)
                onUpdate: 'CASCADE',
                onDelete: 'CASCADE'
            },
            score: {
                type: Sequelize.FLOAT,
                allowNull: false
            },
            feedback: {
                type: Sequelize.TEXT
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

        // Add composite unique index to prevent duplicate grades for same exam/student
        await queryInterface.addIndex('grades', ['exam_id', 'student_id'], {
            unique: true
        });
    },
    async down(queryInterface, Sequelize) {
        await queryInterface.dropTable('grades');
    }
};
