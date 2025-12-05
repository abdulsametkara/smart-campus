'use strict';

const bcrypt = require('bcrypt');

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface) {
    const now = new Date();
    const passwordHash = await bcrypt.hash('Password1', 10);

    const [departmentId] = await queryInterface.bulkInsert(
      'departments',
      [
        {
          name: 'Computer Engineering',
          code: 'CENG',
          faculty: 'Engineering Faculty',
          created_at: now,
          updated_at: now,
        },
      ],
      { returning: ['id'] }
    );

    const deptId = departmentId?.id || 1;

    const users = [];

    // 5 students
    for (let i = 1; i <= 5; i += 1) {
      users.push({
        email: `student${i}@example.com`,
        full_name: `Student ${i} Example`,
        password_hash: passwordHash,
        role: 'student',
        is_email_verified: true,
        created_at: now,
        updated_at: now,
      });
    }

    // 2 faculty
    for (let i = 1; i <= 2; i += 1) {
      users.push({
        email: `faculty${i}@example.com`,
        full_name: `Faculty ${i} Example`,
        password_hash: passwordHash,
        role: 'faculty',
        is_email_verified: true,
        created_at: now,
        updated_at: now,
      });
    }

    // 1 admin
    users.push({
      email: 'admin@example.com',
      full_name: 'Admin User',
      password_hash: passwordHash,
      role: 'admin',
      is_email_verified: true,
      created_at: now,
      updated_at: now,
    });

    const insertedUsers = await queryInterface.bulkInsert('users', users, {
      returning: ['id', 'role'],
    });

    const userRows = Array.isArray(insertedUsers) ? insertedUsers : [];

    const students = [];
    const facultyMembers = [];

    let studentCounter = 1;
    let facultyCounter = 1;

    userRows.forEach((row) => {
      if (row.role === 'student') {
        students.push({
          user_id: row.id,
          student_number: `2025${String(studentCounter).padStart(4, '0')}`,
          department_id: deptId,
          gpa: null,
          cgpa: null,
          created_at: now,
          updated_at: now,
        });
        studentCounter += 1;
      } else if (row.role === 'faculty') {
        facultyMembers.push({
          user_id: row.id,
          employee_number: `EMP${String(facultyCounter).padStart(3, '0')}`,
          title: 'Dr.',
          department_id: deptId,
          created_at: now,
          updated_at: now,
        });
        facultyCounter += 1;
      }
    });

    if (students.length) {
      await queryInterface.bulkInsert('students', students);
    }

    if (facultyMembers.length) {
      await queryInterface.bulkInsert('faculty', facultyMembers);
    }
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete('faculty', null, {});
    await queryInterface.bulkDelete('students', null, {});
    await queryInterface.bulkDelete('users', null, {});
    await queryInterface.bulkDelete('departments', null, {});
  },
};
