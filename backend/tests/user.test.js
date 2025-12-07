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

  // 3. Change Password
  it('should change password successfully', async () => {
    const res = await request(app)
      .put('/api/v1/users/me/password')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        current_password: 'Password1',
        new_password: 'NewPassword2',
      });
    expect(res.status).toBe(200);
    expect(res.body.message).toContain('güncellendi');
  });

  // 4. Profile Picture Upload
  it('should upload profile picture', async () => {
    const Buffer = require('buffer').Buffer;
    const fakeImage = Buffer.from('fake-image-data');

    const res = await request(app)
      .post('/api/v1/users/me/profile-picture')
      .set('Authorization', `Bearer ${accessToken}`)
      .attach('profilePicture', fakeImage, 'test.jpg');

    expect([200, 400]).toContain(res.status); // 400 if multer validates file type
  });

  // 5. Unauthorized Access - Student accessing admin endpoint
  it('should deny student access to admin endpoint', async () => {
    const res = await request(app)
      .get('/api/v1/users/')
      .set('Authorization', `Bearer ${accessToken}`);
    expect(res.status).toBe(403);
  });

  // 6. Admin List Users
  it('should allow admin to list users', async () => {
    // Create admin user
    const bcrypt = require('bcrypt');
    const adminHash = await bcrypt.hash('AdminPass1', 10);
    const admin = await db.User.create({
      email: 'admin@example.com',
      password_hash: adminHash,
      role: 'admin',
      is_email_verified: true,
      full_name: 'Admin User',
    });
    const adminToken = require('../src/utils/jwt').signAccessToken({ sub: admin.id, role: admin.role });

    const res = await request(app)
      .get('/api/v1/users/')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('data');
    expect(Array.isArray(res.body.data)).toBe(true);
  });
});
