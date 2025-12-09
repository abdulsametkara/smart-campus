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
  let refreshToken;

  beforeAll(async () => {
    await db.sequelize.sync({ force: true });
  });

  afterAll(async () => {
    await db.sequelize.close();
  });

  afterEach(async () => {
    // Session token çakışmalarını önlemek için her testten sonra temizle
    await SessionToken.destroy({ where: {}, truncate: true });
  });

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
    const res = await request(app).post('/api/v1/auth/login').send({
      email: 'test@example.com',
      password: 'Password1',
    });
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('accessToken');
    expect(res.body).toHaveProperty('refreshToken');
    refreshToken = res.body.refreshToken;
  });


  // 5. Login Fail - Wrong Password
  it('should fail login with wrong password', async () => {
    const res = await request(app).post('/api/v1/auth/login').send({
      email: 'test@example.com',
      password: 'WrongPassword1',
    });
    expect(res.status).toBe(401);
  });

  // 6. Login Fail - Non-existent User
  it('should fail login for non-existent user', async () => {
    const res = await request(app).post('/api/v1/auth/login').send({
      email: 'nobody@example.com',
      password: 'Password1',
    });
    expect(res.status).toBe(401);
  });

  // 7. Refresh Token Success
  it('should refresh token successfully', async () => {
    const res = await request(app).post('/api/v1/auth/refresh').send({
      refreshToken,
    });
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('accessToken');
  });

  // 8. Refresh Token Fail - Invalid
  it('should fail refresh with invalid token', async () => {
    const res = await request(app).post('/api/v1/auth/refresh').send({
      refreshToken: 'invalid.token.here',
    });
    expect(res.status).toBe(401);
  });

  // 9. Forgot Password
  it('should send forgot password link', async () => {
    const res = await request(app).post('/api/v1/auth/forgot-password').send({
      email: 'test@example.com',
    });
    expect(res.status).toBe(200);
  });

  // 10. Verify Email Endpoint
  it('should verify email with valid token', async () => {
    const crypto = require('crypto');
    const verifyToken = crypto.randomUUID();
    const user = await db.User.findOne({ where: { email: 'test@example.com' } });
    await user.update({ is_email_verified: false });

    await db.EmailVerification.create({
      user_id: user.id,
      token: verifyToken,
      expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000),
    });

    const res = await request(app).post('/api/v1/auth/verify-email').send({
      token: verifyToken,
    });
    expect(res.status).toBe(200);
    expect(res.body.message).toContain('verified');
  });

  // 11. Reset Password
  it('should reset password with valid token', async () => {
    const crypto = require('crypto');
    const resetToken = crypto.randomUUID();
    const user = await db.User.findOne({ where: { email: 'test@example.com' } });

    await db.PasswordReset.create({
      user_id: user.id,
      token: resetToken,
      expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000),
    });

    const res = await request(app).post('/api/v1/auth/reset-password').send({
      token: resetToken,
      password: 'NewPassword1',
    });
    expect(res.status).toBe(200);
    expect(res.body.message).toContain('reset');
  });

  // 12. Resend Verification
  it('should resend verification email', async () => {
    const user = await db.User.findOne({ where: { email: 'test@example.com' } });
    await user.update({ is_email_verified: false });

    const res = await request(app).post('/api/v1/auth/resend-verification').send({
      email: 'test@example.com',
    });
    expect(res.status).toBe(200);
  });

  // 13. Logout Success
  it('should logout successfully', async () => {
    const user = await db.User.findOne({ where: { email: 'test@example.com' } });
    await user.update({ is_email_verified: true });

    const loginRes = await request(app).post('/api/v1/auth/login').send({
      email: 'test@example.com',
      password: 'NewPassword1',
    });
    const newRefreshToken = loginRes.body.refreshToken;

    const res = await request(app).post('/api/v1/auth/logout').send({
      refreshToken: newRefreshToken,
    });
    expect(res.status).toBe(204);

    const session = await SessionToken.findOne({ where: { token: newRefreshToken } });
    expect(session.revoked_at).not.toBeNull();
  });
});
