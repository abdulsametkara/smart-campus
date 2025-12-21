// Öğrenci Kullanıcılarını Bulma
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

async function findStudents() {
  try {
    console.log('Öğrenci kullanıcıları araniyor...\n');
    
    // Tüm öğrenci kullanıcılarını bul
    const [students] = await sequelize.query(`
      SELECT email, full_name, role, student_number 
      FROM users 
      WHERE role = 'student' 
      ORDER BY email 
      LIMIT 10
    `);
    
    if (students.length > 0) {
      console.log('✓ Bulunan öğrenci kullanıcıları:\n');
      students.forEach((student, index) => {
        console.log(`${index + 1}. Email: ${student.email}`);
        console.log(`   İsim: ${student.full_name}`);
        console.log(`   Öğrenci No: ${student.student_number || 'Yok'}`);
        console.log('');
      });
      
      console.log(`\nToplam ${students.length} öğrenci bulundu.`);
      console.log('\nGiriş yapmak için ilk öğrencinin email ve şifresini kullanabilirsiniz.');
      console.log('Şifre genellikle: Password1 veya password123');
    } else {
      console.log('✗ Hiç öğrenci kullanıcısı bulunamadı.');
      
      // Tüm kullanıcıları listele
      const [allUsers] = await sequelize.query(`
        SELECT email, full_name, role 
        FROM users 
        ORDER BY role, email 
        LIMIT 20
      `);
      
      console.log('\nMevcut tüm kullanıcılar:');
      allUsers.forEach(user => {
        console.log(`  - ${user.email} (${user.full_name}) - ${user.role}`);
      });
    }
    
    await sequelize.close();
    process.exit(0);
  } catch (error) {
    console.error('✗ HATA:', error.message);
    process.exit(1);
  }
}

findStudents();

