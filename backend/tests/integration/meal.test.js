/**
 * Meal Reservation Flow Integration Tests
 * Tests for Developer 1 Part 3: Meal Service & Wallet
 */

process.env.NODE_ENV = 'test';

const request = require('supertest');
const app = require('../../src/app');
const { User, Wallet, sequelize } = require('../../models');

describe('Meal Service Integration Tests', () => {
    let authToken;
    let testMenuId;
    let testReservationId;
    let createdUser;

    const testUser = {
        email: `test.student.${Date.now()}@campus.edu.tr`,
        password: 'Password1',
        full_name: 'Test Student',
        role: 'student'
    };

    jest.setTimeout(30000);

    // Setup: Create User
    beforeAll(async () => {
        try {
            // Sync database to create tables (crucial for SQLite in-memory tests)
            await sequelize.sync({ force: true });

            // Create user directly in DB
            const hashedPassword = await require('bcrypt').hash(testUser.password, 10);
            createdUser = await User.create({
                email: testUser.email,
                password_hash: hashedPassword,
                full_name: testUser.full_name,
                role: testUser.role,
                is_email_verified: true
            });

            // Initialize wallet for user
            await Wallet.create({
                user_id: createdUser.id,
                balance: 100.00, // Pre-load balance for tests
                currency: 'TRY'
            });

            // Login
            const response = await request(app)
                .post('/api/v1/auth/login')
                .send({
                    email: testUser.email,
                    password: testUser.password
                });

            if (response.status !== 200) {
                console.error('Test Setup Login Failed:', response.body);
            }

            expect(response.status).toBe(200);
            authToken = response.body.accessToken;
        } catch (error) {
            console.error('Test Setup Error:', error);
            throw error;
        }
    });

    afterAll(async () => {
        if (createdUser) {
            // Cleanup: Force delete user (cascade should handle wallet/reservations)
            await createdUser.destroy({ force: true }).catch(err => console.error('Cleanup Error:', err));
        }
        await sequelize.close(); // Close DB connection
    });

    describe('Menu Endpoints', () => {
        test('GET /api/v1/meals/menus - Should get weekly menus', async () => {
            const response = await request(app)
                .get('/api/v1/meals/menus')
                .set('Authorization', `Bearer ${authToken}`);

            expect(response.status).toBe(200);
            expect(Array.isArray(response.body)).toBe(true);

            if (response.body.length > 0) {
                testMenuId = response.body[0].id;
            }
        });
    });

    describe('Wallet Endpoints', () => {
        test('GET /api/v1/wallet - Should get user wallet', async () => {
            const response = await request(app)
                .get('/api/v1/wallet')
                .set('Authorization', `Bearer ${authToken}`);

            expect(response.status).toBe(200);
            expect(response.body).toHaveProperty('balance');
            expect(Number(response.body.balance)).toBeGreaterThanOrEqual(100);
        });

        test('GET /api/v1/wallet/history - Should get transaction history', async () => {
            const response = await request(app)
                .get('/api/v1/wallet/history')
                .set('Authorization', `Bearer ${authToken}`);

            expect(response.status).toBe(200);
            expect(Array.isArray(response.body)).toBe(true);
        });

        test('POST /api/v1/wallet/top-up - Should add money to wallet', async () => {
            const response = await request(app)
                .post('/api/v1/wallet/top-up')
                .set('Authorization', `Bearer ${authToken}`)
                .send({ amount: 50 });

            expect(response.status).toBe(200);
            expect(response.body).toHaveProperty('message');
        });
    });

    describe('Reservation Flow', () => {
        test('GET /api/v1/meals/reservations - Should get user reservations', async () => {
            const response = await request(app)
                .get('/api/v1/meals/reservations')
                .set('Authorization', `Bearer ${authToken}`);

            expect(response.status).toBe(200);
            expect(Array.isArray(response.body)).toBe(true);
        });

        test('POST /api/v1/meals/reservations - Should create a reservation', async () => {
            if (!testMenuId) {
                console.log('Skipping: No menu available for reservation test');
                return;
            }

            const response = await request(app)
                .post('/api/v1/meals/reservations')
                .set('Authorization', `Bearer ${authToken}`)
                .send({ menuId: testMenuId });

            // 201 Created or 200 OK
            expect([201, 200]).toContain(response.status);

            if (response.status === 201 || response.status === 200) {
                testReservationId = response.body.id || response.body.reservation?.id;
            }
        });

        test('DELETE /api/v1/meals/reservations/:id - Should cancel a reservation', async () => {
            if (!testReservationId) {
                console.log('Skipping: No reservation to cancel');
                return;
            }

            const response = await request(app)
                .delete(`/api/v1/meals/reservations/${testReservationId}`)
                .set('Authorization', `Bearer ${authToken}`);

            expect(response.status).toBe(200);
        });
    });

    describe('Saved Cards Endpoints', () => {
        test('GET /api/v1/wallet/cards - Should get saved cards', async () => {
            const response = await request(app)
                .get('/api/v1/wallet/cards')
                .set('Authorization', `Bearer ${authToken}`);

            expect(response.status).toBe(200);
            expect(Array.isArray(response.body)).toBe(true);
        });

        test('POST /api/v1/wallet/cards - Should save a new card', async () => {
            const cardData = {
                cardHolder: 'Test User',
                cardNumber: '4111111111111111',
                expiryMonth: '12',
                expiryYear: '26',
                setAsDefault: true
            };

            const response = await request(app)
                .post('/api/v1/wallet/cards')
                .set('Authorization', `Bearer ${authToken}`)
                .send(cardData);

            expect(response.status).toBe(201);
        });
    });

    describe('Meal Service Error Handling', () => {
        test('Should reject unauthorized access to wallet', async () => {
            const response = await request(app).get('/api/v1/wallet');
            expect(response.status).toBe(401);
        });

        test('Should reject unauthorized access to menus', async () => {
            const response = await request(app).get('/api/v1/meals/menus');
            expect(response.status).toBe(401);
        });

        test('Should reject invalid topup amount', async () => {
            const response = await request(app)
                .post('/api/v1/wallet/top-up')
                .set('Authorization', `Bearer ${authToken}`)
                .send({ amount: -50 });

            expect(response.status).toBe(400);
        });
    });
});
