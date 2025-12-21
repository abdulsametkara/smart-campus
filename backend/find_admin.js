// Admin Kullanıcılarını Bulma ve Şifre Sıfırlama
require('dotenv').config();
const { Sequelize } = require('sequelize');
const bcrypt = require('bcrypt');

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

async function findAndResetAdmin() {
  try {
    console.log('Admin kullanıcıları araniyor...\n');
    
    // Tüm admin kullanıcılarını bul
    const [admins] = await sequelize.query(`
      SELECT email, full_name, role, is_email_verified
      FROM users 
      WHERE role = 'admin' 
      ORDER BY email 
      LIMIT 5
    `);
    
    if (admins.length === 0) {
      console.log('✗ Admin kullanıcısı bulunamadı!');
      return;
    }
    
    console.log('✓ Bulunan admin kullanıcıları:\n');
    admins.forEach((admin, index) => {
      console.log(`${index + 1}. Email: ${admin.email}`);
      console.log(`   İsim: ${admin.full_name}`);
      console.log(`   Email Doğrulandı: ${admin.is_email_verified ? '✓' : '✗'}`);
      console.log('');
    });
    
    // İlk admin'in şifresini sıfırla
    const adminEmail = admins[0].email;
    const newPassword = 'Password1';
    
    console.log(`\nŞifre sıfırlanıyor: ${adminEmail}`);
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(newPassword, saltRounds);
    
    // Email doğrulamasını da aktif et
    await sequelize.query(`
      UPDATE users 
      SET password_hash = $1,
          is_email_verified = true,
          failed_login_attempts = 0,
          account_locked_until = NULL
      WHERE email = $2
    `, {
      bind: [passwordHash, adminEmail]
    });
    
    console.log('✓ Şifre başarıyla sıfırlandı!');
    console.log('\n========================================');
    console.log('ADMIN GİRİŞ BİLGİLERİ:');
    console.log('========================================');
    console.log(`Email: ${adminEmail}`);
    console.log(`Şifre: ${newPassword}`);
    console.log('========================================\n');
    
    await sequelize.close();
    process.exit(0);
  } catch (error) {
    console.error('✗ HATA:', error.message);
    process.exit(1);
  }
}

findAndResetAdmin();

