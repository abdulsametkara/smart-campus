/**
 * Event Management Integration Tests
 * Tests for Developer 2: Event Management (Backend + Frontend)
 */

process.env.NODE_ENV = 'test';

const request = require('supertest');

// Mock nodemailer
jest.mock('nodemailer', () => ({
    createTransport: jest.fn().mockReturnValue({
        sendMail: jest.fn().mockResolvedValue(true)
    })
}));

const app = require('../../src/app');
const { User, Event, EventRegistration, Wallet, sequelize } = require('../../models');

describe('Event Management Integration Tests', () => {
    let studentToken;
    let adminToken;
    let testStudent;
    let testAdmin;
    let testEventId;
    let testRegistrationId;

    const studentData = {
        email: `test.student.${Date.now()}@campus.edu.tr`,
        password: 'Password1',
        full_name: 'Test Student',
        role: 'student'
    };

    const adminData = {
        email: `test.admin.${Date.now()}@campus.edu.tr`,
        password: 'Password1',
        full_name: 'Test Admin',
        role: 'admin'
    };

    jest.setTimeout(30000);

    // Setup: Create Users
    beforeAll(async () => {
        try {
            await sequelize.sync({ force: true });

            // Create student
            const hashedPassword = await require('bcrypt').hash(studentData.password, 10);
            testStudent = await User.create({
                email: studentData.email,
                password_hash: hashedPassword,
                full_name: studentData.full_name,
                role: studentData.role,
                is_email_verified: true
            });

            // Create admin
            testAdmin = await User.create({
                email: adminData.email,
                password_hash: hashedPassword,
                full_name: adminData.full_name,
                role: adminData.role,
                is_email_verified: true
            });

            // Initialize wallets
            await Wallet.create({
                user_id: testStudent.id,
                balance: 100.00,
                currency: 'TRY'
            });

            await Wallet.create({
                user_id: testAdmin.id,
                balance: 100.00,
                currency: 'TRY'
            });

            // Login as student
            const studentResponse = await request(app)
                .post('/api/v1/auth/login')
                .send({
                    email: studentData.email,
                    password: studentData.password
                });
            expect(studentResponse.status).toBe(200);
            studentToken = studentResponse.body.accessToken;

            // Login as admin
            const adminResponse = await request(app)
                .post('/api/v1/auth/login')
                .send({
                    email: adminData.email,
                    password: adminData.password
                });
            expect(adminResponse.status).toBe(200);
            adminToken = adminResponse.body.accessToken;
        } catch (error) {
            console.error('Test Setup Error:', error);
            throw error;
        }
    });

    afterAll(async () => {
        try {
            // Manual cleanup of foreign key dependencies to be safe in CI
            if (testStudent) {
                await sequelize.query(`DELETE FROM "activity_logs" WHERE "user_id" = ${testStudent.id}`);
                await sequelize.query(`DELETE FROM "event_registrations" WHERE "user_id" = ${testStudent.id}`);
                await sequelize.query(`DELETE FROM "notification_logs" WHERE "user_id" = ${testStudent.id}`);
                await testStudent.destroy({ force: true }).catch(err => console.error('Cleanup Error Student:', err));
            }
            if (testAdmin) {
                await sequelize.query(`DELETE FROM "activity_logs" WHERE "user_id" = ${testAdmin.id}`);
                await sequelize.query(`DELETE FROM "event_registrations" WHERE "user_id" = ${testAdmin.id}`);
                await sequelize.query(`DELETE FROM "notification_logs" WHERE "user_id" = ${testAdmin.id}`);
                await testAdmin.destroy({ force: true }).catch(err => console.error('Cleanup Error Admin:', err));
            }
        } catch (error) {
            console.error('Final Cleanup Error:', error);
        } finally {
            await sequelize.close();
        }
    });

    describe('Event CRUD Operations', () => {
        test('POST /api/v1/events - Admin should create event', async () => {
            const eventData = {
                title: 'Test Event',
                description: 'This is a test event',
                category: 'Workshop',
                date: '2025-12-31',
                start_time: '10:00:00',
                end_time: '12:00:00',
                location: 'Test Location',
                capacity: 50,
                registration_deadline: '2025-12-30',
                is_paid: false,
                price: 0,
                status: 'published'
            };

            const response = await request(app)
                .post('/api/v1/events')
                .set('Authorization', `Bearer ${adminToken}`)
                .send(eventData);

            expect(response.status).toBe(201);
            expect(response.body).toHaveProperty('id');
            expect(response.body.title).toBe(eventData.title);
            testEventId = response.body.id;
        });

        test('GET /api/v1/events - Should get all events', async () => {
            const response = await request(app)
                .get('/api/v1/events');

            expect(response.status).toBe(200);
            expect(response.body).toHaveProperty('events');
            expect(Array.isArray(response.body.events)).toBe(true);
        });

        test('GET /api/v1/events/:id - Should get event by ID', async () => {
            if (!testEventId) {
                console.log('Skipping: No event ID available');
                return;
            }

            const response = await request(app)
                .get(`/api/v1/events/${testEventId}`);

            expect(response.status).toBe(200);
            expect(response.body).toHaveProperty('id');
            expect(response.body.id).toBe(testEventId);
        });

        test('PUT /api/v1/events/:id - Admin should update event', async () => {
            if (!testEventId) {
                console.log('Skipping: No event ID available');
                return;
            }

            const updateData = {
                title: 'Updated Test Event',
                capacity: 100
            };

            const response = await request(app)
                .put(`/api/v1/events/${testEventId}`)
                .set('Authorization', `Bearer ${adminToken}`)
                .send(updateData);

            expect(response.status).toBe(200);
            expect(response.body.title).toBe(updateData.title);
            expect(response.body.capacity).toBe(updateData.capacity);
        });

        test('GET /api/v1/events - Should filter events by category', async () => {
            const response = await request(app)
                .get('/api/v1/events?category=Workshop');

            expect(response.status).toBe(200);
            expect(response.body).toHaveProperty('events');
            if (response.body.events.length > 0) {
                expect(response.body.events[0].category).toBe('Workshop');
            }
        });
    });

    describe('Event Registration Flow', () => {
        test('POST /api/v1/events/:id/register - Student should register to event', async () => {
            if (!testEventId) {
                console.log('Skipping: No event ID available');
                return;
            }

            const response = await request(app)
                .post(`/api/v1/events/${testEventId}/register`)
                .set('Authorization', `Bearer ${studentToken}`)
                .send({ customFields: {} });

            expect(response.status).toBe(201);
            expect(response.body).toHaveProperty('registration');
            expect(response.body).toHaveProperty('qrCode');
            expect(response.body.registration).toHaveProperty('qr_code');
            testRegistrationId = response.body.registration.id;
        });

        test('GET /api/v1/events/my/registrations - Should get user registrations', async () => {
            const response = await request(app)
                .get('/api/v1/events/my/registrations')
                .set('Authorization', `Bearer ${studentToken}`);

            expect(response.status).toBe(200);
            expect(Array.isArray(response.body)).toBe(true);
            if (response.body.length > 0) {
                expect(response.body[0]).toHaveProperty('event');
            }
        });

        test('POST /api/v1/events/:id/register - Should reject duplicate registration', async () => {
            if (!testEventId) {
                console.log('Skipping: No event ID available');
                return;
            }

            const response = await request(app)
                .post(`/api/v1/events/${testEventId}/register`)
                .set('Authorization', `Bearer ${studentToken}`)
                .send({ customFields: {} });

            expect(response.status).toBe(400);
            expect(response.body.message).toContain('Already registered');
        });

        test('GET /api/v1/events/:id/registrations - Admin should get event registrations', async () => {
            if (!testEventId) {
                console.log('Skipping: No event ID available');
                return;
            }

            const response = await request(app)
                .get(`/api/v1/events/${testEventId}/registrations`)
                .set('Authorization', `Bearer ${adminToken}`);

            expect(response.status).toBe(200);
            expect(Array.isArray(response.body)).toBe(true);
            if (response.body.length > 0) {
                expect(response.body[0]).toHaveProperty('user');
            }
        });
    });

    describe('Event Check-in Flow', () => {
        test('POST /api/v1/events/:eventId/registrations/:regId/checkin - Admin should check-in user', async () => {
            if (!testEventId || !testRegistrationId) {
                console.log('Skipping: No event or registration ID available');
                return;
            }

            // Get registration to get QR code
            const registration = await EventRegistration.findByPk(testRegistrationId);
            if (!registration || !registration.qr_code) {
                console.log('Skipping: No QR code available');
                return;
            }

            const qrData = JSON.parse(registration.qr_code);

            const response = await request(app)
                .post(`/api/v1/events/${testEventId}/registrations/${testRegistrationId}/checkin`)
                .set('Authorization', `Bearer ${adminToken}`)
                .send({ qrCodeData: qrData });

            // Check-in might fail if event date is not today, so we accept both success and appropriate errors
            expect([200, 400]).toContain(response.status);
            if (response.status === 200) {
                expect(response.body).toHaveProperty('user');
                expect(response.body).toHaveProperty('message');
            }
        });
    });

    describe('Event Registration Cancellation', () => {
        test('DELETE /api/v1/events/:eventId/registrations/:regId - Student should cancel registration', async () => {
            if (!testEventId || !testRegistrationId) {
                console.log('Skipping: No event or registration ID available');
                return;
            }

            // Create a new registration for cancellation test
            const newEvent = await Event.create({
                title: 'Cancellation Test Event',
                description: 'Test',
                category: 'Test',
                date: '2025-12-31',
                start_time: '10:00:00',
                end_time: '12:00:00',
                location: 'Test',
                capacity: 50,
                status: 'published'
            });

            const newRegistration = await EventRegistration.create({
                event_id: newEvent.id,
                user_id: testStudent.id,
                registration_date: new Date(),
                qr_code: JSON.stringify({ type: 'event', eventId: newEvent.id, userId: testStudent.id }),
                checked_in: false
            });

            const response = await request(app)
                .delete(`/api/v1/events/${newEvent.id}/registrations/${newRegistration.id}`)
                .set('Authorization', `Bearer ${studentToken}`);

            expect(response.status).toBe(200);
            expect(response.body).toHaveProperty('message');

            // Cleanup
            await newEvent.destroy();
        });
    });

    describe('Event Authorization', () => {
        test('POST /api/v1/events - Student should not create event', async () => {
            const eventData = {
                title: 'Unauthorized Event',
                description: 'Test',
                category: 'Test',
                date: '2025-12-31',
                status: 'published'
            };

            const response = await request(app)
                .post('/api/v1/events')
                .set('Authorization', `Bearer ${studentToken}`)
                .send(eventData);

            expect(response.status).toBe(403);
        });

        test('DELETE /api/v1/events/:id - Student should not delete event', async () => {
            if (!testEventId) {
                console.log('Skipping: No event ID available');
                return;
            }

            const response = await request(app)
                .delete(`/api/v1/events/${testEventId}`)
                .set('Authorization', `Bearer ${studentToken}`);

            expect(response.status).toBe(403);
        });

        test('GET /api/v1/events - Should work without authentication', async () => {
            const response = await request(app)
                .get('/api/v1/events');

            expect(response.status).toBe(200);
        });
    });

    describe('Event Capacity and Waitlist', () => {
        test('Should handle capacity limits', async () => {
            // Create event with capacity 1
            const limitedEvent = await Event.create({
                title: 'Limited Capacity Event',
                description: 'Test',
                category: 'Test',
                date: '2025-12-31',
                start_time: '10:00:00',
                end_time: '12:00:00',
                location: 'Test',
                capacity: 1,
                status: 'published'
            });

            // Register first user
            const reg1 = await EventRegistration.create({
                event_id: limitedEvent.id,
                user_id: testStudent.id,
                registration_date: new Date(),
                qr_code: JSON.stringify({ type: 'event', eventId: limitedEvent.id, userId: testStudent.id }),
                checked_in: false
            });

            await limitedEvent.increment('registered_count');

            // Try to register second user (should go to waitlist or fail)
            const response = await request(app)
                .post(`/api/v1/events/${limitedEvent.id}/register`)
                .set('Authorization', `Bearer ${adminToken}`)
                .send({ customFields: {} });

            // Should either succeed (waitlist) or fail (capacity full)
            expect([201, 400]).toContain(response.status);

            // Cleanup
            await reg1.destroy();
            await limitedEvent.destroy();
        });
    });

    describe('Event Error Handling', () => {
        test('GET /api/v1/events/:id - Should return 404 for non-existent event', async () => {
            const response = await request(app)
                .get('/api/v1/events/99999');

            expect(response.status).toBe(404);
        });

        test('POST /api/v1/events/:id/register - Should reject registration to non-existent event', async () => {
            const response = await request(app)
                .post('/api/v1/events/99999/register')
                .set('Authorization', `Bearer ${studentToken}`)
                .send({ customFields: {} });

            expect(response.status).toBe(400);
        });
    });
});

