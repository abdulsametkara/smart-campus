// Kullanıcı Durumunu Kontrol Etme
require('dotenv').config();
const { Sequelize } = require('sequelize');

const sequelize = new Sequelize(
  process.env.DB_NAME || 'campus_db',
  process.env.DB_USER || 'postgres',
  process.env.DB_PASSWORD || '',
  {
    host: process.env.DB_HOST || 'localhost',
    dialect: 'postgres',
    logging: false
  }
);

async function checkUserStatus() {
  try {
    const email = 'ahmet.celik.565@student.campus.edu.tr';
    
    console.log(`Kullanici durumu kontrol ediliyor: ${email}\n`);
    
    const [users] = await sequelize.query(`
      SELECT 
        email, 
        full_name, 
        role,
        is_email_verified,
        account_locked_until,
        failed_login_attempts,
        is_2fa_enabled
      FROM users 
      WHERE email = $1
    `, {
      bind: [email]
    });
    
    if (users.length === 0) {
      console.log('✗ Kullanici bulunamadi!');
      return;
    }
    
    const user = users[0];
    console.log('Kullanici Bilgileri:');
    console.log(`  Email: ${user.email}`);
    console.log(`  İsim: ${user.full_name}`);
    console.log(`  Rol: ${user.role}`);
    console.log(`  Email Doğrulandı: ${user.is_email_verified ? '✓ EVET' : '✗ HAYIR'}`);
    console.log(`  Hesap Kilitli: ${user.account_locked_until ? '✗ EVET' : '✓ HAYIR'}`);
    console.log(`  Başarısız Giriş: ${user.failed_login_attempts || 0}`);
    console.log(`  2FA Aktif: ${user.is_2fa_enabled ? 'EVET' : 'HAYIR'}`);
    
    if (!user.is_email_verified) {
      console.log('\n⚠️  SORUN: Email doğrulanmamış!');
      console.log('Çözüm: Email doğrulama durumunu güncelleyin:');
      console.log(`UPDATE users SET is_email_verified = true WHERE email = '${email}';`);
      
      // Otomatik düzelt
      console.log('\nOtomatik düzeltme yapılıyor...');
      await sequelize.query(`UPDATE users SET is_email_verified = true WHERE email = $1`, {
        bind: [email]
      });
      console.log('✓ Email doğrulama durumu güncellendi!');
    }
    
    if (user.account_locked_until) {
      console.log('\n⚠️  SORUN: Hesap kilitli!');
      console.log('Çözüm: Kilit durumunu temizleyin:');
      console.log(`UPDATE users SET account_locked_until = NULL, failed_login_attempts = 0 WHERE email = '${email}';`);
      
      // Otomatik düzelt
      console.log('\nOtomatik düzeltme yapılıyor...');
      await sequelize.query(`UPDATE users SET account_locked_until = NULL, failed_login_attempts = 0 WHERE email = $1`, {
        bind: [email]
      });
      console.log('✓ Hesap kilidi temizlendi!');
    }
    
    console.log('\n✓ Kullanici giriş yapmaya hazır!');
    console.log(`Email: ${email}`);
    console.log('Şifre: Password1 (veya dump dosyasındaki şifre)');
    
    await sequelize.close();
    process.exit(0);
  } catch (error) {
    console.error('✗ HATA:', error.message);
    process.exit(1);
  }
}

checkUserStatus();

