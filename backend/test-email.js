const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 587,
    secure: false, // true for 465, false for other ports
    auth: {
        user: 'abdulsamedkara7@gmail.com',
        pass: 'mhwojrposeprpoqz'
    }
});

async function verify() {
    try {
        console.log('Bağlantı test ediliyor...');
        await transporter.verify();
        console.log('✅ BAŞARILI: Giriş bilgileri doğru! Mail sunucusuna bağlanıldı.');

        // Opsiyonel: Kendine mail at
        console.log('✉️  Test maili gönderiliyor...');
        await transporter.sendMail({
            from: '"Smart Campus Test" <abdulsamedkara7@gmail.com>',
            to: 'abdulsamedkara7@gmail.com',
            subject: 'Smart Campus Test Maili',
            text: 'Eğer bu maili görüyorsan sistem çalışıyor demektir! 🎉'
        });
        console.log('✅ BAŞARILI: Test maili gönderildi!');

    } catch (error) {
        console.error('❌ HATA: Bağlantı başarısız!');
        console.error(error);
    }
}

verify();
