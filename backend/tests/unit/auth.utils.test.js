const { signAccessToken, signRefreshToken, verifyToken } = require('../../src/utils/jwt');
const { hashPassword, comparePassword } = require('../../src/utils/password');

describe('Auth Utility Unit Tests', () => {

    // Mock process.env for JWT secrets
    const originalEnv = process.env;

    beforeAll(() => {
        process.env = {
            ...originalEnv,
            JWT_ACCESS_TOKEN_SECRET: 'test-access-secret',
            JWT_REFRESH_TOKEN_SECRET: 'test-refresh-secret',
        };
    });

    afterAll(() => {
        process.env = originalEnv;
    });

    describe('JWT Generation', () => {
        it('should sign and verify access token', () => {
            const payload = { sub: 1, role: 'student' };
            const token = signAccessToken(payload);
            expect(typeof token).toBe('string');

            const decoded = verifyToken(token, 'access');
            expect(decoded.sub).toBe(1);
            expect(decoded.role).toBe('student');
        });

        it('should sign and verify refresh token', () => {
            const payload = { sub: 1, role: 'student' };
            const token = signRefreshToken(payload);
            expect(typeof token).toBe('string');

            const decoded = verifyToken(token, 'refresh');
            expect(decoded.sub).toBe(1);
            expect(decoded.role).toBe('student');
        });

        it('should fail verification with wrong secret', () => {
            const payload = { sub: 1 };
            // Sign with access secret
            const token = signAccessToken(payload);

            // Try verify with refresh secret (should fail signature check)
            expect(() => {
                verifyToken(token, 'refresh');
            }).toThrow();
        });
    });

    describe('Password Hashing', () => {
        it('should hash password and verify correctly', async () => {
            const plain = 'Password123!';
            const hash = await hashPassword(plain);

            expect(hash).not.toBe(plain);

            const isMatch = await comparePassword(plain, hash);
            expect(isMatch).toBe(true);
        });

        it('should return false for wrong password comparison', async () => {
            const plain = 'Password123!';
            const hash = await hashPassword(plain);

            const isMatch = await comparePassword('WrongPass', hash);
            expect(isMatch).toBe(false);
        });
    });
});
