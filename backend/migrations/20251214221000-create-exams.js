'use strict';
module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.createTable('exams', {
            id: {
                allowNull: false,
                autoIncrement: true,
                primaryKey: true,
                type: Sequelize.INTEGER
            },
            section_id: {
                type: Sequelize.INTEGER,
                allowNull: false,
                references: { model: 'course_sections', key: 'id' },
                onUpdate: 'CASCADE',
                onDelete: 'CASCADE'
            },
            title: {
                type: Sequelize.STRING,
                allowNull: false
            },
            type: {
                type: Sequelize.ENUM('MIDTERM', 'FINAL', 'QUIZ', 'PROJECT', 'OTHER'),
                defaultValue: 'MIDTERM'
            },
            weight: {
                type: Sequelize.INTEGER,
                allowNull: false,
                comment: 'Percentage weight of the exam (0-100)'
            },
            date: {
                type: Sequelize.DATE
            },
            is_published: {
                type: Sequelize.BOOLEAN,
                defaultValue: false
            },
            average_score: {
                type: Sequelize.FLOAT,
                defaultValue: 0
            },
            created_at: {
                allowNull: false,
                type: Sequelize.DATE
            },
            updated_at: {
                allowNull: false,
                type: Sequelize.DATE
            },
            deleted_at: {
                type: Sequelize.DATE
            }
        });

        // Add index for section_id
        await queryInterface.addIndex('exams', ['section_id']);
    },
    async down(queryInterface, Sequelize) {
        await queryInterface.dropTable('exams');
    }
};
