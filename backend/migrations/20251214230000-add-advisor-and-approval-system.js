'use strict';

module.exports = {
    up: async (queryInterface, Sequelize) => {
        // 1. Add advisor_id to students table
        await queryInterface.addColumn('students', 'advisor_id', {
            type: Sequelize.INTEGER,
            allowNull: true,
            references: {
                model: 'faculty',
                key: 'id'
            },
            onUpdate: 'CASCADE',
            onDelete: 'SET NULL'
        });

        // 2. Update status enum in enrollments to include PENDING, APPROVED, REJECTED
        // First, we need to drop and recreate the enum
        await queryInterface.sequelize.query(`
            ALTER TYPE "enum_enrollments_status" ADD VALUE IF NOT EXISTS 'PENDING';
        `).catch(() => { });
        await queryInterface.sequelize.query(`
            ALTER TYPE "enum_enrollments_status" ADD VALUE IF NOT EXISTS 'APPROVED';
        `).catch(() => { });
        await queryInterface.sequelize.query(`
            ALTER TYPE "enum_enrollments_status" ADD VALUE IF NOT EXISTS 'REJECTED';
        `).catch(() => { });

        // 3. Add approval fields to enrollments
        await queryInterface.addColumn('enrollments', 'approved_by', {
            type: Sequelize.INTEGER,
            allowNull: true,
            references: {
                model: 'users',
                key: 'id'
            }
        });

        await queryInterface.addColumn('enrollments', 'approved_at', {
            type: Sequelize.DATE,
            allowNull: true
        });

        await queryInterface.addColumn('enrollments', 'rejection_reason', {
            type: Sequelize.STRING,
            allowNull: true
        });

        // 4. Add unique constraint to student_number in users table
        await queryInterface.addIndex('users', ['student_number'], {
            unique: true,
            where: {
                student_number: {
                    [Sequelize.Op.ne]: null
                }
            },
            name: 'users_student_number_unique'
        }).catch(() => {
            console.log('Index may already exist');
        });
    },

    down: async (queryInterface, Sequelize) => {
        await queryInterface.removeColumn('students', 'advisor_id');
        await queryInterface.removeColumn('enrollments', 'approved_by');
        await queryInterface.removeColumn('enrollments', 'approved_at');
        await queryInterface.removeColumn('enrollments', 'rejection_reason');
        await queryInterface.removeIndex('users', 'users_student_number_unique').catch(() => { });
    }
};
