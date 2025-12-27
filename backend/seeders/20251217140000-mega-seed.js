'use strict';
const bcrypt = require('bcrypt');

// Helper to get random items from array
const getRandom = (arr, n) => {
    const shuffled = [...arr].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, n);
};

module.exports = {
    async up(queryInterface, Sequelize) {
        // Force cleanup before seeding to prevent duplicate errors
        const tables = [
            'meal_menus', 'cafeterias', 'transactions', 'wallets', 'meal_reservations',
            'events', 'event_registrations', 'schedules', 'reservations',
            'enrollments', 'course_sections', 'course_prerequisites', 'courses',
            'classrooms', 'students', 'faculties', 'users', 'departments'
        ];
        console.log('🧹 Cleaning up existing data...');
        for (const t of tables) {
            try {
                // CASCADE is essential to remove dependent rows
                await queryInterface.sequelize.query(`TRUNCATE TABLE "${t}" RESTART IDENTITY CASCADE;`);
            } catch (e) {
                console.log(`⚠️  Could not truncate ${t} (might not exist), skipping.`);
            }
        }
        console.log('✨ Data cleaned. Starting seed...');

        const passwordHash = await bcrypt.hash('Campus123!', 10);
        const now = new Date();

        console.log('🌱 Starting Mega Seeder...');

        // PATCH: Fix broken Foreign Key from previous migrations
        try {
            console.log('🔧 Patching DB Schema Constraints...');
            await queryInterface.sequelize.query(`ALTER TABLE students DROP CONSTRAINT IF EXISTS students_advisor_id_fkey;`);
            await queryInterface.sequelize.query(`ALTER TABLE students ADD CONSTRAINT students_advisor_id_fkey FOREIGN KEY (advisor_id) REFERENCES faculties(id) ON DELETE SET NULL;`);
        } catch (e) {
            console.log('⚠️ Schema patch warning:', e.message);
        }

        // ==================== 1. DEPARTMENTS (8 depts) ====================
        // Added numeric 'id_code' for student numbers
        const departmentsData = [
            { name: 'Bilgisayar Mühendisliği', code: 'CENG', id_code: '101', faculty: 'Mühendislik Fakültesi' },
            { name: 'Elektrik-Elektronik Mühendisliği', code: 'EEE', id_code: '102', faculty: 'Mühendislik Fakültesi' },
            { name: 'Makine Mühendisliği', code: 'ME', id_code: '103', faculty: 'Mühendislik Fakültesi' },
            { name: 'Endüstri Mühendisliği', code: 'IE', id_code: '104', faculty: 'Mühendislik Fakültesi' },
            { name: 'Tıp Fakültesi', code: 'MED', id_code: '201', faculty: 'Tıp Fakültesi' },
            { name: 'Hukuk Fakültesi', code: 'LAW', id_code: '301', faculty: 'Hukuk Fakültesi' },
            { name: 'Psikoloji', code: 'PSY', id_code: '401', faculty: 'Fen-Edebiyat Fakültesi' },
            { name: 'İşletme', code: 'BUS', id_code: '501', faculty: 'İktisadi ve İdari Bilimler Fakültesi' }
        ];

        // We insert without 'id_code' column as it's just for our logic here, unless we added it to DB. 
        // Assuming we didn't add it to DB, we use the logic only for student number generation.
        await queryInterface.bulkInsert('departments', departmentsData.map(({ id_code, ...d }) => ({ ...d, created_at: now, updated_at: now })), {});

        const deptRows = await queryInterface.sequelize.query(
            `SELECT id, code FROM departments ORDER BY id`,
            { type: Sequelize.QueryTypes.SELECT }
        );
        const deptMap = {};
        deptRows.forEach(d => { deptMap[d.code] = d.id; });
        console.log(`✅ ${deptRows.length} Departments created`);

        // ==================== 2. USERS (Admin, Staff, Faculty, Students) ====================
        const users = [];

        // Helper for names
        const firstNames = ['Ahmet', 'Mehmet', 'Ali', 'Can', 'Cem', 'Deniz', 'Ege', 'Emre', 'Kaan', 'Mert', 'Ozan', 'Umut', 'Yusuf', 'Ayşe', 'Fatma', 'Elif', 'Zeynep', 'Selin', 'Gamze', 'Gizem', 'Ece', 'Seda', 'Derya', 'Burak', 'Hakan', 'Oğuz', 'Serkan', 'Gökhan', 'Sinan', 'Murat', 'Merve', 'Büşra', 'Kübra', 'Esra', 'Pelin', 'İrem', 'Melis', 'Aslı', 'Beren', 'Defne'];
        const lastNames = ['Yılmaz', 'Kaya', 'Demir', 'Çelik', 'Şahin', 'Yıldız', 'Yıldırım', 'Öztürk', 'Aydın', 'Özdemir', 'Arslan', 'Doğan', 'Kılıç', 'Aslan', 'Çetin', 'Kara', 'Koç', 'Kurt', 'Özkan', 'Şimşek', 'Polat', 'Korkmaz', 'Özer', 'Yalçın', 'Güneş', 'Erdoğan', 'Bulut', 'Keskin', 'Avcı', 'Ünal'];

        const generateName = (index) => {
            const first = firstNames[index % firstNames.length];
            const last = lastNames[(index + Math.floor(index / firstNames.length)) % lastNames.length];
            return { first, last, full: `${first} ${last}` };
        };

        const generateEmail = (first, last, role, deptCode = '') => {
            const clean = (str) => str.toLowerCase()
                .replace(/ğ/g, 'g').replace(/ü/g, 'u').replace(/ş/g, 's').replace(/ı/g, 'i').replace(/ö/g, 'o').replace(/ç/g, 'c');

            const prefix = `${clean(first)}.${clean(last)}`;
            const randomSuffix = Math.floor(Math.random() * 1000);

            if (role === 'student') return `${prefix}.${randomSuffix}@student.campus.edu.tr`;
            return `${prefix}.${deptCode.toLowerCase()}@campus.edu.tr`;
        };

        // 2.1 Admin
        users.push({
            email: 'admin@campus.edu.tr',
            password_hash: passwordHash,
            full_name: 'Sistem Yöneticisi',
            role: 'admin',
            is_email_verified: true,
            created_at: now,
            updated_at: now
        });

        // 2.2 Roles for Part 3
        users.push({
            email: 'cafeteria@campus.edu.tr',
            password_hash: passwordHash,
            full_name: 'Cafeteria Manager',
            role: 'cafeteria_staff',
            is_email_verified: true,
            created_at: now,
            updated_at: now
        });
        users.push({
            email: 'event@campus.edu.tr',
            password_hash: passwordHash,
            full_name: 'Event Manager',
            role: 'event_manager',
            is_email_verified: true,
            created_at: now,
            updated_at: now
        });

        // 2.3 Faculty (2 per dept = 16)
        const facultyUsers = [];
        let globalUserCounter = 0;

        departmentsData.forEach((dept, i) => {
            // 2 Faculty per dept
            for (let f = 0; f < 2; f++) {
                globalUserCounter++;
                const { first, last, full } = generateName(globalUserCounter * 17); // Jump for variety
                // Ensure unique email
                let email = generateEmail(first, last, 'faculty', dept.code);
                while (users.some(u => u.email === email)) {
                    email = generateEmail(first, last, 'faculty', dept.code + Math.floor(Math.random() * 10));
                }

                users.push({
                    email: email,
                    password_hash: passwordHash,
                    full_name: `Dr. ${full}`,
                    role: 'faculty',
                    is_email_verified: true,
                    created_at: now,
                    updated_at: now
                });
                facultyUsers.push({
                    email: email,
                    deptCode: dept.code
                });
            }
        });

        // 2.4 Students (30 per dept = 240)
        const studentUsers = [];
        departmentsData.forEach((dept) => {
            for (let i = 1; i <= 30; i++) {
                globalUserCounter++;
                const { first, last, full } = generateName(globalUserCounter);

                // NEW FORMAT: 2024 + DeptID(3 digits) + Sequence(3 digits)
                // e.g. 2024101001
                const stdNum = `2024${dept.id_code}${String(i).padStart(3, '0')}`;

                let email = generateEmail(first, last, 'student');
                while (users.some(u => u.email === email)) {
                    email = generateEmail(first, last, 'student'); // Retry logic for uniqueness
                }

                users.push({
                    email: email,
                    password_hash: passwordHash,
                    full_name: full,
                    student_number: stdNum,
                    role: 'student',
                    is_email_verified: true,
                    created_at: now,
                    updated_at: now
                });
                studentUsers.push({
                    email: email,
                    deptCode: dept.code
                });
            }
        });

        await queryInterface.bulkInsert('users', users, {});
        console.log(`✅ ${users.length} Users created`);

        // Fetch User IDs
        const userRows = await queryInterface.sequelize.query(
            `SELECT id, email, role, student_number FROM users`,
            { type: Sequelize.QueryTypes.SELECT }
        );
        const userMap = {}; // email -> id
        const userStudentNumMap = {}; // email -> student_number
        userRows.forEach(u => {
            userMap[u.email] = u.id;
            if (u.student_number) userStudentNumMap[u.email] = u.student_number;
        });

        const facultyIdsByDept = {}; // code -> [ids]
        const facultyRecords = [];
        facultyUsers.forEach(f => {
            if (!facultyIdsByDept[f.deptCode]) facultyIdsByDept[f.deptCode] = [];
            const uid = userMap[f.email];
            facultyIdsByDept[f.deptCode].push(uid);

            facultyRecords.push({
                user_id: uid,
                department_id: deptMap[f.deptCode],
                created_at: now,
                updated_at: now
            });
        });
        await queryInterface.bulkInsert('faculties', facultyRecords, {});
        console.log(`✅ ${facultyRecords.length} Faculty Profiles created`);

        // Fetch Faculty IDs to assign as advisors
        const facultyRows = await queryInterface.sequelize.query(
            `SELECT id, department_id FROM faculties`,
            { type: Sequelize.QueryTypes.SELECT }
        );
        const facultyIdsByDeptId = {};
        facultyRows.forEach(f => {
            if (!facultyIdsByDeptId[f.department_id]) facultyIdsByDeptId[f.department_id] = [];
            facultyIdsByDeptId[f.department_id].push(f.id);
        });

        const studentIdsByDept = {}; // code -> [ids]
        const studentRecords = [];
        studentUsers.forEach(s => {
            if (!studentIdsByDept[s.deptCode]) studentIdsByDept[s.deptCode] = [];
            const uid = userMap[s.email];
            studentIdsByDept[s.deptCode].push(uid);

            const deptId = deptMap[s.deptCode];
            const deptFaculty = facultyIdsByDeptId[deptId] || [];
            const advisorId = deptFaculty.length > 0 ? deptFaculty[Math.floor(Math.random() * deptFaculty.length)] : null;

            studentRecords.push({
                user_id: uid,
                department_id: deptId,
                advisor_id: advisorId,
                student_number: userStudentNumMap[s.email] || 'UNKNOWN',
                gpa: (Math.random() * 2 + 2).toFixed(2), // Random GPA 2.00-4.00
                cgpa: (Math.random() * 2 + 2).toFixed(2),
                created_at: now,
                updated_at: now
            });
        });
        await queryInterface.bulkInsert('students', studentRecords, {});
        console.log(`✅ ${studentRecords.length} Student Profiles created`);


        // ==================== 3. CLASSROOMS (15) ====================
        const classroomsData = [];
        ['A', 'B', 'C'].forEach(block => {
            for (let i = 1; i <= 5; i++) {
                classroomsData.push({
                    name: `${block}-${100 + i}`,
                    building: `${block} Blok`,
                    room_number: `${100 + i}`,
                    capacity: 50,
                    latitude: 41.0082 + (i * 0.0001),
                    longitude: 28.9784 + (i * 0.0001),
                    created_at: now,
                    updated_at: now
                });
            }
        });
        await queryInterface.bulkInsert('classrooms', classroomsData, {});
        const classroomRows = await queryInterface.sequelize.query(`SELECT id FROM classrooms`, { type: Sequelize.QueryTypes.SELECT });
        const classroomIds = classroomRows.map(c => c.id);
        console.log(`✅ ${classroomsData.length} Classrooms created`);

        // ==================== 4. COURSES (Based on Realistic Curriculum) ====================
        const CURRICULUM = require('../seed_data/curriculum_data'); // Ensure this file exists or paste object here
        const courses = [];

        // Prepare course data
        Object.keys(CURRICULUM).forEach(deptCode => {
            const deptId = deptMap[deptCode];
            if (!deptId) return;

            const deptCourses = CURRICULUM[deptCode];
            deptCourses.forEach(c => {
                courses.push({
                    code: c.code,
                    name: c.name,
                    description: `Course covering ${c.name} topics.`,
                    credits: c.credits,
                    ects: c.ects,
                    department_id: deptId,
                    created_at: now,
                    updated_at: now
                });
            });
        });

        await queryInterface.bulkInsert('courses', courses, {});
        console.log(`✅ ${courses.length} Courses created`);

        // Get Course IDs for Prerequisites
        const courseRows = await queryInterface.sequelize.query(`SELECT id, code, department_id FROM courses`, { type: Sequelize.QueryTypes.SELECT });
        const courseMap = {}; // code -> id
        const coursesByDeptId = {}; // deptId -> [courses]

        courseRows.forEach(c => {
            courseMap[c.code] = c.id;
            if (!coursesByDeptId[c.department_id]) coursesByDeptId[c.department_id] = [];
            coursesByDeptId[c.department_id].push(c);
        });

        // ==================== 4.1 PREREQUISITES ====================
        const prerequisites = [];

        Object.keys(CURRICULUM).forEach(deptCode => {
            const deptCourses = CURRICULUM[deptCode];
            deptCourses.forEach(c => {
                if (c.prereq) {
                    const courseId = courseMap[c.code];
                    const prereqId = courseMap[c.prereq];

                    if (courseId && prereqId) {
                        prerequisites.push({
                            course_id: courseId,
                            prerequisite_course_id: prereqId,
                            created_at: now,
                            updated_at: now
                        });
                    }
                }
            });
        });

        if (prerequisites.length > 0) {
            await queryInterface.bulkInsert('course_prerequisites', prerequisites, {});
            console.log(`✅ ${prerequisites.length} Prerequisites created`);
        } else {
            console.log(`ℹ️ No prerequisites defined`);
        }

        // ==================== 5. COURSE SECTIONS (1 per course + Smart Schedule) ====================
        const sections = [];
        const slots = [
            { day: 'Monday', start: '09:00', end: '11:50' },
            { day: 'Monday', start: '13:00', end: '15:50' },
            { day: 'Tuesday', start: '09:00', end: '11:50' },
            { day: 'Tuesday', start: '13:00', end: '15:50' },
            { day: 'Wednesday', start: '09:00', end: '11:50' },
            { day: 'Wednesday', start: '13:00', end: '15:50' },
            { day: 'Thursday', start: '09:00', end: '11:50' },
            { day: 'Thursday', start: '13:00', end: '15:50' },
            { day: 'Friday', start: '09:00', end: '11:50' },
            { day: 'Friday', start: '13:00', end: '15:50' }
        ];

        // Process courses dept by dept
        for (const deptId in coursesByDeptId) {
            const deptCourses = coursesByDeptId[deptId];
            deptCourses.sort((a, b) => a.code.localeCompare(b.code)); // Sort by code

            const deptCode = Object.keys(deptMap).find(key => deptMap[key] == deptId);
            const instructors = facultyIdsByDept[deptCode]; // these are user_ids

            deptCourses.forEach((c, index) => {
                const instructorId = instructors ? instructors[index % instructors.length] : null;
                const slot = slots[index % slots.length];
                const roomId = classroomIds[index % classroomIds.length];

                if (instructorId) {
                    sections.push({
                        course_id: c.id,
                        section_number: 1,
                        semester: '2025-SPRING',
                        instructor_id: instructorId,
                        capacity: 50, // Increased capacity
                        enrolled_count: 0,
                        schedule: JSON.stringify([{
                            day: slot.day,
                            start: slot.start,
                            end: slot.end,
                            room_id: roomId
                        }]),
                        created_at: now,
                        updated_at: now
                    });
                }
            });
        }

        await queryInterface.bulkInsert('course_sections', sections, {});
        const sectionRows = await queryInterface.sequelize.query(`SELECT id, course_id FROM course_sections`, { type: Sequelize.QueryTypes.SELECT });
        const sectionsByCourseId = {};
        sectionRows.forEach(s => sectionsByCourseId[s.course_id] = s.id);
        console.log(`✅ ${sections.length} Sections created`);

        // ==================== 6. ENROLLMENTS ====================
        const enrollments = [];

        // Loop through departments
        for (const deptCode of Object.keys(studentIdsByDept)) {
            const students = studentIdsByDept[deptCode];
            const deptId = deptMap[deptCode];
            const deptCourses = coursesByDeptId[deptId];

            if (!deptCourses || deptCourses.length === 0) continue;

            // Enroll each student in first 3 courses of their department
            students.forEach(studentId => {
                const coursesToEnroll = deptCourses.slice(0, 3); // Take first 3

                coursesToEnroll.forEach(course => {
                    const sectionId = sectionsByCourseId[course.id];
                    if (sectionId) {
                        enrollments.push({
                            student_id: studentId,
                            section_id: sectionId,
                            status: 'ACTIVE',
                            enrollment_date: now,
                            absence_hours_used: 0,
                            absence_limit: 12, // Default limit
                            created_at: now,
                            updated_at: now
                        });
                    }
                });
            });
        }

        await queryInterface.bulkInsert('enrollments', enrollments, {});
        console.log(`✅ ${enrollments.length} Enrollments created`);

        // Update counts
        await queryInterface.sequelize.query(`
             UPDATE course_sections 
             SET enrolled_count = (SELECT COUNT(*) FROM enrollments WHERE enrollments.section_id = course_sections.id)
         `);


        // ==================== 7. PART 3 DATA: WALLETS ====================
        const wallets = userRows.map(u => ({
            user_id: u.id,
            balance: u.role === 'student' ? 500 : 2000,
            currency: 'TRY',
            is_active: true,
            created_at: now,
            updated_at: now
        }));
        await queryInterface.bulkInsert('wallets', wallets, {});
        console.log(`✅ ${wallets.length} Wallets created`);

        // ==================== 8. PART 3 DATA: CAFETERIA & MENUS ====================
        const cafeteriaId = 1; // Auto increment start
        await queryInterface.bulkInsert('cafeterias', [{
            name: 'Main Campus Dining',
            location: 'Central',
            capacity: 500,
            is_active: true,
            created_at: now,
            updated_at: now
        }]);

        await queryInterface.bulkInsert('meal_menus', [
            {
                cafeteria_id: cafeteriaId,
                date: new Date().toISOString().split('T')[0],
                meal_type: 'lunch',
                items_json: JSON.stringify(['Soup', 'Main Dish', 'Rice']),
                nutrition_json: JSON.stringify({ calories: 500 }),
                price: 20.00,
                is_published: true,
                created_at: now,
                updated_at: now
            }
        ]);
        console.log(`✅ Part 3 Data Initialized`);

        // ==================== 9. EXAMS & GRADES (For Academic Analytics) ====================
        const exams = [];

        // Create one MIDTERM and one FINAL exam per section
        for (const section of sectionRows) {
            exams.push({
                section_id: section.id,
                title: 'Vize Sınavı',
                type: 'MIDTERM',
                weight: 40,
                date: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
                is_published: true,
                average_score: 0,
                created_at: now,
                updated_at: now
            });
            exams.push({
                section_id: section.id,
                title: 'Final Sınavı',
                type: 'FINAL',
                weight: 60,
                date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 7 days ago
                is_published: true,
                average_score: 0,
                created_at: now,
                updated_at: now
            });
        }

        await queryInterface.bulkInsert('exams', exams, {});
        console.log(`✅ ${exams.length} Exams created`);

        // Fetch exam IDs
        const examRows = await queryInterface.sequelize.query(
            `SELECT id, section_id FROM exams`,
            { type: Sequelize.QueryTypes.SELECT }
        );

        // Create grades for each enrollment (student-exam pair)
        const grades = [];

        // Fetch enrollments to create grades
        const enrollmentRows = await queryInterface.sequelize.query(
            `SELECT id, student_id, section_id FROM enrollments`,
            { type: Sequelize.QueryTypes.SELECT }
        );

        for (const enroll of enrollmentRows) {
            // Find exams for this section
            const sectionExams = examRows.filter(e => e.section_id === enroll.section_id);

            for (const exam of sectionExams) {
                const score = Math.floor(Math.random() * 50) + 50; // 50-100
                grades.push({
                    exam_id: exam.id,
                    student_id: enroll.student_id,
                    score: score,
                    feedback: score >= 70 ? 'Başarılı' : 'Geliştirilmeli',
                    created_at: now,
                    updated_at: now
                });
            }
        }

        await queryInterface.bulkInsert('grades', grades, {});
        console.log(`✅ ${grades.length} Grades created`);

        // ==================== 10. ATTENDANCE SESSIONS & RECORDS ====================
        const attendanceSessions = [];
        const attendanceRecords = [];

        // Get section IDs for creating sessions
        const sectionRowsForAttendance = await queryInterface.sequelize.query(
            `SELECT cs.id as section_id, cs.course_id, cs.instructor_id FROM course_sections cs LIMIT 20`,
            { type: Sequelize.QueryTypes.SELECT }
        );

        // Create 3 sessions per section (last 30 days)
        let sessionIdCounter = 1;
        const sessionMap = {}; // store session details

        for (const section of sectionRowsForAttendance) {
            for (let i = 0; i < 3; i++) {
                const sessionDate = new Date();
                sessionDate.setDate(sessionDate.getDate() - (i * 7 + Math.floor(Math.random() * 5)));

                const endTime = new Date(sessionDate);
                endTime.setHours(endTime.getHours() + 3);

                attendanceSessions.push({
                    section_id: section.section_id,
                    instructor_id: section.instructor_id,
                    start_time: sessionDate,
                    end_time: endTime,
                    qr_code: `QR-${section.section_id}-${i}-${Date.now()}`,
                    status: 'CLOSED',
                    created_at: now,
                    updated_at: now
                });
                sessionMap[sessionIdCounter] = section.section_id;
                sessionIdCounter++;
            }
        }

        await queryInterface.bulkInsert('attendance_sessions', attendanceSessions, {});
        console.log(`✅ ${attendanceSessions.length} Attendance Sessions created`);

        // Fetch created session IDs
        const sessionRows = await queryInterface.sequelize.query(
            `SELECT id, section_id FROM attendance_sessions`,
            { type: Sequelize.QueryTypes.SELECT }
        );

        // For each session, create records for enrolled students
        for (const session of sessionRows) {
            // Get students enrolled in this section
            const enrolledStudents = await queryInterface.sequelize.query(
                `SELECT student_id FROM enrollments WHERE section_id = ${session.section_id}`,
                { type: Sequelize.QueryTypes.SELECT }
            );

            enrolledStudents.forEach(student => {
                // Random status: 75% PRESENT, 18% ABSENT, 7% EXCUSED
                const rand = Math.random();
                let status = 'PRESENT';
                if (rand > 0.93) status = 'EXCUSED';
                else if (rand > 0.75) status = 'ABSENT';

                attendanceRecords.push({
                    session_id: session.id,
                    student_id: student.student_id,
                    status: status,
                    check_in_time: status === 'PRESENT' ? now : null,
                    created_at: now,
                    updated_at: now
                });
            });
        }

        await queryInterface.bulkInsert('attendance_records', attendanceRecords, {});
        console.log(`✅ ${attendanceRecords.length} Attendance Records created`);

        // ==================== 11. MEAL RESERVATIONS (For Meal Analytics) ====================
        const mealReservations = [];
        const studentUserIds = userRows.filter(u => u.role === 'student').map(u => u.id);
        const mealTypes = ['lunch', 'dinner']; // Only lunch and dinner per model

        // Last 14 days of reservations
        for (let day = 0; day < 14; day++) {
            const reservationDate = new Date();
            reservationDate.setDate(reservationDate.getDate() - day);
            const dateStr = reservationDate.toISOString().split('T')[0];

            // 20-40 reservations per day
            const dailyCount = Math.floor(Math.random() * 20) + 20;
            const selectedStudents = getRandom(studentUserIds, dailyCount);

            selectedStudents.forEach(studentId => {
                const mealType = mealTypes[Math.floor(Math.random() * mealTypes.length)];
                mealReservations.push({
                    user_id: studentId,
                    cafeteria_id: cafeteriaId,
                    date: dateStr,
                    meal_type: mealType,
                    status: Math.random() > 0.1 ? 'used' : 'reserved', // lowercase per model
                    created_at: now,
                    updated_at: now
                });
            });
        }

        await queryInterface.bulkInsert('meal_reservations', mealReservations, {});
        console.log(`✅ ${mealReservations.length} Meal Reservations created`);

        // ==================== 12. EVENTS & REGISTRATIONS (For Event Analytics) ====================
        const eventsData = [
            { title: 'Kariyer Günleri 2025', description: 'Sektör profesyonelleriyle tanışma fırsatı', location: 'Ana Konferans Salonu', capacity: 200, category: 'Seminer' }, // Was Kariyer
            { title: 'Hackathon: Smart Campus', description: '48 saatlik yazılım maratonu', location: 'Bilgisayar Lab', capacity: 100, category: 'Atölye' }, // Was Teknoloji
            { title: 'Mezuniyet Töreni', description: '2025 Bahar Mezuniyet Töreni', location: 'Stadyum', capacity: 5000, category: 'Kültürel' }, // Was Tören
            { title: 'Yapay Zeka Atölyesi', description: 'Temel ML kavramları ve uygulamaları', location: 'B-101', capacity: 50, category: 'Atölye' },
            { title: 'Spor Festivali', description: 'Fakülteler arası turnuva', location: 'Spor Kompleksi', capacity: 300, category: 'Spor' }
        ];

        const events = eventsData.map((e, i) => {
            const eventDate = new Date();
            eventDate.setDate(eventDate.getDate() + (i * 7) + 5); // Future events
            const dateStr = eventDate.toISOString().split('T')[0];

            return {
                title: e.title,
                description: e.description,
                category: e.category,
                date: dateStr,
                start_time: '10:00:00',
                end_time: '15:00:00',
                location: e.location,
                capacity: e.capacity,
                registered_count: 0,
                status: 'published',
                created_at: now,
                updated_at: now
            };
        });

        await queryInterface.bulkInsert('events', events, {});
        console.log(`✅ ${events.length} Events created`);

        // Fetch event IDs
        const eventRows = await queryInterface.sequelize.query(
            `SELECT id FROM events`,
            { type: Sequelize.QueryTypes.SELECT }
        );

        // Register random students to events
        const eventRegistrations = [];
        eventRows.forEach(event => {
            const registrantCount = Math.floor(Math.random() * 30) + 15; // 15-45 per event
            const registrants = getRandom(studentUserIds, registrantCount);

            registrants.forEach(studentId => {
                eventRegistrations.push({
                    event_id: event.id,
                    user_id: studentId,
                    registration_date: now,
                    checked_in: Math.random() > 0.7,
                    created_at: now,
                    updated_at: now
                });
            });
        });

        await queryInterface.bulkInsert('event_registrations', eventRegistrations, {});
        console.log(`✅ ${eventRegistrations.length} Event Registrations created`);

        console.log('🎉 Mega Seed Complete!');
    },

    async down(queryInterface, Sequelize) {
        // Drop all standard tables' content
        const tables = [
            'meal_menus', 'cafeterias', 'transactions', 'wallets', 'meal_reservations',
            'events', 'event_registrations', 'schedules', 'reservations',
            'enrollments', 'course_sections', 'course_prerequisites', 'courses',
            'classrooms', 'users', 'departments'
        ];
        for (const t of tables) {
            try {
                await queryInterface.bulkDelete(t, null, {});
            } catch (e) { console.log(`Skipping ${t}`); }
        }
    }
};
