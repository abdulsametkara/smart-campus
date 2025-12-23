/**
 * Meal Menu Management Integration Tests
 * Developer 4: Admin Menu CRUD Operations
 */

process.env.NODE_ENV = 'test';

const request = require('supertest');
const app = require('../../src/app');
const { User, MealMenu, Cafeteria, MealReservation, sequelize } = require('../../models');
const bcrypt = require('bcrypt');

describe('Meal Menu Management Integration Tests', () => {
    let adminToken;
    let studentToken;
    let testCafeteriaId;
    let testMenuId;
    let createdAdmin;
    let createdStudent;

    const testAdmin = {
        email: `test.admin.${Date.now()}@campus.edu.tr`,
        password: 'Password1',
        full_name: 'Test Admin',
        role: 'admin'
    };

    const testStudent = {
        email: `test.student.${Date.now()}@campus.edu.tr`,
        password: 'Password1',
        full_name: 'Test Student',
        role: 'student'
    };

    jest.setTimeout(30000);

    beforeAll(async () => {
        try {
            await sequelize.sync({ force: true });

            const hashedPassword = await bcrypt.hash('Password1', 10);

            createdAdmin = await User.create({
                email: testAdmin.email,
                password_hash: hashedPassword,
                full_name: testAdmin.full_name,
                role: testAdmin.role,
                is_email_verified: true
            });

            createdStudent = await User.create({
                email: testStudent.email,
                password_hash: hashedPassword,
                full_name: testStudent.full_name,
                role: testStudent.role,
                is_email_verified: true
            });

            // Create test cafeteria
            const cafeteria = await Cafeteria.create({
                name: 'Test Cafeteria',
                location: 'Main Campus',
                capacity: 200
            });
            testCafeteriaId = cafeteria.id;

            // Login
            const adminResponse = await request(app)
                .post('/api/v1/auth/login')
                .send({
                    email: testAdmin.email,
                    password: 'Password1'
                });
            adminToken = adminResponse.body.accessToken;

            const studentResponse = await request(app)
                .post('/api/v1/auth/login')
                .send({
                    email: testStudent.email,
                    password: 'Password1'
                });
            studentToken = studentResponse.body.accessToken;

            // Cleanup existing menus for test date to prevent "Menu already exists" error
            const tomorrow = new Date();
            tomorrow.setDate(tomorrow.getDate() + 1);
            const dateStr = tomorrow.toISOString().split('T')[0];
            await MealMenu.destroy({ where: { date: dateStr } });

        } catch (error) {
            console.error('Test Setup Error:', error);
            throw error;
        }
    });

    afterAll(async () => {
        try {
            if (createdAdmin) {
                await sequelize.query(`DELETE FROM "activity_logs" WHERE "user_id" = ${createdAdmin.id}`);
                await sequelize.query(`DELETE FROM "notification_logs" WHERE "user_id" = ${createdAdmin.id}`);
                await createdAdmin.destroy({ force: true }).catch(() => { });
            }
            if (createdStudent) {
                await sequelize.query(`DELETE FROM "activity_logs" WHERE "user_id" = ${createdStudent.id}`);
                await sequelize.query(`DELETE FROM "notification_logs" WHERE "user_id" = ${createdStudent.id}`);
                await sequelize.query(`DELETE FROM "meal_reservations" WHERE "user_id" = ${createdStudent.id}`);
                await createdStudent.destroy({ force: true }).catch(() => { });
            }
        } catch (e) {
            console.error('Cleanup Error:', e);
        }
        await sequelize.close();
    });

    describe('Menu Creation (Admin)', () => {
        test('POST /api/v1/meals/menus - Admin should create menu', async () => {
            // Ensure clean state for this test
            const tomorrow = new Date();
            tomorrow.setDate(tomorrow.getDate() + 1);
            const dateStr = tomorrow.toISOString().split('T')[0];
            await MealMenu.destroy({ where: { date: dateStr, meal_type: 'lunch' }, force: true });

            const menuData = {
                cafeteria_id: testCafeteriaId,
                date: dateStr,
                meal_type: 'lunch',
                items: [
                    { name: 'Lentil Soup', calories: 150 },
                    { name: 'Grilled Chicken', calories: 400 },
                    { name: 'Rice', calories: 200 },
                    { name: 'Salad', calories: 50 }
                ],
                price: 20.00,
                is_published: true
            };

            const response = await request(app)
                .post('/api/v1/meals/menus')
                .set('Authorization', `Bearer ${adminToken}`)
                .send(menuData);

            expect(response.status).toBe(201);
            expect(response.body).toHaveProperty('id');
            expect(response.body).toHaveProperty('meal_type', 'lunch');
            expect(response.body).toHaveProperty('price', '20.00');
            expect(response.body).toHaveProperty('is_published', true);

            testMenuId = response.body.id;
        });

        test('POST /api/v1/meals/menus - Should create dinner menu', async () => {
            const tomorrow = new Date();
            tomorrow.setDate(tomorrow.getDate() + 1);
            const dateStr = tomorrow.toISOString().split('T')[0];

            const menuData = {
                cafeteria_id: testCafeteriaId,
                date: dateStr,
                meal_type: 'dinner',
                items_json: ['Çorba', 'Ana Yemek', 'Tatlı'],
                nutrition_json: {
                    total: { calories: 600, protein: 30, carbs: 70 }
                },
                price: 25.00,
                is_published: false
            };

            const response = await request(app)
                .post('/api/v1/meals/menus')
                .set('Authorization', `Bearer ${adminToken}`)
                .send(menuData);

            expect(response.status).toBe(201);
            expect(response.body).toHaveProperty('meal_type', 'dinner');
            expect(response.body).toHaveProperty('is_published', false);
        });

        test('POST /api/v1/meals/menus - Non-admin should NOT create menu', async () => {
            const tomorrow = new Date();
            tomorrow.setDate(tomorrow.getDate() + 1);
            const dateStr = tomorrow.toISOString().split('T')[0];

            const response = await request(app)
                .post('/api/v1/meals/menus')
                .set('Authorization', `Bearer ${studentToken}`)
                .send({
                    cafeteria_id: testCafeteriaId,
                    date: dateStr,
                    meal_type: 'lunch',
                    items_json: [],
                    price: 20.00
                });

            expect(response.status).toBe(403);
        });
    });

    describe('Menu Listing', () => {
        test('GET /api/v1/meals/menus - Should list published menus only', async () => {
            const response = await request(app)
                .get('/api/v1/meals/menus')
                .set('Authorization', `Bearer ${studentToken}`);

            expect(response.status).toBe(200);
            expect(Array.isArray(response.body)).toBe(true);

            // All returned menus should be published
            response.body.forEach(menu => {
                expect(menu.is_published).toBe(true);
            });
        });

        test('GET /api/v1/meals/menus/all - Admin should see all menus', async () => {
            const response = await request(app)
                .get('/api/v1/meals/menus/all')
                .set('Authorization', `Bearer ${adminToken}`);

            expect(response.status).toBe(200);
            expect(Array.isArray(response.body)).toBe(true);
        });

        test('GET /api/v1/meals/menus/all - Non-admin should NOT access', async () => {
            const response = await request(app)
                .get('/api/v1/meals/menus/all')
                .set('Authorization', `Bearer ${studentToken}`);

            expect(response.status).toBe(403);
        });
    });

    describe('Menu Update (Admin)', () => {
        test('PUT /api/v1/meals/menus/:id - Admin should update menu', async () => {
            if (!testMenuId) {
                console.log('Skipping: No menu to update');
                return;
            }

            const updateData = {
                items_json: ['Çorba', 'Ana Yemek', 'Pilav', 'Salata', 'Tatlı'],
                price: 22.00
            };

            const response = await request(app)
                .put(`/api/v1/meals/menus/${testMenuId}`)
                .set('Authorization', `Bearer ${adminToken}`)
                .send(updateData);

            expect(response.status).toBe(200);
            expect(response.body).toHaveProperty('price', '22.00');
        });

        test('PUT /api/v1/meals/menus/:id - Non-admin should NOT update', async () => {
            if (!testMenuId) return;

            const response = await request(app)
                .put(`/api/v1/meals/menus/${testMenuId}`)
                .set('Authorization', `Bearer ${studentToken}`)
                .send({ price: 15.00 });

            expect(response.status).toBe(403);
        });
    });

    describe('Menu Publishing (Admin)', () => {
        test('PATCH /api/v1/meals/menus/:id/publish - Admin should publish menu', async () => {
            // Create unpublished menu
            const tomorrow = new Date();
            tomorrow.setDate(tomorrow.getDate() + 1);
            const dateStr = tomorrow.toISOString().split('T')[0];

            const menu = await MealMenu.create({
                cafeteria_id: testCafeteriaId,
                date: dateStr,
                meal_type: 'lunch',
                items_json: [],
                price: 20.00,
                is_published: false
            });

            const response = await request(app)
                .patch(`/api/v1/meals/menus/${menu.id}/publish`)
                .set('Authorization', `Bearer ${adminToken}`)
                .send({ is_published: true });

            expect(response.status).toBe(200);
            expect(response.body).toHaveProperty('is_published', true);
        });

        test('PATCH /api/v1/meals/menus/:id/publish - Admin should unpublish menu', async () => {
            if (!testMenuId) return;

            const response = await request(app)
                .patch(`/api/v1/meals/menus/${testMenuId}/publish`)
                .set('Authorization', `Bearer ${adminToken}`)
                .send({ is_published: false });

            expect(response.status).toBe(200);
            expect(response.body).toHaveProperty('is_published', false);
        });
    });

    describe('Menu Deletion (Admin)', () => {
        test('DELETE /api/v1/meals/menus/:id - Admin should delete menu without reservations', async () => {
            // Create a menu without reservations
            const tomorrow = new Date();
            tomorrow.setDate(tomorrow.getDate() + 1);
            const dateStr = tomorrow.toISOString().split('T')[0];

            const menu = await MealMenu.create({
                cafeteria_id: testCafeteriaId,
                date: dateStr,
                meal_type: 'lunch',
                items_json: [],
                price: 20.00,
                is_published: false
            });

            const response = await request(app)
                .delete(`/api/v1/meals/menus/${menu.id}`)
                .set('Authorization', `Bearer ${adminToken}`);

            expect(response.status).toBe(200);
        });

        test('DELETE /api/v1/meals/menus/:id - Should NOT delete menu with active reservations', async () => {
            if (!testMenuId) return;

            // Create a reservation for the menu
            await MealReservation.create({
                user_id: createdStudent.id,
                menu_id: testMenuId,
                status: 'reserved',
                qr_code: 'test-qr-code'
            });

            const response = await request(app)
                .delete(`/api/v1/meals/menus/${testMenuId}`)
                .set('Authorization', `Bearer ${adminToken}`);

            expect(response.status).toBe(400);
            expect(response.body.message).toContain('active reservations');
        });

        test('DELETE /api/v1/meals/menus/:id - Non-admin should NOT delete', async () => {
            const tomorrow = new Date();
            tomorrow.setDate(tomorrow.getDate() + 1);
            const dateStr = tomorrow.toISOString().split('T')[0];

            const menu = await MealMenu.create({
                cafeteria_id: testCafeteriaId,
                date: dateStr,
                meal_type: 'lunch',
                items_json: [],
                price: 20.00,
                is_published: false
            });

            const response = await request(app)
                .delete(`/api/v1/meals/menus/${menu.id}`)
                .set('Authorization', `Bearer ${studentToken}`);

            expect(response.status).toBe(403);
        });
    });
});

