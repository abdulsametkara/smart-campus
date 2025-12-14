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

// Notification template (no button needed)
const getNotificationTemplate = (title, bodyContent, statusColor) => {
    return `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f3f4f6; margin: 0; padding: 0; }
        .container { max-width: 600px; margin: 40px auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
        .header { background: ${statusColor}; padding: 30px; text-align: center; }
        .header h1 { color: white; margin: 0; font-size: 28px; font-weight: 700; letter-spacing: -1px; }
        .header span { font-size: 32px; vertical-align: middle; margin-right: 10px; }
        .content { padding: 40px 30px; color: #374151; line-height: 1.6; font-size: 16px; }
        .info-box { background: #f9fafb; border-left: 4px solid ${statusColor}; padding: 15px; border-radius: 0 8px 8px 0; margin: 20px 0; }
        .footer { background: #f9fafb; padding: 20px; text-align: center; font-size: 12px; color: #9ca3af; border-top: 1px solid #e5e7eb; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1><span>🎓</span>Campy</h1>
        </div>
        <div class="content">
          <h2 style="margin-top:0; color: #111827;">${title}</h2>
          ${bodyContent}
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

// Send excuse approved notification
const sendExcuseApprovedEmail = async (student, excuse, courseName) => {
    try {
        const transporter = createTransporter();

        const bodyContent = `
            <p>Merhaba <strong>${student.full_name}</strong>,</p>
            <p>Aşağıdaki mazeret talebiniz <strong style="color: #22c55e;">onaylanmıştır</strong>:</p>
            <div class="info-box">
                <p><strong>Ders:</strong> ${courseName}</p>
                <p><strong>Mazeret:</strong> ${excuse.title}</p>
                <p><strong>Açıklama:</strong> ${excuse.description || '-'}</p>
            </div>
            <p style="color: #22c55e; font-weight: bold;">✅ Devamsızlık saatiniz iade edilmiştir.</p>
        `;

        const html = getNotificationTemplate('Mazeret Onaylandı ✅', bodyContent, '#22c55e');

        await transporter.sendMail({
            from: `"Campy OBS" <${process.env.EMAIL_USER}>`,
            to: student.email,
            subject: 'Campy - Mazeret Talebiniz Onaylandı ✅',
            text: `Mazeret talebiniz onaylandı: ${courseName}`,
            html: html
        });

        console.log(`Excuse approved email sent to ${student.email}`);
    } catch (error) {
        console.error('Error sending excuse approved email:', error);
    }
};

// Send excuse rejected notification
const sendExcuseRejectedEmail = async (student, excuse, courseName, rejectionReason) => {
    try {
        const transporter = createTransporter();

        const bodyContent = `
            <p>Merhaba <strong>${student.full_name}</strong>,</p>
            <p>Aşağıdaki mazeret talebiniz <strong style="color: #ef4444;">reddedilmiştir</strong>:</p>
            <div class="info-box">
                <p><strong>Ders:</strong> ${courseName}</p>
                <p><strong>Mazeret:</strong> ${excuse.title}</p>
                <p><strong>Ret Sebebi:</strong> ${rejectionReason || 'Belge yetersiz'}</p>
            </div>
            <p style="color: #666;">Sorularınız için ders hocanıza danışabilirsiniz.</p>
        `;

        const html = getNotificationTemplate('Mazeret Reddedildi ❌', bodyContent, '#ef4444');

        await transporter.sendMail({
            from: `"Campy OBS" <${process.env.EMAIL_USER}>`,
            to: student.email,
            subject: 'Campy - Mazeret Talebiniz Reddedildi',
            text: `Mazeret talebiniz reddedildi: ${courseName}`,
            html: html
        });

        console.log(`Excuse rejected email sent to ${student.email}`);
    } catch (error) {
        console.error('Error sending excuse rejected email:', error);
    }
};

// Send absence warning email
const sendAbsenceWarningEmail = async (student, courseName, usedHours, limitHours) => {
    try {
        const transporter = createTransporter();
        const remaining = limitHours - usedHours;

        const bodyContent = `
            <p>Merhaba <strong>${student.full_name}</strong>,</p>
            <p><strong>${courseName}</strong> dersinde devamsızlık limitinize yaklaşıyorsunuz!</p>
            <div class="info-box" style="text-align: center;">
                <p style="margin: 5px 0;"><strong>Kullanılan:</strong> ${usedHours} saat</p>
                <p style="margin: 5px 0;"><strong>Limit:</strong> ${limitHours} saat</p>
                <p style="margin: 5px 0; font-size: 1.5em; color: ${remaining <= 2 ? '#ef4444' : '#f59e0b'};">
                    <strong>Kalan Hak:</strong> ${remaining} saat
                </p>
            </div>
            <p style="color: #ef4444;">⚠️ Devamsızlık limitinizi aşmanız durumunda dersten kalabilirsiniz.</p>
        `;

        const html = getNotificationTemplate('Devamsızlık Uyarısı ⚠️', bodyContent, '#f59e0b');

        await transporter.sendMail({
            from: `"Campy OBS" <${process.env.EMAIL_USER}>`,
            to: student.email,
            subject: 'Campy - Devamsızlık Uyarısı ⚠️',
            text: `${courseName} dersinde kalan devamsızlık hakkınız: ${remaining} saat`,
            html: html
        });

        console.log(`Absence warning email sent to ${student.email}`);
    } catch (error) {
        console.error('Error sending absence warning email:', error);
    }
};

module.exports = {
    sendExcuseApprovedEmail,
    sendExcuseRejectedEmail,
    sendAbsenceWarningEmail
};
