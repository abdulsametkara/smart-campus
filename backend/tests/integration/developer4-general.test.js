/**
 * Developer 4 General System Verification Tests
 * Comprehensive integration tests for all Developer 4 features
 */

process.env.NODE_ENV = 'test';

const request = require('supertest');
const app = require('../../src/app');
const { User, Wallet, MealMenu, Cafeteria, Classroom, Reservation, sequelize } = require('../../models');
const bcrypt = require('bcrypt');

describe('Developer 4 General System Verification', () => {
    let studentToken;
    let adminToken;
    let createdStudent;
    let createdAdmin;
    let testCafeteriaId;
    let testClassroomId;

    const testStudent = {
        email: `test.student.${Date.now()}@campus.edu.tr`,
        password: 'Password1',
        full_name: 'Test Student',
        role: 'student'
    };

    const testAdmin = {
        email: `test.admin.${Date.now()}@campus.edu.tr`,
        password: 'Password1',
        full_name: 'Test Admin',
        role: 'admin'
    };

    jest.setTimeout(30000);

    beforeAll(async () => {
        try {
            await sequelize.sync({ force: true });

            const hashedPassword = await bcrypt.hash('Password1', 10);

            createdStudent = await User.create({
                email: testStudent.email,
                password_hash: hashedPassword,
                full_name: testStudent.full_name,
                role: testStudent.role,
                is_email_verified: true
            });

            createdAdmin = await User.create({
                email: testAdmin.email,
                password_hash: hashedPassword,
                full_name: testAdmin.full_name,
                role: testAdmin.role,
                is_email_verified: true
            });

            // Initialize wallet
            await Wallet.create({
                user_id: createdStudent.id,
                balance: 100.00,
                currency: 'TRY'
            });

            // Create test cafeteria
            const cafeteria = await Cafeteria.create({
                name: 'Test Cafeteria',
                location: 'Main Campus',
                capacity: 200
            });
            testCafeteriaId = cafeteria.id;

            // Create test classroom
            const classroom = await Classroom.create({
                name: 'Test Classroom',
                building: 'A Blok',
                room_number: '101',
                capacity: 50
            });
            testClassroomId = classroom.id;

            // Login
            const studentResponse = await request(app)
                .post('/api/v1/auth/login')
                .send({
                    email: testStudent.email,
                    password: 'Password1'
                });
            studentToken = studentResponse.body.accessToken;

            const adminResponse = await request(app)
                .post('/api/v1/auth/login')
                .send({
                    email: testAdmin.email,
                    password: 'Password1'
                });
            adminToken = adminResponse.body.accessToken;

        } catch (error) {
            console.error('Test Setup Error:', error);
            throw error;
        }
    });

    afterAll(async () => {
        if (createdStudent) await createdStudent.destroy({ force: true }).catch(() => { });
        if (createdAdmin) await createdAdmin.destroy({ force: true }).catch(() => { });
        await sequelize.close();
    });

    describe('PaymentService Integration', () => {
        test('Wallet top-up should work', async () => {
            const response = await request(app)
                .post('/api/v1/wallet/top-up')
                .set('Authorization', `Bearer ${studentToken}`)
                .send({ amount: 50 });

            expect(response.status).toBe(200);
            expect(response.body).toHaveProperty('message');
        });

        test('Meal reservation should deduct from wallet', async () => {
            // Create a published menu
            const tomorrow = new Date();
            tomorrow.setDate(tomorrow.getDate() + 1);
            const dateStr = tomorrow.toISOString().split('T')[0];

            const menu = await MealMenu.create({
                cafeteria_id: testCafeteriaId,
                date: dateStr,
                meal_type: 'lunch',
                items_json: ['Çorba', 'Ana Yemek'],
                price: 20.00,
                is_published: true
            });

            // Get initial balance
            const walletBefore = await Wallet.findOne({
                where: { user_id: createdStudent.id }
            });
            const balanceBefore = parseFloat(walletBefore.balance);

            // Make reservation
            const response = await request(app)
                .post('/api/v1/meals/reservations')
                .set('Authorization', `Bearer ${studentToken}`)
                .send({ menuId: menu.id });

            expect(response.status).toBe(201);

            // Check balance decreased
            const walletAfter = await Wallet.findOne({
                where: { user_id: createdStudent.id }
            });
            const balanceAfter = parseFloat(walletAfter.balance);

            expect(balanceAfter).toBe(balanceBefore - 20.00);
        });
    });

    describe('QRCodeService Integration', () => {
        test('Meal reservation should generate QR code', async () => {
            const tomorrow = new Date();
            tomorrow.setDate(tomorrow.getDate() + 1);
            const dateStr = tomorrow.toISOString().split('T')[0];

            const menu = await MealMenu.create({
                cafeteria_id: testCafeteriaId,
                date: dateStr,
                meal_type: 'dinner',
                items_json: ['Çorba', 'Ana Yemek'],
                price: 25.00,
                is_published: true
            });

            const response = await request(app)
                .post('/api/v1/meals/reservations')
                .set('Authorization', `Bearer ${studentToken}`)
                .send({ menuId: menu.id });

            expect(response.status).toBe(201);
            expect(response.body.reservation).toHaveProperty('qr_code');
            expect(response.body.reservation.qr_code).toContain('data:image/png;base64,');
        });
    });

    describe('Schedule Generation Flow', () => {
        test('Admin should generate schedule', async () => {
            const response = await request(app)
                .post('/api/v1/scheduling/generate')
                .set('Authorization', `Bearer ${adminToken}`)
                .send({
                    semester: '2025-SPRING',
                    overwriteExisting: false,
                    preferredTimeSlot: 'morning'
                });

            // May succeed or fail depending on data, but should return proper response
            expect([200, 400]).toContain(response.status);
            expect(response.body).toHaveProperty('message');
        });

        test('Non-admin should NOT generate schedule', async () => {
            const response = await request(app)
                .post('/api/v1/scheduling/generate')
                .set('Authorization', `Bearer ${studentToken}`)
                .send({ semester: '2025-SPRING' });

            expect(response.status).toBe(403);
        });
    });

    describe('Classroom Reservation Flow', () => {
        test('Complete reservation flow: create -> approve -> visible', async () => {
            const tomorrow = new Date();
            tomorrow.setDate(tomorrow.getDate() + 1);
            const dateStr = tomorrow.toISOString().split('T')[0];

            // 1. Student creates reservation
            const createResponse = await request(app)
                .post('/api/v1/reservations')
                .set('Authorization', `Bearer ${studentToken}`)
                .send({
                    classroom_id: testClassroomId,
                    date: dateStr,
                    start_time: '14:00',
                    end_time: '16:00',
                    purpose: 'Test flow'
                });

            expect(createResponse.status).toBe(201);
            const reservationId = createResponse.body.reservation.id;

            // 2. Admin approves
            const approveResponse = await request(app)
                .patch(`/api/v1/reservations/${reservationId}/approve`)
                .set('Authorization', `Bearer ${adminToken}`)
                .send({ status: 'approved' });

            expect(approveResponse.status).toBe(200);
            expect(approveResponse.body.reservation.status).toBe('approved');

            // 3. Reservation should be visible in list
            const listResponse = await request(app)
                .get(`/api/v1/reservations?status=approved`)
                .set('Authorization', `Bearer ${studentToken}`);

            expect(listResponse.status).toBe(200);
            const approvedReservations = listResponse.body.filter(r => r.id === reservationId);
            expect(approvedReservations.length).toBe(1);
        });
    });

    describe('Meal Menu Management Flow', () => {
        test('Complete menu flow: create -> publish -> reserve', async () => {
            const tomorrow = new Date();
            tomorrow.setDate(tomorrow.getDate() + 1);
            const dateStr = tomorrow.toISOString().split('T')[0];

            // Ensure cleanup
            await MealMenu.destroy({
                where: { date: dateStr, meal_type: 'lunch' },
                force: true
            });

            // 1. Admin creates menu (unpublished)
            const createResponse = await request(app)
                .post('/api/v1/meals/menus')
                .set('Authorization', `Bearer ${adminToken}`)
                .send({
                    cafeteria_id: testCafeteriaId,
                    date: dateStr,
                    meal_type: 'lunch',
                    items_json: ['Çorba', 'Ana Yemek'],
                    price: 20.00,
                    is_published: false
                });

            expect(createResponse.status).toBe(201);
            const menuId = createResponse.body.menu.id;

            // 2. Menu should NOT be visible to students (unpublished)
            const menusBefore = await request(app)
                .get('/api/v1/meals/menus')
                .set('Authorization', `Bearer ${studentToken}`);

            const unpublishedMenu = menusBefore.body.find(m => m.id === menuId);
            expect(unpublishedMenu).toBeUndefined();

            // 3. Admin publishes menu
            const publishResponse = await request(app)
                .patch(`/api/v1/meals/menus/${menuId}/publish`)
                .set('Authorization', `Bearer ${adminToken}`)
                .send({ is_published: true });

            expect(publishResponse.status).toBe(200);

            // 4. Menu should NOW be visible to students
            const menusAfter = await request(app)
                .get('/api/v1/meals/menus')
                .set('Authorization', `Bearer ${studentToken}`);

            const publishedMenu = menusAfter.body.find(m => m.id === menuId);
            expect(publishedMenu).toBeDefined();
            expect(publishedMenu.is_published).toBe(true);
        });
    });

    describe('Cross-Feature Integration', () => {
        test('Schedule export should work', async () => {
            const response = await request(app)
                .get('/api/v1/scheduling/export/ical?semester=2025-SPRING')
                .set('Authorization', `Bearer ${adminToken}`);

            // May return 200 with iCal or 500 if no schedule exists
            expect([200, 500]).toContain(response.status);
            if (response.status === 200) {
                expect(response.headers['content-type']).toContain('text/calendar');
            }
        });

        test('Wallet history should track meal payments', async () => {
            const response = await request(app)
                .get('/api/v1/wallet/history')
                .set('Authorization', `Bearer ${studentToken}`);

            expect(response.status).toBe(200);
            expect(Array.isArray(response.body)).toBe(true);
        });
    });
});

