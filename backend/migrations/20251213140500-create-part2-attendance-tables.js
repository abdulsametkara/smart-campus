'use strict';

module.exports = {
    async up(queryInterface, Sequelize) {
        // 1. Classrooms
        await queryInterface.createTable('classrooms', {
            id: {
                allowNull: false,
                autoIncrement: true,
                primaryKey: true,
                type: Sequelize.INTEGER
            },
            name: {
                type: Sequelize.STRING(50),
                allowNull: false
            },
            building: {
                type: Sequelize.STRING(100),
                allowNull: false
            },
            room_number: {
                type: Sequelize.STRING(20),
                allowNull: true
            },
            capacity: {
                type: Sequelize.INTEGER,
                defaultValue: 30
            },
            latitude: {
                type: Sequelize.DECIMAL(10, 8),
                allowNull: false
            },
            longitude: {
                type: Sequelize.DECIMAL(11, 8),
                allowNull: false
            },
            features: {
                type: Sequelize.JSONB,
                allowNull: true // e.g. ["Projector", "SmartBoard"]
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

        // 2. Attendance Sessions
        await queryInterface.createTable('attendance_sessions', {
            id: {
                allowNull: false,
                autoIncrement: true,
                primaryKey: true,
                type: Sequelize.INTEGER
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
            instructor_id: {
                type: Sequelize.INTEGER,
                allowNull: false,
                references: {
                    model: 'users',
                    key: 'id'
                },
                onDelete: 'RESTRICT'
            },
            start_time: {
                type: Sequelize.DATE,
                allowNull: false
            },
            end_time: {
                type: Sequelize.DATE,
                allowNull: true
            },
            latitude: {
                type: Sequelize.DECIMAL(10, 8),
                allowNull: true // Can be dynamic or copied from classroom
            },
            longitude: {
                type: Sequelize.DECIMAL(11, 8),
                allowNull: true
            },
            radius: {
                type: Sequelize.INTEGER,
                defaultValue: 15 // meters
            },
            qr_code: {
                type: Sequelize.STRING,
                allowNull: true
            },
            status: {
                type: Sequelize.ENUM('ACTIVE', 'CLOSED'),
                defaultValue: 'ACTIVE'
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

        // 3. Attendance Records
        await queryInterface.createTable('attendance_records', {
            id: {
                allowNull: false,
                autoIncrement: true,
                primaryKey: true,
                type: Sequelize.INTEGER
            },
            session_id: {
                type: Sequelize.INTEGER,
                allowNull: false,
                references: {
                    model: 'attendance_sessions',
                    key: 'id'
                },
                onDelete: 'CASCADE'
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
            check_in_time: {
                type: Sequelize.DATE,
                defaultValue: Sequelize.fn('now')
            },
            latitude: {
                type: Sequelize.DECIMAL(10, 8),
                allowNull: true
            },
            longitude: {
                type: Sequelize.DECIMAL(11, 8),
                allowNull: true
            },
            distance_from_center: {
                type: Sequelize.FLOAT,
                allowNull: true
            },
            status: {
                type: Sequelize.ENUM('PRESENT', 'ABSENT', 'EXCUSED'),
                defaultValue: 'PRESENT'
            },
            is_flagged: {
                type: Sequelize.BOOLEAN,
                defaultValue: false
            },
            flag_reason: {
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
            }
        });

        // Prevent duplicate check-in for same session
        await queryInterface.addConstraint('attendance_records', {
            fields: ['session_id', 'student_id'],
            type: 'unique',
            name: 'unique_student_session_attendance'
        });

        // 4. Excuse Requests
        await queryInterface.createTable('excuse_requests', {
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
            session_id: {
                type: Sequelize.INTEGER,
                allowNull: true, // Specific session
                references: {
                    model: 'attendance_sessions',
                    key: 'id'
                },
                onDelete: 'SET NULL'
            },
            title: {
                type: Sequelize.STRING(150),
                allowNull: false
            },
            description: {
                type: Sequelize.TEXT,
                allowNull: false
            },
            document_url: {
                type: Sequelize.STRING,
                allowNull: true
            },
            status: {
                type: Sequelize.ENUM('PENDING', 'APPROVED', 'REJECTED'),
                defaultValue: 'PENDING'
            },
            reviewed_by: {
                type: Sequelize.INTEGER,
                allowNull: true,
                references: {
                    model: 'users',
                    key: 'id'
                }
            },
            reviewed_at: {
                type: Sequelize.DATE,
                allowNull: true
            },
            notes: {
                type: Sequelize.TEXT,
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
    },

    async down(queryInterface, Sequelize) {
        await queryInterface.dropTable('excuse_requests');
        await queryInterface.dropTable('attendance_records');
        await queryInterface.dropTable('attendance_sessions');
        await queryInterface.dropTable('classrooms');

        await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_attendance_sessions_status";');
        await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_attendance_records_status";');
        await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_excuse_requests_status";');
    }
};
