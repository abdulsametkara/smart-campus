process.env.NODE_ENV = 'test';

const request = require('supertest');
const app = require('../src/app');
const db = require('../models');
const { SessionToken } = require('../models');

// Mock email service
jest.mock('../src/utils/email', () => ({
  sendVerificationEmail: jest.fn().mockResolvedValue(true),
  sendPasswordResetEmail: jest.fn().mockResolvedValue(true),
}));

describe('Auth endpoints', () => {
  beforeAll(async () => {
    await db.sequelize.sync({ force: true });
  });

  afterAll(async () => {
    await db.sequelize.close();
  });

  // Helper to ensure unique timestamps for tokens
  const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

  // 1. Register Success
  it('should register a new user', async () => {
    const res = await request(app).post('/api/v1/auth/register').send({
      email: 'test@example.com',
      password: 'Password1',
      role: 'student',
    });
    expect(res.status).toBe(201);
    expect(res.body.email).toBe('test@example.com');
  });

  // 2. Register Duplicate Fail
  it('should not register with duplicate email', async () => {
    const res = await request(app).post('/api/v1/auth/register').send({
      email: 'test@example.com',
      password: 'Password1',
      role: 'student',
    });
    expect(res.status).toBe(409);
  });

  // 3. Verify Email (Simulated for flow)
  it('should manually verify email for login test', async () => {
    await db.User.update(
      { is_email_verified: true },
      { where: { email: 'test@example.com' } }
    );
  });

  // 4. Login Success
  it('should login successfully', async () => {
    await delay(1000); // Ensure meaningful time difference
    const res = await request(app).post('/api/v1/auth/login').send({
      email: 'test@example.com',
      password: 'Password1',
    });
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('accessToken');
    expect(res.body).toHaveProperty('refreshToken');
  });

  // 5. Refresh Token Success (Self-contained)
  it('should refresh token successfully', async () => {
    await delay(1000); // Ensure new token is unique
    // Login first to get a fresh valid token
    const loginRes = await request(app).post('/api/v1/auth/login').send({
      email: 'test@example.com',
      password: 'Password1',
    });
    const refreshToken = loginRes.body.refreshToken;

    // Now try to refresh
    const res = await request(app).post('/api/v1/auth/refresh').send({
      refreshToken,
    });
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('accessToken');
  });

  // 6. Refresh Token Fail
  it('should fail with invalid refresh token', async () => {
    const res = await request(app).post('/api/v1/auth/refresh').send({
      refreshToken: 'inva.lid.token',
    });
    expect(res.status).toBe(401);
  });

  // 7. Logout Success (Self-contained)
  it('should logout successfully', async () => {
    await delay(1000);
    // Login first
    const loginRes = await request(app).post('/api/v1/auth/login').send({
      email: 'test@example.com',
      password: 'Password1',
    });
    const refreshToken = loginRes.body.refreshToken;

    // Logout
    const res = await request(app).post('/api/v1/auth/logout').send({
      refreshToken: refreshToken,
    });
    expect(res.status).toBe(204);

    // Verify token is revoked
    const session = await SessionToken.findOne({ where: { token: refreshToken } });
    expect(session.revoked_at).not.toBeNull();
  });

  // 8. Register Validation Fail (Invalid Email)
  it('should fail registration with invalid email format', async () => {
    const res = await request(app).post('/api/v1/auth/register').send({
      email: 'not-an-email',
      password: 'Password1',
      role: 'student',
    });
    expect(res.status).toBe(400); // 400 Bad Request
  });

  // 9. Register Validation Fail (Short Password)
  it('should fail registration with short password', async () => {
    const res = await request(app).post('/api/v1/auth/register').send({
      email: 'valid@email.com',
      password: 'short',
      role: 'student',
    });
    // Assuming API returns 400 for validation error
    expect(res.status).toBe(400);
  });

  // 10. Login Fail (Wrong Password)
  it('should fail login with wrong password', async () => {
    const res = await request(app).post('/api/v1/auth/login').send({
      email: 'test@example.com',
      password: 'WrongPassword1', // Must satisfy validation (1 digit, 1 UPPER)
    });
    expect(res.status).toBe(401); // 401 Unauthorized
  });

  // 11. Login Fail (Non-existent User)
  it('should fail login for non-existent user', async () => {
    const res = await request(app).post('/api/v1/auth/login').send({
      email: 'nobody@example.com',
      password: 'Password1',
    });
    expect(res.status).toBe(401); // Or 404 depending on implementation, usually 401 for security
  });
});
