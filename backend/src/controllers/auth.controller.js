const crypto = require('crypto');
const speakeasy = require('speakeasy');
const QRCode = require('qrcode');
const { User, EmailVerification, PasswordReset, SessionToken, ActivityLog } = require('../../models');
const { hashPassword, comparePassword } = require('../utils/password');
const { signAccessToken, signRefreshToken, verifyToken } = require('../utils/jwt');
const { sendVerificationEmail, sendPasswordResetEmail } = require('../utils/email');
const db = require('../../models');

const register = async (req, res) => {
  try {
    const { email, password, role, full_name, phone_number, student_number, department_id } = req.body;

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

    // Check if student_number is unique (for student role)
    const roleToUse = role || 'student';
    if (roleToUse === 'student' && student_number) {
      const existingStudentNo = await User.findOne({ where: { student_number } });
      if (existingStudentNo) {
        return res.status(409).json({ message: 'Bu öğrenci numarası zaten kullanılmakta' });
      }
      // Also check in students table
      const { Student } = db;
      const existingInStudents = await Student.findOne({ where: { student_number } });
      if (existingInStudents) {
        return res.status(409).json({ message: 'Bu öğrenci numarası zaten kayıtlı' });
      }
    }

    const passwordHash = await hashPassword(password);

    const user = await User.create({
      email,
      password_hash: passwordHash,
      role: roleToUse,
      is_email_verified: false,
      full_name,
      phone_number,
      student_number: roleToUse === 'student' ? student_number : null,
    });

    // Auto-create Student profile if role is student
    if (roleToUse === 'student' && department_id) {
      const { Student, Faculty } = db;

      // Find an advisor from the same department
      const advisor = await Faculty.findOne({
        where: { department_id },
        order: db.sequelize.random()
      });

      await Student.create({
        user_id: user.id,
        student_number: student_number || `AUTO${Date.now()}`,
        department_id: parseInt(department_id),
        advisor_id: advisor?.id || null
      });
    }

    await ActivityLog.create({
      user_id: user.id,
      action: 'REGISTER',
      ip_address: req.ip || req.connection?.remoteAddress,
      user_agent: req.headers['user-agent'],
    }).catch(err => console.error('Log error', err));

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

    return res.status(201).json({
      id: user.id,
      email: user.email,
      role: user.role,
    });
  } catch (err) {
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
      return res.status(401).json({ message: 'Giriş başarısız' });
    }

    if (user.account_locked_until && user.account_locked_until > new Date()) {
      const diff = Math.ceil((new Date(user.account_locked_until) - new Date()) / 1000 / 60);
      return res.status(403).json({ message: `Hesap kilitli. Lütfen ${diff} dakika sonra tekrar deneyin.` });
    }

    const isValid = await comparePassword(password, user.password_hash);
    if (!isValid) {
      user.failed_login_attempts = (user.failed_login_attempts || 0) + 1;

      if (user.failed_login_attempts >= 5) {
        user.account_locked_until = new Date(Date.now() + 15 * 60 * 1000);
        user.failed_login_attempts = 0;
        await user.save();
        return res.status(403).json({ message: 'Çok fazla hatalı giriş. Hesap 15 dakika kilitlendi.' });
      }

      await user.save();
      return res.status(401).json({ message: 'Giriş bilgileri hatalı.' });
    }

    if (!user.is_email_verified) {
      return res.status(403).json({ message: 'Email not verified' });
    }

    // 2FA KONTROLÜ
    if (user.is_2fa_enabled) {
      // Geçici bir "2FA Bekleyen Token" oluşturabiliriz veya sadece "2FA Required" diyebiliriz.
      // Güvenlik için, bu aşamada JWT vermiyoruz. Sadece "user_id" ve "temp_code" dönüyoruz.
      // Ama en temiz yöntem: Kısa ömürlü (2-5 dk) bir "Pre-Auth Token" vermek.
      // JWT'nin rolü 'pre-auth' olsun.
      const preAuthToken = signAccessToken({ sub: user.id, role: 'pre-auth-2fa' }, '5m');

      return res.json({
        is2FARequired: true,
        tempToken: preAuthToken,
        message: '2FA code required'
      });
    }

    // Başarılı giriş: Sayaçları sıfırla
    user.failed_login_attempts = 0;
    user.account_locked_until = null;
    await user.save();

    await ActivityLog.create({
      user_id: user.id,
      action: 'LOGIN',
      ip_address: req.ip || req.connection?.remoteAddress,
      user_agent: req.headers['user-agent'],
    }).catch(err => console.error('Log error', err));

    return generateTokensAndResponse(user, req, res);

  } catch (err) {
    console.error('Login error', err);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

const generateTokensAndResponse = async (user, req, res) => {
  const payload = { sub: user.id, role: user.role };
  const accessToken = signAccessToken(payload);
  const refreshToken = signRefreshToken(payload);

  const userAgent = req.headers['user-agent'] || null;
  const ipAddress = req.ip || req.connection?.remoteAddress || null;
  const refreshPayload = verifyToken(refreshToken, 'refresh');
  const refreshExpSeconds = refreshPayload.exp * 1000;

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
};

const verify2FALogin = async (req, res) => {
  try {
    const { tempToken, code } = req.body;

    if (!tempToken || !code) {
      return res.status(400).json({ message: 'Token and code required' });
    }

    // Temp Token'ı doğrula
    let decoded;
    try {
      decoded = verifyToken(tempToken); // Access token gibi doğrula
    } catch (e) {
      return res.status(401).json({ message: 'Invalid session (pre-auth)' });
    }

    if (decoded.role !== 'pre-auth-2fa') {
      return res.status(401).json({ message: 'Invalid token type' });
    }

    const user = await User.findByPk(decoded.sub);
    if (!user) return res.status(404).json({ message: 'User not found' });

    // 2FA Kodunu Doğrula
    const verified = speakeasy.totp.verify({
      secret: user.two_factor_secret,
      encoding: 'base32',
      token: code,
    });

    if (!verified) {
      return res.status(400).json({ message: 'Invalid 2FA code' });
    }

    // Başarılı ise asıl tokenları ver
    user.failed_login_attempts = 0;
    user.account_locked_until = null;
    await user.save();

    await ActivityLog.create({
      user_id: user.id,
      action: 'LOGIN_2FA',
      ip_address: req.ip || req.connection?.remoteAddress,
      user_agent: req.headers['user-agent'],
    }).catch(err => console.error('Log error', err));

    return generateTokensAndResponse(user, req, res);

  } catch (error) {
    console.error('2FA Login Error', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

const setup2FA = async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id);

    // Secret oluştur
    const secret = speakeasy.generateSecret({
      name: `SmartCampus (${user.email})`
    });

    // Geçici olarak secret'ı kullanıcıya kaydetmeyelim, sadece frontend'e dönelim desek? 
    // Hayır, kaydetmemiz lazım ki verify edebilelim. Ancak henüz 'enable' etmiyoruz.
    user.two_factor_secret = secret.base32;
    await user.save();

    // QR Kod Oluştur
    const qrCodeDataURL = await QRCode.toDataURL(secret.otpauth_url);

    return res.json({
      secret: secret.base32, // Manuel giriş için
      qrCode: qrCodeDataURL  // Taratmak için
    });

  } catch (error) {
    console.error('Setup 2FA error', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

const verify2FASetup = async (req, res) => {
  try {
    const { code } = req.body;
    const user = await User.findByPk(req.user.id);

    const verified = speakeasy.totp.verify({
      secret: user.two_factor_secret,
      encoding: 'base32',
      token: code
    });

    if (verified) {
      user.is_2fa_enabled = true;
      await user.save();

      await ActivityLog.create({
        user_id: user.id,
        action: 'ENABLE_2FA',
        ip_address: req.ip,
        user_agent: req.headers['user-agent'],
      });

      return res.json({ message: '2FA enabled successfully' });
    } else {
      return res.status(400).json({ message: 'Invalid code' });
    }
  } catch (error) {
    console.error('Verify 2FA error', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
}

const disable2FA = async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id);
    user.is_2fa_enabled = false;
    user.two_factor_secret = null;
    await user.save();

    await ActivityLog.create({
      user_id: user.id,
      action: 'DISABLE_2FA',
      ip_address: req.ip,
      user_agent: req.headers['user-agent'],
    });

    return res.json({ message: '2FA disabled' });
  } catch (error) {
    return res.status(500).json({ message: 'Error disabling 2FA' });
  }
};

const refresh = async (req, res) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) {
      return res.status(400).json({ message: 'Refresh token is required' });
    }

    const payload = verifyToken(refreshToken, 'refresh');
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
    if (!email) return res.status(400).json({ message: 'Email is required' });

    const user = await User.findOne({ where: { email } });
    if (!user) return res.json({ message: 'If that email exists, a reset link has been sent' });

    const token = crypto.randomUUID();
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

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
    if (!token || !password) return res.status(400).json({ message: 'Token and new password are required' });

    if (password.length < 8 || !/[A-Z]/.test(password) || !/[0-9]/.test(password)) {
      return res.status(400).json({ message: 'Password is too weak' });
    }

    const record = await PasswordReset.findOne({ where: { token } });
    if (!record) return res.status(400).json({ message: 'Invalid token' });
    if (record.used_at) return res.status(400).json({ message: 'Token already used' });
    if (record.expires_at < new Date()) return res.status(400).json({ message: 'Token expired' });

    const user = await User.findByPk(record.user_id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    const passwordHash = await hashPassword(password);
    user.password_hash = passwordHash;
    await user.save();

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
    if (!refreshToken) return res.status(400).json({ message: 'Refresh token is required' });

    const session = await SessionToken.findOne({ where: { token: refreshToken } });
    if (session && !session.revoked_at) {
      session.revoked_at = new Date();
      await session.save();

      if (session.user_id) {
        await ActivityLog.create({
          user_id: session.user_id,
          action: 'LOGOUT',
          ip_address: req.ip || req.connection?.remoteAddress,
          user_agent: req.headers['user-agent'],
        }).catch(err => console.error('Log error', err));
      }
    }
    return res.status(204).send();
  } catch (err) {
    console.error('Logout error', err);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

const verifyEmail = async (req, res) => {
  try {
    const { token } = req.body;
    if (!token) return res.status(400).json({ message: 'Token is required' });

    const record = await EmailVerification.findOne({ where: { token } });
    if (!record) return res.status(400).json({ message: 'Invalid token' });
    if (record.used_at) return res.status(400).json({ message: 'Token already used' });
    if (record.expires_at < new Date()) return res.status(400).json({ message: 'Token expired' });

    const user = await User.findByPk(record.user_id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    user.is_email_verified = true;
    await user.save();

    record.used_at = new Date();
    await record.save();

    return res.json({ message: 'Email verified successfully' });
  } catch (err) {
    console.error('Verify email error', err);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

const resendVerification = async (req, res) => {
  // ... (eski kodun aynısı)
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ message: 'Email is required' });
    const user = await User.findOne({ where: { email } });
    if (!user) return res.json({ message: 'Doğrulama maili gönderildi' });
    if (user.is_email_verified) return res.status(400).json({ message: 'Email zaten doğrulanmış' });

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
    return res.status(500).json({ message: 'Internal server error' });
  }
};

module.exports = {
  register,
  login,
  refresh,
  verifyEmail,
  forgotPassword,
  resetPassword,
  logout,
  resendVerification,
  setup2FA,
  verify2FASetup,
  verify2FALogin,
  disable2FA
};
