/**
 * Classroom Reservation Integration Tests
 * Developer 4: Classroom Reservation System
 */

process.env.NODE_ENV = 'test';

const request = require('supertest');
const app = require('../../src/app');
const { User, Classroom, Reservation, Wallet, sequelize } = require('../../models');
const bcrypt = require('bcrypt');

describe('Classroom Reservation Integration Tests', () => {
    let studentToken;
    let facultyToken;
    let adminToken;
    let testClassroomId;
    let testReservationId;
    let createdStudent;
    let createdFaculty;
    let createdAdmin;

    const testStudent = {
        email: `test.student.${Date.now()}@campus.edu.tr`,
        password: 'Password1',
        full_name: 'Test Student',
        role: 'student'
    };

    const testFaculty = {
        email: `test.faculty.${Date.now()}@campus.edu.tr`,
        password: 'Password1',
        full_name: 'Test Faculty',
        role: 'faculty'
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
            // Sync database
            await sequelize.sync({ force: true });

            // Create users
            const hashedPassword = await bcrypt.hash('Password1', 10);

            createdStudent = await User.create({
                email: testStudent.email,
                password_hash: hashedPassword,
                full_name: testStudent.full_name,
                role: testStudent.role,
                is_email_verified: true
            });

            createdFaculty = await User.create({
                email: testFaculty.email,
                password_hash: hashedPassword,
                full_name: testFaculty.full_name,
                role: testFaculty.role,
                is_email_verified: true
            });

            createdAdmin = await User.create({
                email: testAdmin.email,
                password_hash: hashedPassword,
                full_name: testAdmin.full_name,
                role: testAdmin.role,
                is_email_verified: true
            });

            // Create test classroom
            const classroom = await Classroom.create({
                name: 'Test Classroom A-101',
                building: 'A Blok',
                room_number: '101',
                capacity: 50,
                equipment: ['projector', 'whiteboard']
            });
            testClassroomId = classroom.id;

            // Login as student
            const studentResponse = await request(app)
                .post('/api/v1/auth/login')
                .send({
                    email: testStudent.email,
                    password: 'Password1'
                });
            studentToken = studentResponse.body.accessToken;

            // Login as faculty
            const facultyResponse = await request(app)
                .post('/api/v1/auth/login')
                .send({
                    email: testFaculty.email,
                    password: 'Password1'
                });
            facultyToken = facultyResponse.body.accessToken;

            // Login as admin
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
        // Cleanup
        if (createdStudent) await createdStudent.destroy({ force: true }).catch(() => {});
        if (createdFaculty) await createdFaculty.destroy({ force: true }).catch(() => {});
        if (createdAdmin) await createdAdmin.destroy({ force: true }).catch(() => {});
        await sequelize.close();
    });

    describe('Reservation Creation', () => {
        test('POST /api/v1/reservations - Student should create reservation', async () => {
            const tomorrow = new Date();
            tomorrow.setDate(tomorrow.getDate() + 1);
            const dateStr = tomorrow.toISOString().split('T')[0];

            const response = await request(app)
                .post('/api/v1/reservations')
                .set('Authorization', `Bearer ${studentToken}`)
                .send({
                    classroom_id: testClassroomId,
                    date: dateStr,
                    start_time: '14:00',
                    end_time: '16:00',
                    purpose: 'Proje sunumu'
                });

            expect(response.status).toBe(201);
            expect(response.body).toHaveProperty('message');
            expect(response.body.reservation).toHaveProperty('status', 'pending');
            expect(response.body.reservation).toHaveProperty('classroom');
            expect(response.body.reservation).toHaveProperty('user');

            testReservationId = response.body.reservation.id;
        });

        test('POST /api/v1/reservations - Faculty should create reservation', async () => {
            const tomorrow = new Date();
            tomorrow.setDate(tomorrow.getDate() + 1);
            const dateStr = tomorrow.toISOString().split('T')[0];

            const response = await request(app)
                .post('/api/v1/reservations')
                .set('Authorization', `Bearer ${facultyToken}`)
                .send({
                    classroom_id: testClassroomId,
                    date: dateStr,
                    start_time: '10:00',
                    end_time: '12:00',
                    purpose: 'Ders verme'
                });

            expect(response.status).toBe(201);
            expect(response.body.reservation).toHaveProperty('status', 'pending');
        });

        test('POST /api/v1/reservations - Admin should NOT create reservation', async () => {
            const tomorrow = new Date();
            tomorrow.setDate(tomorrow.getDate() + 1);
            const dateStr = tomorrow.toISOString().split('T')[0];

            const response = await request(app)
                .post('/api/v1/reservations')
                .set('Authorization', `Bearer ${adminToken}`)
                .send({
                    classroom_id: testClassroomId,
                    date: dateStr,
                    start_time: '08:00',
                    end_time: '10:00',
                    purpose: 'Toplantı'
                });

            expect(response.status).toBe(403);
            expect(response.body.message).toContain('öğrenci veya öğretim görevlisi');
        });

        test('POST /api/v1/reservations - Should reject invalid time range', async () => {
            const tomorrow = new Date();
            tomorrow.setDate(tomorrow.getDate() + 1);
            const dateStr = tomorrow.toISOString().split('T')[0];

            const response = await request(app)
                .post('/api/v1/reservations')
                .set('Authorization', `Bearer ${studentToken}`)
                .send({
                    classroom_id: testClassroomId,
                    date: dateStr,
                    start_time: '16:00',
                    end_time: '14:00', // Invalid: end before start
                    purpose: 'Test'
                });

            expect(response.status).toBe(400);
        });

        test('POST /api/v1/reservations - Should reject missing fields', async () => {
            const response = await request(app)
                .post('/api/v1/reservations')
                .set('Authorization', `Bearer ${studentToken}`)
                .send({
                    classroom_id: testClassroomId
                    // Missing date, start_time, end_time, purpose
                });

            expect(response.status).toBe(400);
        });

        test('POST /api/v1/reservations - Should reject conflict with approved reservation', async () => {
            // First, create and approve a reservation
            const tomorrow = new Date();
            tomorrow.setDate(tomorrow.getDate() + 1);
            const dateStr = tomorrow.toISOString().split('T')[0];

            const reservation = await Reservation.create({
                classroom_id: testClassroomId,
                user_id: createdAdmin.id,
                date: dateStr,
                start_time: '15:00',
                end_time: '17:00',
                purpose: 'Approved reservation',
                status: 'approved'
            });

            // Try to create overlapping reservation
            const response = await request(app)
                .post('/api/v1/reservations')
                .set('Authorization', `Bearer ${studentToken}`)
                .send({
                    classroom_id: testClassroomId,
                    date: dateStr,
                    start_time: '14:00',
                    end_time: '16:00', // Overlaps with 15:00-17:00
                    purpose: 'Conflicting reservation'
                });

            expect(response.status).toBe(409);
            expect(response.body.message).toContain('rezerve edilmiş');
        });
    });

    describe('Reservation Listing', () => {
        test('GET /api/v1/reservations - Should list all reservations', async () => {
            const response = await request(app)
                .get('/api/v1/reservations')
                .set('Authorization', `Bearer ${studentToken}`);

            expect(response.status).toBe(200);
            expect(Array.isArray(response.body)).toBe(true);
        });

        test('GET /api/v1/reservations?status=pending - Should filter by status', async () => {
            const response = await request(app)
                .get('/api/v1/reservations?status=pending')
                .set('Authorization', `Bearer ${studentToken}`);

            expect(response.status).toBe(200);
            expect(Array.isArray(response.body)).toBe(true);
            if (response.body.length > 0) {
                expect(response.body[0].status).toBe('pending');
            }
        });

        test('GET /api/v1/reservations?classroom_id=X - Should filter by classroom', async () => {
            const response = await request(app)
                .get(`/api/v1/reservations?classroom_id=${testClassroomId}`)
                .set('Authorization', `Bearer ${studentToken}`);

            expect(response.status).toBe(200);
            expect(Array.isArray(response.body)).toBe(true);
        });
    });

    describe('Reservation Approval (Admin)', () => {
        test('PATCH /api/v1/reservations/:id/approve - Admin should approve reservation', async () => {
            if (!testReservationId) {
                console.log('Skipping: No reservation to approve');
                return;
            }

            const response = await request(app)
                .patch(`/api/v1/reservations/${testReservationId}/approve`)
                .set('Authorization', `Bearer ${adminToken}`)
                .send({ status: 'approved' });

            expect(response.status).toBe(200);
            expect(response.body.reservation).toHaveProperty('status', 'approved');
            expect(response.body.reservation).toHaveProperty('approved_by');
        });

        test('PATCH /api/v1/reservations/:id/approve - Admin should reject reservation', async () => {
            // Create a new pending reservation
            const tomorrow = new Date();
            tomorrow.setDate(tomorrow.getDate() + 1);
            const dateStr = tomorrow.toISOString().split('T')[0];

            const reservation = await Reservation.create({
                classroom_id: testClassroomId,
                user_id: createdStudent.id,
                date: dateStr,
                start_time: '18:00',
                end_time: '20:00',
                purpose: 'Test rejection',
                status: 'pending'
            });

            const response = await request(app)
                .patch(`/api/v1/reservations/${reservation.id}/approve`)
                .set('Authorization', `Bearer ${adminToken}`)
                .send({ status: 'rejected' });

            expect(response.status).toBe(200);
            expect(response.body.reservation).toHaveProperty('status', 'rejected');
        });

        test('PATCH /api/v1/reservations/:id/approve - Non-admin should NOT approve', async () => {
            const tomorrow = new Date();
            tomorrow.setDate(tomorrow.getDate() + 1);
            const dateStr = tomorrow.toISOString().split('T')[0];

            const reservation = await Reservation.create({
                classroom_id: testClassroomId,
                user_id: createdStudent.id,
                date: dateStr,
                start_time: '20:00',
                end_time: '22:00',
                purpose: 'Test unauthorized',
                status: 'pending'
            });

            const response = await request(app)
                .patch(`/api/v1/reservations/${reservation.id}/approve`)
                .set('Authorization', `Bearer ${studentToken}`)
                .send({ status: 'approved' });

            expect(response.status).toBe(403);
        });

        test('PATCH /api/v1/reservations/:id/approve - Should reject conflict on approval', async () => {
            // Create an approved reservation
            const tomorrow = new Date();
            tomorrow.setDate(tomorrow.getDate() + 1);
            const dateStr = tomorrow.toISOString().split('T')[0];

            const approvedReservation = await Reservation.create({
                classroom_id: testClassroomId,
                user_id: createdAdmin.id,
                date: dateStr,
                start_time: '13:00',
                end_time: '15:00',
                purpose: 'Approved',
                status: 'approved'
            });

            // Create a pending reservation that conflicts
            const pendingReservation = await Reservation.create({
                classroom_id: testClassroomId,
                user_id: createdStudent.id,
                date: dateStr,
                start_time: '14:00',
                end_time: '16:00', // Overlaps with 13:00-15:00
                purpose: 'Pending conflict',
                status: 'pending'
            });

            const response = await request(app)
                .patch(`/api/v1/reservations/${pendingReservation.id}/approve`)
                .set('Authorization', `Bearer ${adminToken}`)
                .send({ status: 'approved' });

            expect(response.status).toBe(409);
            expect(response.body.message).toContain('conflict');
        });
    });

    describe('Authorization', () => {
        test('Should reject unauthorized access', async () => {
            const response = await request(app)
                .get('/api/v1/reservations');

            expect(response.status).toBe(401);
        });
    });
});

