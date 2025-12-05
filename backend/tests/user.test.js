process.env.NODE_ENV = 'test';

const request = require('supertest');
const app = require('../src/app');
const db = require('../models');
const { signAccessToken } = require('../src/utils/jwt');

describe('User endpoints', () => {
  let accessToken;

  beforeAll(async () => {
    await db.sequelize.sync({ force: true });
    const bcrypt = require('bcrypt');
    const passwordHash = await bcrypt.hash('Password1', 10);
    const user = await db.User.create({
      email: 'me@example.com',
      password_hash: passwordHash,
      role: 'student',
      is_email_verified: true,
      full_name: 'Me Example',
    });
    accessToken = signAccessToken({ sub: user.id, role: user.role });
  });

  afterAll(async () => {
    await db.sequelize.close();
  });

  it('getMe returns profile', async () => {
    const res = await request(app)
      .get('/api/v1/users/me')
      .set('Authorization', `Bearer ${accessToken}`);
    expect(res.status).toBe(200);
    expect(res.body.email).toBe('me@example.com');
  });

  it('updateMe updates full_name', async () => {
    const res = await request(app)
      .put('/api/v1/users/me')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ full_name: 'Updated Name' });
    expect(res.status).toBe(200);
    expect(res.body.full_name).toBe('Updated Name');
  });
});
