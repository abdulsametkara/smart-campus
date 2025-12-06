const nodemailer = require('nodemailer');

const createTransporter = () => {
  return nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: Number(process.env.EMAIL_PORT) || 587,
    secure: false,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });
};

const sendVerificationEmail = async (user, token) => {
  const transporter = createTransporter();

  // Link Frontend URL'ine gitmeli: http://localhost:3000/verify-email/:token
  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
  const verifyUrl = `${frontendUrl}/verify-email/${token}`;

  await transporter.sendMail({
    from: process.env.EMAIL_USER,
    to: user.email,
    subject: 'Verify your email',
    text: `Please verify your email by visiting: ${verifyUrl}`,
  });
};

const sendPasswordResetEmail = async (user, token) => {
  const transporter = createTransporter();

  // Link Frontend URL'ine gitmeli: http://localhost:3000/reset-password/:token
  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
  const resetUrl = `${frontendUrl}/reset-password/${token}`;

  await transporter.sendMail({
    from: process.env.EMAIL_USER,
    to: user.email,
    subject: 'Reset your password',
    text: `You can reset your password by visiting: ${resetUrl}`,
  });
};

module.exports = {
  sendVerificationEmail,
  sendPasswordResetEmail,
};
