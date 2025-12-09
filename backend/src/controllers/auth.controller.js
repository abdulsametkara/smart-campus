const crypto = require('crypto');
const { User, EmailVerification, PasswordReset, SessionToken } = require('../../models');
const { hashPassword, comparePassword } = require('../utils/password');
const { signAccessToken, signRefreshToken, verifyToken } = require('../utils/jwt');
const { sendVerificationEmail, sendPasswordResetEmail } = require('../utils/email');
const db = require('../../models');

const register = async (req, res) => {
  try {
    const { email, password, role, full_name, phone_number, department_id, student_number } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    if (password.length < 8 || !/[A-Z]/.test(password) || !/[0-9]/.test(password)) {
      return res.status(400).json({ message: 'Password is too weak' });
    }

    const existing = await User.findOne({ where: { email } });
    if (existing) {
      return res.status(409).json({ message: 'Email already in use' });
    }

    const passwordHash = await hashPassword(password);
    const roleToUse = role || 'student';

    const user = await User.create({
      email,
      password_hash: passwordHash,
      role: roleToUse,
      is_email_verified: false,
      full_name,
      phone_number,
    });

    // Eğer öğrenciyse ve student_number/department_id varsa Student tablosuna da ekle (Opsiyonel, Part 2 için olabilir ama şimdi eklemek iyidir)
    // Ancak şimdilik temel User bilgilerini kaydetmek yeterli.

    const token = crypto.randomUUID();
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    await EmailVerification.create({
      user_id: user.id,
      token,
      expires_at: expiresAt,
    });

    try {
      await sendVerificationEmail(user, token);
    } catch (emailErr) {
      console.error('Error sending verification email', emailErr);
    }

    return res.status(201).json({
      id: user.id,
      email: user.email,
      role: user.role,
    });
  } catch (err) {
    // Temporary log for debugging
    console.error('Register error', err);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    const user = await User.findOne({ where: { email } });
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    if (!user.is_email_verified) {
      return res.status(403).json({ message: 'Email not verified' });
    }

    const isValid = await comparePassword(password, user.password_hash);
    if (!isValid) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const payload = { sub: user.id, role: user.role };
    const accessToken = signAccessToken(payload);
    const refreshToken = signRefreshToken(payload);

    // Yeni oturumu session_tokens tablosuna kaydet
    const userAgent = req.headers['user-agent'] || null;
    const ipAddress = req.ip || req.connection?.remoteAddress || null;
    const refreshPayload = verifyToken(refreshToken, 'refresh');
    const refreshExpSeconds = refreshPayload.exp * 1000; // Unix seconds -> ms

    await SessionToken.create({
      user_id: user.id,
      token: refreshToken,
      user_agent: userAgent,
      ip_address: ipAddress,
      expires_at: new Date(refreshExpSeconds),
    });

    return res.json({
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        full_name: user.full_name,
        profile_picture_url: user.profile_picture_url,
      },
    });
  } catch (err) {
    console.error('Login error', err);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

const refresh = async (req, res) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) {
      return res.status(400).json({ message: 'Refresh token is required' });
    }

    // Önce JWT imzasını doğrula
    const payload = verifyToken(refreshToken, 'refresh');

    // Daha sonra session_tokens tablosunda geçerli bir kayıt var mı kontrol et
    const session = await SessionToken.findOne({ where: { token: refreshToken } });

    if (!session) {
      return res.status(401).json({ message: 'Invalid session' });
    }

    if (session.revoked_at) {
      return res.status(401).json({ message: 'Session revoked' });
    }

    if (session.expires_at < new Date()) {
      return res.status(401).json({ message: 'Session expired' });
    }

    const accessToken = signAccessToken({ sub: payload.sub, role: payload.role });

    return res.json({ accessToken });
  } catch (err) {
    console.error('Refresh token error', err);
    return res.status(401).json({ message: 'Invalid or expired refresh token' });
  }
};

