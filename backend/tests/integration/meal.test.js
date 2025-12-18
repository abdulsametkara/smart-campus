/**
 * Meal Reservation Flow Integration Tests
 * Tests for Developer 1 Part 3: Meal Service & Wallet
 */

const request = require('supertest');

// Get the base URL from environment or use default
const BASE_URL = process.env.API_URL || 'http://localhost:5000';

describe('Meal Service Integration Tests', () => {
    let authToken;
    let testMenuId;
    let testReservationId;

    // Test user credentials
    const testUser = {
        email: 'student1@example.com',
        password: 'Password1'
    };

    // Login before tests
    beforeAll(async () => {
        const response = await request(BASE_URL)
            .post('/api/v1/auth/login')
            .send(testUser);

        expect(response.status).toBe(200);
        authToken = response.body.token;
    });

    describe('Menu Endpoints', () => {
        test('GET /api/v1/meals/menu - Should get weekly menus', async () => {
            const response = await request(BASE_URL)
                .get('/api/v1/meals/menu')
                .set('Authorization', `Bearer ${authToken}`);

            expect(response.status).toBe(200);
            expect(Array.isArray(response.body)).toBe(true);

            // Store a menu ID for reservation test
            if (response.body.length > 0) {
                testMenuId = response.body[0].id;
            }
        });

        test('GET /api/v1/meals/cafeterias - Should get cafeteria list', async () => {
            const response = await request(BASE_URL)
                .get('/api/v1/meals/cafeterias')
                .set('Authorization', `Bearer ${authToken}`);

            expect(response.status).toBe(200);
            expect(Array.isArray(response.body)).toBe(true);
        });
    });

    describe('Wallet Endpoints', () => {
        test('GET /api/v1/wallet - Should get user wallet', async () => {
            const response = await request(BASE_URL)
                .get('/api/v1/wallet')
                .set('Authorization', `Bearer ${authToken}`);

            expect(response.status).toBe(200);
            expect(response.body).toHaveProperty('balance');
            expect(typeof response.body.balance).toBe('string'); // Decimal comes as string
        });

        test('GET /api/v1/wallet/history - Should get transaction history', async () => {
            const response = await request(BASE_URL)
                .get('/api/v1/wallet/history')
                .set('Authorization', `Bearer ${authToken}`);

            expect(response.status).toBe(200);
            expect(Array.isArray(response.body)).toBe(true);
        });

        test('POST /api/v1/wallet/topup - Should add money to wallet', async () => {
            const response = await request(BASE_URL)
                .post('/api/v1/wallet/topup')
                .set('Authorization', `Bearer ${authToken}`)
                .send({ amount: 50 });

            expect(response.status).toBe(200);
            expect(response.body).toHaveProperty('wallet');
            expect(response.body).toHaveProperty('message');
        });
    });

    describe('Reservation Flow', () => {
        test('GET /api/v1/meals/reservations - Should get user reservations', async () => {
            const response = await request(BASE_URL)
                .get('/api/v1/meals/reservations')
                .set('Authorization', `Bearer ${authToken}`);

            expect(response.status).toBe(200);
            expect(Array.isArray(response.body)).toBe(true);
        });

        test('POST /api/v1/meals/reservations - Should create a reservation', async () => {
            // Skip if no menu available
            if (!testMenuId) {
                console.log('Skipping: No menu available for reservation test');
                return;
            }

            const response = await request(BASE_URL)
                .post('/api/v1/meals/reservations')
                .set('Authorization', `Bearer ${authToken}`)
                .send({ menuId: testMenuId });

            // Could be 200 (success) or 400 (already reserved or insufficient balance)
            expect([200, 400]).toContain(response.status);

            if (response.status === 200) {
                expect(response.body).toHaveProperty('reservation');
                testReservationId = response.body.reservation.id;
            }
        });

        test('DELETE /api/v1/meals/reservations/:id - Should cancel a reservation', async () => {
            // Skip if no reservation was created
            if (!testReservationId) {
                console.log('Skipping: No reservation to cancel');
                return;
            }

            const response = await request(BASE_URL)
                .delete(`/api/v1/meals/reservations/${testReservationId}`)
                .set('Authorization', `Bearer ${authToken}`);

            expect([200, 400]).toContain(response.status);
        });
    });

    describe('Saved Cards Endpoints', () => {
        test('GET /api/v1/wallet/cards - Should get saved cards', async () => {
            const response = await request(BASE_URL)
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

            const response = await request(BASE_URL)
                .post('/api/v1/wallet/cards')
                .set('Authorization', `Bearer ${authToken}`)
                .send(cardData);

            expect(response.status).toBe(201);
            expect(response.body).toHaveProperty('card');
            expect(response.body.card).toHaveProperty('card_last_four', '1111');
        });
    });
});

describe('Meal Service Error Handling', () => {
    test('Should reject unauthorized access to wallet', async () => {
        const response = await request(BASE_URL)
            .get('/api/v1/wallet');

        expect(response.status).toBe(401);
    });

    test('Should reject unauthorized access to menus', async () => {
        const response = await request(BASE_URL)
            .get('/api/v1/meals/menu');

        expect(response.status).toBe(401);
    });

    test('Should reject invalid topup amount', async () => {
        // First login
        const loginRes = await request(BASE_URL)
            .post('/api/v1/auth/login')
            .send({
                email: 'student1@example.com',
                password: 'Password1'
            });

        const token = loginRes.body.token;

        const response = await request(BASE_URL)
            .post('/api/v1/wallet/topup')
            .set('Authorization', `Bearer ${token}`)
            .send({ amount: -50 });

        expect(response.status).toBe(400);
    });
});
