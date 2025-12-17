'use strict';

module.exports = {
    async up(queryInterface, Sequelize) {
        // 1. Update User Role Enum
        try {
            // Postgres specific enum update
            await queryInterface.sequelize.query("ALTER TYPE \"enum_users_role\" ADD VALUE 'cafeteria_staff';");
            await queryInterface.sequelize.query("ALTER TYPE \"enum_users_role\" ADD VALUE 'event_manager';");
        } catch (e) {
            console.log('Enum update skipped or failed (might not be supported by dialect or already exists). Error:', e.message);
        }

        // 2. Create Cafeterias
        await queryInterface.createTable('cafeterias', {
            id: { allowNull: false, autoIncrement: true, primaryKey: true, type: Sequelize.INTEGER },
            name: { type: Sequelize.STRING },
            location: { type: Sequelize.STRING },
            capacity: { type: Sequelize.INTEGER },
            is_active: { type: Sequelize.BOOLEAN, defaultValue: true },
            created_at: { allowNull: false, type: Sequelize.DATE },
            updated_at: { allowNull: false, type: Sequelize.DATE }
        });

        // 3. Create Meal Menus
        await queryInterface.createTable('meal_menus', {
            id: { allowNull: false, autoIncrement: true, primaryKey: true, type: Sequelize.INTEGER },
            cafeteria_id: {
                type: Sequelize.INTEGER,
                references: { model: 'cafeterias', key: 'id' },
                onUpdate: 'CASCADE',
                onDelete: 'CASCADE'
            },
            date: { type: Sequelize.DATEONLY },
            meal_type: { type: Sequelize.ENUM('lunch', 'dinner') },
            items_json: { type: Sequelize.JSONB },
            nutrition_json: { type: Sequelize.JSONB },
            price: { type: Sequelize.DECIMAL(10, 2), defaultValue: 0 },
            is_published: { type: Sequelize.BOOLEAN, defaultValue: false },
            created_at: { allowNull: false, type: Sequelize.DATE },
            updated_at: { allowNull: false, type: Sequelize.DATE }
        });

        // 4. Create Wallets
        await queryInterface.createTable('wallets', {
            id: { allowNull: false, autoIncrement: true, primaryKey: true, type: Sequelize.INTEGER },
            user_id: {
                type: Sequelize.INTEGER,
                references: { model: 'users', key: 'id' },
                onUpdate: 'CASCADE',
                onDelete: 'CASCADE'
            },
            balance: { type: Sequelize.DECIMAL(10, 2), defaultValue: 0 },
            currency: { type: Sequelize.STRING, defaultValue: 'TRY' },
            is_active: { type: Sequelize.BOOLEAN, defaultValue: true },
            created_at: { allowNull: false, type: Sequelize.DATE },
            updated_at: { allowNull: false, type: Sequelize.DATE }
        });

        // 5. Create Meal Reservations
        await queryInterface.createTable('meal_reservations', {
            id: { allowNull: false, autoIncrement: true, primaryKey: true, type: Sequelize.INTEGER },
            user_id: {
                type: Sequelize.INTEGER,
                references: { model: 'users', key: 'id' },
                onUpdate: 'CASCADE',
                onDelete: 'CASCADE'
            },
            menu_id: {
                type: Sequelize.INTEGER,
                references: { model: 'meal_menus', key: 'id' },
                onUpdate: 'CASCADE',
                onDelete: 'CASCADE'
            },
            cafeteria_id: {
                type: Sequelize.INTEGER,
                references: { model: 'cafeterias', key: 'id' },
                onUpdate: 'CASCADE',
                onDelete: 'CASCADE'
            },
            meal_type: { type: Sequelize.ENUM('lunch', 'dinner') },
            date: { type: Sequelize.DATEONLY },
            qr_code: { type: Sequelize.STRING },
            status: {
                type: Sequelize.ENUM('reserved', 'used', 'cancelled'),
                defaultValue: 'reserved'
            },
            used_at: { type: Sequelize.DATE },
            created_at: { allowNull: false, type: Sequelize.DATE },
            updated_at: { allowNull: false, type: Sequelize.DATE }
        });

        // 6. Create Transactions
        await queryInterface.createTable('transactions', {
            id: { allowNull: false, autoIncrement: true, primaryKey: true, type: Sequelize.INTEGER },
            wallet_id: {
                type: Sequelize.INTEGER,
                references: { model: 'wallets', key: 'id' },
                onUpdate: 'CASCADE',
                onDelete: 'CASCADE'
            },
            type: { type: Sequelize.ENUM('credit', 'debit') },
            amount: { type: Sequelize.DECIMAL(10, 2) },
            balance_after: { type: Sequelize.DECIMAL(10, 2) },
            reference_type: { type: Sequelize.STRING },
            reference_id: { type: Sequelize.INTEGER },
            description: { type: Sequelize.STRING },
            created_at: { allowNull: false, type: Sequelize.DATE },
            updated_at: { allowNull: false, type: Sequelize.DATE }
        });

        // 7. Create Events
        await queryInterface.createTable('events', {
            id: { allowNull: false, autoIncrement: true, primaryKey: true, type: Sequelize.INTEGER },
            title: { type: Sequelize.STRING },
            description: { type: Sequelize.TEXT },
            category: { type: Sequelize.STRING },
            date: { type: Sequelize.DATEONLY },
            start_time: { type: Sequelize.TIME },
            end_time: { type: Sequelize.TIME },
            location: { type: Sequelize.STRING },
            capacity: { type: Sequelize.INTEGER },
            registered_count: { type: Sequelize.INTEGER, defaultValue: 0 },
            registration_deadline: { type: Sequelize.DATE },
            is_paid: { type: Sequelize.BOOLEAN, defaultValue: false },
            price: { type: Sequelize.DECIMAL(10, 2), defaultValue: 0 },
            status: {
                type: Sequelize.ENUM('draft', 'published', 'cancelled', 'completed'),
                defaultValue: 'draft'
            },
            created_at: { allowNull: false, type: Sequelize.DATE },
            updated_at: { allowNull: false, type: Sequelize.DATE }
        });

        // 8. Create Event Registrations
        await queryInterface.createTable('event_registrations', {
            id: { allowNull: false, autoIncrement: true, primaryKey: true, type: Sequelize.INTEGER },
            event_id: {
                type: Sequelize.INTEGER,
                references: { model: 'events', key: 'id' },
                onUpdate: 'CASCADE',
                onDelete: 'CASCADE'
            },
            user_id: {
                type: Sequelize.INTEGER,
                references: { model: 'users', key: 'id' },
                onUpdate: 'CASCADE',
                onDelete: 'CASCADE'
            },
            registration_date: { type: Sequelize.DATE },
            qr_code: { type: Sequelize.STRING },
            checked_in: { type: Sequelize.BOOLEAN, defaultValue: false },
            checked_in_at: { type: Sequelize.DATE },
            custom_fields_json: { type: Sequelize.JSONB },
            created_at: { allowNull: false, type: Sequelize.DATE },
            updated_at: { allowNull: false, type: Sequelize.DATE }
        });

        // 9. Create Schedules
        await queryInterface.createTable('schedules', {
            id: { allowNull: false, autoIncrement: true, primaryKey: true, type: Sequelize.INTEGER },
            section_id: {
                type: Sequelize.INTEGER,
                references: { model: 'course_sections', key: 'id' },
                onUpdate: 'CASCADE',
                onDelete: 'CASCADE'
            },
            day_of_week: { type: Sequelize.INTEGER },
            start_time: { type: Sequelize.TIME },
            end_time: { type: Sequelize.TIME },
            classroom_id: {
                type: Sequelize.INTEGER,
                references: { model: 'classrooms', key: 'id' },
                onUpdate: 'CASCADE',
                onDelete: 'CASCADE'
            },
            created_at: { allowNull: false, type: Sequelize.DATE },
            updated_at: { allowNull: false, type: Sequelize.DATE }
        });

        // 10. Create Classroom Reservations
        await queryInterface.createTable('reservations', {
            id: { allowNull: false, autoIncrement: true, primaryKey: true, type: Sequelize.INTEGER },
            classroom_id: {
                type: Sequelize.INTEGER,
                references: { model: 'classrooms', key: 'id' },
                onUpdate: 'CASCADE',
                onDelete: 'CASCADE'
            },
            user_id: {
                type: Sequelize.INTEGER,
                references: { model: 'users', key: 'id' },
                onUpdate: 'CASCADE',
                onDelete: 'CASCADE'
            },
            date: { type: Sequelize.DATEONLY },
            start_time: { type: Sequelize.TIME },
            end_time: { type: Sequelize.TIME },
            purpose: { type: Sequelize.STRING },
            status: {
                type: Sequelize.ENUM('pending', 'approved', 'rejected', 'cancelled'),
                defaultValue: 'pending'
            },
            approved_by: { type: Sequelize.INTEGER },
            created_at: { allowNull: false, type: Sequelize.DATE },
            updated_at: { allowNull: false, type: Sequelize.DATE }
        });
    },

    async down(queryInterface, Sequelize) {
        await queryInterface.dropTable('reservations');
        await queryInterface.dropTable('schedules');
        await queryInterface.dropTable('event_registrations');
        await queryInterface.dropTable('events');
        await queryInterface.dropTable('transactions');
        await queryInterface.dropTable('meal_reservations');
        await queryInterface.dropTable('wallets');
        await queryInterface.dropTable('meal_menus');
        await queryInterface.dropTable('cafeterias');
        // Note: Reverting ENUM changes in Postgres is complex, typically skipped or requires manual intervention
    }
};
