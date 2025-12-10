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

// Ortak HTML Şablonu
const getHtmlTemplate = (title, bodyContent, buttonText, buttonUrl) => {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f3f4f6; margin: 0; padding: 0; }
        .container { max-width: 600px; margin: 40px auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
        .header { background: #10b981; padding: 30px; text-align: center; }
        .header h1 { color: white; margin: 0; font-size: 28px; font-weight: 700; letter-spacing: -1px; }
        .header span { font-size: 32px; vertical-align: middle; margin-right: 10px; }
        .content { padding: 40px 30px; color: #374151; line-height: 1.6; font-size: 16px; }
        .btn { display: inline-block; background: #10b981; color: white; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-weight: 600; margin-top: 20px; transition: background 0.3s; }
        .btn:hover { background: #059669; }
        .footer { background: #f9fafb; padding: 20px; text-align: center; font-size: 12px; color: #9ca3af; border-top: 1px solid #e5e7eb; }
        .link-alt { display: block; margin-top: 20px; font-size: 12px; color: #6b7280; word-break: break-all; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1><span>🎓</span>Campy</h1>
        </div>
        <div class="content">
          <h2 style="margin-top:0; color: #111827;">${title}</h2>
          <p>${bodyContent}</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${buttonUrl}" class="btn">${buttonText}</a>
          </div>
          <p class="link-alt">Veya aşağıdaki linki tarayıcınıza yapıştırın:<br>${buttonUrl}</p>
        </div>
        <div class="footer">
          &copy; ${new Date().getFullYear()} Campy - Akıllı Kampüs Yönetim Sistemi.<br>
          Bu e-posta otomatik olarak gönderilmiştir.
        </div>
      </div>
    </body>
    </html>
  `;
};

const sendVerificationEmail = async (user, token) => {
  const transporter = createTransporter();
  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
  const verifyUrl = `${frontendUrl}/verify-email/${token}`;

  const html = getHtmlTemplate(
    'E-posta Adresini Doğrula',
    `Merhaba <strong>${user.full_name || 'Kullanıcı'}</strong>,<br><br>Campy'e hoş geldin! Hesabını güvenli bir şekilde kullanmaya başlamak için lütfen aşağıdaki butona tıklayarak e-posta adresini doğrula.`,
    'Hesabımı Doğrula',
    verifyUrl
  );

  await transporter.sendMail({
    from: `"Campy Staff" <${process.env.EMAIL_USER}>`,
    to: user.email,
    subject: 'Campy - E-posta Doğrulama',
    text: `Lütfen e-postanızı doğrulayın: ${verifyUrl}`,
    html: html
  });
};

const sendPasswordResetEmail = async (user, token) => {
  const transporter = createTransporter();
  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
  const resetUrl = `${frontendUrl}/reset-password/${token}`;

  const html = getHtmlTemplate(
    'Şifre Sıfırlama İsteği',
    `Merhaba <strong>${user.full_name || 'Kullanıcı'}</strong>,<br><br>Hesabınız için bir şifre sıfırlama talebi aldık. Eğer bu isteği siz yapmadıysanız, bu e-postayı görmezden gelebilirsiniz.<br>Şifrenizi yenilemek için tıklayın:`,
    'Şifremi Sıfırla',
    resetUrl
  );

  await transporter.sendMail({
    from: `"Campy Security" <${process.env.EMAIL_USER}>`,
    to: user.email,
    subject: 'Campy - Şifre Sıfırlama',
    text: `Şifrenizi sıfırlayın: ${resetUrl}`,
    html: html
  });
};

module.exports = {
  sendVerificationEmail,
  sendPasswordResetEmail,
};
