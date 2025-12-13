'use strict';

module.exports = {
    async up(queryInterface, Sequelize) {
        // 1. Courses
        await queryInterface.createTable('courses', {
            id: {
                allowNull: false,
                autoIncrement: true,
                primaryKey: true,
                type: Sequelize.INTEGER
            },
            code: {
                type: Sequelize.STRING(20),
                allowNull: false,
                unique: true
            },
            name: {
                type: Sequelize.STRING(150),
                allowNull: false
            },
            description: {
                type: Sequelize.TEXT,
                allowNull: true
            },
            credits: {
                type: Sequelize.INTEGER,
                allowNull: false,
                defaultValue: 3
            },
            ects: {
                type: Sequelize.INTEGER,
                allowNull: false,
                defaultValue: 5
            },
            department_id: {
                type: Sequelize.INTEGER,
                allowNull: false,
                references: {
                    model: 'departments',
                    key: 'id'
                },
                onUpdate: 'CASCADE',
                onDelete: 'RESTRICT'
            },
            syllabus_url: {
                type: Sequelize.STRING,
                allowNull: true
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
                type: Sequelize.DATE,
                allowNull: true
            }
        });

        // 2. Course Prerequisites
        await queryInterface.createTable('course_prerequisites', {
            course_id: {
                type: Sequelize.INTEGER,
                primaryKey: true,
                references: {
                    model: 'courses',
                    key: 'id'
                },
                onDelete: 'CASCADE'
            },
            prerequisite_id: {
                type: Sequelize.INTEGER,
                primaryKey: true,
                references: {
                    model: 'courses',
                    key: 'id'
                },
                onDelete: 'CASCADE'
            },
            created_at: {
                allowNull: false,
                type: Sequelize.DATE,
                defaultValue: Sequelize.fn('now')
            },
            updated_at: {
                allowNull: false,
                type: Sequelize.DATE,
                defaultValue: Sequelize.fn('now')
            }
        });

        // 3. Course Sections
        await queryInterface.createTable('course_sections', {
            id: {
                allowNull: false,
                autoIncrement: true,
                primaryKey: true,
                type: Sequelize.INTEGER
            },
            course_id: {
                type: Sequelize.INTEGER,
                allowNull: false,
                references: {
                    model: 'courses',
                    key: 'id'
                },
                onDelete: 'CASCADE'
            },
            section_number: {
                type: Sequelize.INTEGER,
                allowNull: false,
                defaultValue: 1
            },
            semester: {
                type: Sequelize.STRING(20),
                allowNull: false // e.g., "2024-FALL"
            },
            instructor_id: {
                type: Sequelize.INTEGER,
                allowNull: false,
                references: {
                    model: 'users',
                    key: 'id'
                },
                onDelete: 'RESTRICT'
            },
            capacity: {
                type: Sequelize.INTEGER,
                allowNull: false,
                defaultValue: 50
            },
            enrolled_count: {
                type: Sequelize.INTEGER,
                allowNull: false,
                defaultValue: 0
            },
            schedule: {
                type: Sequelize.JSONB,
                allowNull: true // e.g. [{day: "Mon", start: "09:00", end: "12:00", room_id: 1}]
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

        // 4. Enrollments
        await queryInterface.createTable('enrollments', {
            id: {
                allowNull: false,
                autoIncrement: true,
                primaryKey: true,
                type: Sequelize.INTEGER
            },
            student_id: {
                type: Sequelize.INTEGER,
                allowNull: false,
                references: {
                    model: 'users',
                    key: 'id'
                },
                onDelete: 'CASCADE'
            },
            section_id: {
                type: Sequelize.INTEGER,
                allowNull: false,
                references: {
                    model: 'course_sections',
                    key: 'id'
                },
                onDelete: 'CASCADE'
            },
            status: {
                type: Sequelize.ENUM('ACTIVE', 'DROPPED', 'FAILED', 'PASSED'),
                defaultValue: 'ACTIVE'
            },
            enrollment_date: {
                type: Sequelize.DATE,
                defaultValue: Sequelize.fn('now')
            },
            midterm_grade: {
                type: Sequelize.FLOAT,
                allowNull: true
            },
            final_grade: {
                type: Sequelize.FLOAT,
                allowNull: true
            },
            letter_grade: {
                type: Sequelize.STRING(5),
                allowNull: true
            },
            grade_point: {
                type: Sequelize.FLOAT,
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

        // Add unique constraint for student-section pair
        await queryInterface.addConstraint('enrollments', {
            fields: ['student_id', 'section_id'],
            type: 'unique',
            name: 'unique_student_section_enrollment'
        });
    },

    async down(queryInterface, Sequelize) {
        await queryInterface.dropTable('enrollments');
        await queryInterface.dropTable('course_sections');
        await queryInterface.dropTable('course_prerequisites');
        await queryInterface.dropTable('courses');
        // Note: ENUM deletion might be needed depending on dialect, but usually dropping table handles columns.
        await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_enrollments_status";');
    }
};
