process.env.NODE_ENV = 'test';

const request = require('supertest');
const app = require('../src/app');
const db = require('../models');

describe('Auth endpoints', () => {
  let server;

  beforeAll(async () => {
    await db.sequelize.sync({ force: true });

    // create a simple user
    const bcrypt = require('bcrypt');
    const passwordHash = await bcrypt.hash('Password1', 10);
    await db.User.create({
      email: 'test@example.com',
      password_hash: passwordHash,
      role: 'student',
      is_email_verified: true,
    });
  });

  afterAll(async () => {
    await db.sequelize.close();
  });

  it('login success returns tokens', async () => {
    const res = await request(app).post('/api/v1/auth/login').send({
      email: 'test@example.com',
      password: 'Password1',
    });
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('accessToken');
    expect(res.body).toHaveProperty('refreshToken');
    expect(res.body).toHaveProperty('user');
  });

  it('refresh without token fails', async () => {
    const res = await request(app).post('/api/v1/auth/refresh').send({});
    expect(res.status).toBe(400);
  });

  it('logout without token fails', async () => {
    const res = await request(app).post('/api/v1/auth/logout').send({});
    expect(res.status).toBe(400);
  });
});
