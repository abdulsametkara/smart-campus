// Şifre Sıfırlama Scripti
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

async function resetPassword() {
  try {
    const email = 'ahmet.celik.565@student.campus.edu.tr';
    const newPassword = 'Password1';
    
    console.log(`Şifre sıfırlanıyor: ${email}\n`);
    
    // Şifreyi hash'le
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(newPassword, saltRounds);
    
    // Veritabanında güncelle
    await sequelize.query(`
      UPDATE users 
      SET password_hash = $1,
          failed_login_attempts = 0,
          account_locked_until = NULL
      WHERE email = $2
    `, {
      bind: [passwordHash, email]
    });
    
    console.log('✓ Şifre başarıyla sıfırlandı!');
    console.log(`Email: ${email}`);
    console.log(`Yeni Şifre: ${newPassword}`);
    console.log('\nArtık bu şifre ile giriş yapabilirsiniz!');
    
    await sequelize.close();
    process.exit(0);
  } catch (error) {
    console.error('✗ HATA:', error.message);
    process.exit(1);
  }
}

resetPassword();