const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: 'Email is required' });
    }

    const user = await User.findOne({ where: { email } });

    if (!user) {
      // Güvenlik için her durumda aynı cevabı döndür
      return res.json({ message: 'If that email exists, a reset link has been sent' });
    }

    const token = crypto.randomUUID();
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 saat

    await PasswordReset.create({
      user_id: user.id,
      token,
      expires_at: expiresAt,
    });

    try {
      await sendPasswordResetEmail(user, token);
    } catch (emailErr) {
      console.error('Error sending password reset email', emailErr);
    }

    return res.json({ message: 'If that email exists, a reset link has been sent' });
  } catch (err) {
    console.error('Forgot password error', err);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

const resetPassword = async (req, res) => {
  try {
    const { token, password } = req.body;

    if (!token || !password) {
      return res.status(400).json({ message: 'Token and new password are required' });
    }

    if (password.length < 8 || !/[A-Z]/.test(password) || !/[0-9]/.test(password)) {
      return res.status(400).json({ message: 'Password is too weak' });
    }

    const record = await PasswordReset.findOne({ where: { token } });

    if (!record) {
      return res.status(400).json({ message: 'Invalid token' });
    }

    if (record.used_at) {
      return res.status(400).json({ message: 'Token already used' });
    }

    if (record.expires_at < new Date()) {
      return res.status(400).json({ message: 'Token expired' });
    }

    const user = await User.findByPk(record.user_id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const passwordHash = await hashPassword(password);
    user.password_hash = passwordHash;
    await user.save();

    // Tüm aktif oturumları iptal et
    await SessionToken.update(
      { revoked_at: new Date() },
      { where: { user_id: user.id, revoked_at: null } },
    );

    record.used_at = new Date();
    await record.save();

    return res.json({ message: 'Password has been reset successfully' });
  } catch (err) {
    console.error('Reset password error', err);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

const logout = async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json({ message: 'Refresh token is required' });
    }

    const session = await SessionToken.findOne({ where: { token: refreshToken } });

    if (session && !session.revoked_at) {
      session.revoked_at = new Date();
      await session.save();
    }

    return res.status(204).send();
  } catch (err) {
    console.error('Logout error', err);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

module.exports = {
  register,
  login,
  refresh,
  // will be wired to POST /api/v1/auth/verify-email
  verifyEmail: async (req, res) => {
    try {
      const { token } = req.body;

      if (!token) {
        return res.status(400).json({ message: 'Token is required' });
      }

      const record = await EmailVerification.findOne({ where: { token } });

      if (!record) {
        return res.status(400).json({ message: 'Invalid token' });
      }

      if (record.used_at) {
        return res.status(400).json({ message: 'Token already used' });
      }

      if (record.expires_at < new Date()) {
        return res.status(400).json({ message: 'Token expired' });
      }

      const user = await User.findByPk(record.user_id);
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }

      user.is_email_verified = true;
      await user.save();

      record.used_at = new Date();
      await record.save();

      return res.json({ message: 'Email verified successfully' });
    } catch (err) {
      console.error('Verify email error', err);
      return res.status(500).json({ message: 'Internal server error' });
    }
  },
  forgotPassword,
  resetPassword,
  logout,
  resendVerification: async (req, res) => {
    try {
      const { email } = req.body;

      if (!email) {
        return res.status(400).json({ message: 'Email is required' });
      }

      const user = await User.findOne({ where: { email } });

      if (!user) {
        // Güvenlik için aynı mesajı döndür
        return res.json({ message: 'Doğrulama maili gönderildi' });
      }

      if (user.is_email_verified) {
        return res.status(400).json({ message: 'Email zaten doğrulanmış' });
      }

      // Yeni token oluştur
      const crypto = require('crypto');
      const token = crypto.randomUUID();
      const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

      await EmailVerification.create({
        user_id: user.id,
        token,
        expires_at: expiresAt,
      });

      try {
        await sendVerificationEmail(user, token);
      } catch (emailErr) {
        console.error('Error sending verification email', emailErr);
      }

      return res.json({ message: 'Doğrulama maili gönderildi' });
    } catch (err) {
      console.error('Resend verification error', err);
      return res.status(500).json({ message: 'Internal server error' });
    }
  },
};
