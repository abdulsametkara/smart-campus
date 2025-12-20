// Backend Veritabanı Bağlantı Testi
require('dotenv').config();
const { Sequelize } = require('sequelize');

const sequelize = new Sequelize(
  process.env.DB_NAME || 'campus_db',
  process.env.DB_USER || 'postgres',
  process.env.DB_PASSWORD || '',
  {
    host: process.env.DB_HOST || 'localhost',
    dialect: 'postgres',
    logging: console.log
  }
);

async function testConnection() {
  try {
    console.log('Veritabani baglantisi test ediliyor...');
    console.log('Host:', process.env.DB_HOST || 'localhost');
    console.log('Database:', process.env.DB_NAME || 'campus_db');
    console.log('User:', process.env.DB_USER || 'postgres');
    console.log('');
    
    await sequelize.authenticate();
    console.log('✓ Veritabani baglantisi basarili!');
    
    // Kullanıcı kontrolü
    const [results] = await sequelize.query("SELECT email, full_name, role FROM users WHERE email = 'student1@example.com' LIMIT 1");
    
    if (results.length > 0) {
      console.log('✓ Kullanici bulundu:', results[0]);
    } else {
      console.log('✗ Kullanici bulunamadi: student1@example.com');
      console.log('Mevcut kullanicilar:');
      const [allUsers] = await sequelize.query("SELECT email, full_name, role FROM users LIMIT 5");
      allUsers.forEach(user => console.log('  -', user.email, user.full_name, user.role));
    }
    
    await sequelize.close();
    process.exit(0);
  } catch (error) {
    console.error('✗ HATA:', error.message);
    console.error('Detay:', error);
    process.exit(1);
  }
}

testConnection();

