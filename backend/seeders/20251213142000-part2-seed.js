'use strict';
const bcrypt = require('bcrypt');

module.exports = {
    async up(queryInterface, Sequelize) {
        // 1. Departments
        const departments = [
            { name: 'Computer Engineering', code: 'CENG', faculty_name: 'Engineering', created_at: new Date(), updated_at: new Date() },
            { name: 'Electrical-Electronics Engineering', code: 'EEE', faculty_name: 'Engineering', created_at: new Date(), updated_at: new Date() },
            { name: 'Industrial Engineering', code: 'IE', faculty_name: 'Engineering', created_at: new Date(), updated_at: new Date() },
            { name: 'Mechanical Engineering', code: 'ME', faculty_name: 'Engineering', created_at: new Date(), updated_at: new Date() },
            { name: 'Architecture', code: 'ARCH', faculty_name: 'Architecture', created_at: new Date(), updated_at: new Date() }
        ];

        try {
            await queryInterface.bulkInsert('departments', departments, {});
        } catch (e) {
            console.log('Departments might already exist, skipping...');
        }

        // Get Department IDs
        const cengDept = await queryInterface.sequelize.query(
            `SELECT id FROM departments WHERE code = 'CENG' LIMIT 1;`,
            { type: queryInterface.sequelize.QueryTypes.SELECT }
        );
        const cengId = cengDept[0]?.id;

        if (!cengId) throw new Error('CENG Department not found after seed!');

        // 2. Users (Faculty & Student)
        const passwordHash = await bcrypt.hash('Campus123!', 10);
        const users = [
            {
                name: 'Dr. Ali Veli',
                email: 'ali.veli@smartcampus.edu.tr',
                password: passwordHash,
                role: 'faculty',
                department_id: cengId,
                created_at: new Date(),
                updated_at: new Date()
            },
            {
                name: 'Ayse Yilmaz',
                email: 'ayse.yilmaz@student.smartcampus.edu.tr',
                password: passwordHash,
                role: 'student',
                department_id: cengId,
                student_number: '2024001',
                created_at: new Date(),
                updated_at: new Date()
            }
        ];

        try {
            await queryInterface.bulkInsert('users', users, {});
        } catch (e) {
            console.log('Users might already exist, skipping...');
        }

        // Get User IDs
        const facultyUser = await queryInterface.sequelize.query(
            `SELECT id FROM users WHERE email = 'ali.veli@smartcampus.edu.tr' LIMIT 1;`,
            { type: queryInterface.sequelize.QueryTypes.SELECT }
        );
        const studentUser = await queryInterface.sequelize.query(
            `SELECT id FROM users WHERE email = 'ayse.yilmaz@student.smartcampus.edu.tr' LIMIT 1;`,
            { type: queryInterface.sequelize.QueryTypes.SELECT }
        );

        const facultyId = facultyUser[0]?.id;
        const studentId = studentUser[0]?.id;

        // 3. Courses
        const courses = [
            {
                code: 'CENG101',
                name: 'Introduction to Computer Engineering',
                description: 'Basic concepts of computer engineering.',
                credits: 3,
                ects: 5,
                department_id: cengId,
                created_at: new Date(),
                updated_at: new Date()
            }
        ];

        try {
            await queryInterface.bulkInsert('courses', courses, {});
        } catch (e) {
            console.log('Courses might already exist, skipping...');
        }

        const course = await queryInterface.sequelize.query(
            `SELECT id FROM courses WHERE code = 'CENG101' LIMIT 1;`,
            { type: queryInterface.sequelize.QueryTypes.SELECT }
        );
        const courseId = course[0]?.id;

        // 4. Classrooms
        const classrooms = [
            {
                name: 'B-201',
                building: 'Engineering Block B',
                room_number: '201',
                capacity: 50,
                latitude: 41.0082,
                longitude: 28.9784,
                created_at: new Date(),
                updated_at: new Date()
            }
        ];

        try {
            await queryInterface.bulkInsert('classrooms', classrooms, {});
        } catch (e) { }

        // Get Classroom ID for schedule
        const classroom = await queryInterface.sequelize.query(
            `SELECT id FROM classrooms WHERE name = 'B-201' LIMIT 1;`,
            { type: queryInterface.sequelize.QueryTypes.SELECT }
        );
        const classroomId = classroom[0]?.id;

        // 5. Course Sections
        const sections = [
            {
                course_id: courseId,
                section_number: 1,
                semester: '2025-SPRING',
                instructor_id: facultyId,
                capacity: 50,
                enrolled_count: 1,
                schedule: JSON.stringify([{ day: "Monday", start: "09:00", end: "12:00", room_id: classroomId }]),
                created_at: new Date(),
                updated_at: new Date()
            }
        ];

        try {
            await queryInterface.bulkInsert('course_sections', sections, {});
        } catch (e) { }

        const section = await queryInterface.sequelize.query(
            `SELECT id FROM course_sections WHERE course_id = ${courseId} AND section_number = 1 LIMIT 1;`,
            { type: queryInterface.sequelize.QueryTypes.SELECT }
        );
        const sectionId = section[0]?.id;

        // 6. Enrollments
        const enrollments = [
            {
                student_id: studentId,
                section_id: sectionId,
                status: 'ACTIVE',
                enrollment_date: new Date(),
                created_at: new Date(),
                updated_at: new Date()
            }
        ];

        try {
            await queryInterface.bulkInsert('enrollments', enrollments, {});
        } catch (e) {
            console.log('Enrollments might already exist.');
        }

        // 7. Attendance Sessions
        const sessions = [
            {
                section_id: sectionId,
                instructor_id: facultyId,
                start_time: new Date(),
                end_time: new Date(new Date().getTime() + 60 * 60 * 1000),
                latitude: 41.0082,
                longitude: 28.9784,
                radius: 20,
                qr_code: 'mock-qr-code-hash-123',
                status: 'ACTIVE',
                created_at: new Date(),
                updated_at: new Date()
            }
        ];

        try {
            await queryInterface.bulkInsert('attendance_sessions', sessions, {});
        } catch (e) { }

    },

    async down(queryInterface, Sequelize) {
        await queryInterface.bulkDelete('attendance_sessions', null, {});
        await queryInterface.bulkDelete('enrollments', null, {});
        await queryInterface.bulkDelete('course_sections', null, {});
        await queryInterface.bulkDelete('classrooms', null, {});
        await queryInterface.bulkDelete('courses', null, {});
    }
};