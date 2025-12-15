'use strict';
const bcrypt = require('bcrypt');

module.exports = {
    async up(queryInterface, Sequelize) {
        const passwordHash = await bcrypt.hash('Campus123!', 10);
        const now = new Date();

        // ==================== 1. DEPARTMENTS (5 departments) ====================
        const departments = [
            { name: 'Bilgisayar Mühendisliği', code: 'CENG', faculty: 'Mühendislik Fakültesi', created_at: now, updated_at: now },
            { name: 'Elektrik-Elektronik Mühendisliği', code: 'EEE', faculty: 'Mühendislik Fakültesi', created_at: now, updated_at: now },
            { name: 'Makine Mühendisliği', code: 'ME', faculty: 'Mühendislik Fakültesi', created_at: now, updated_at: now },
            { name: 'Endüstri Mühendisliği', code: 'IE', faculty: 'Mühendislik Fakültesi', created_at: now, updated_at: now },
            { name: 'Matematik', code: 'MATH', faculty: 'Fen-Edebiyat Fakültesi', created_at: now, updated_at: now }
        ];

        await queryInterface.bulkInsert('departments', departments, {});
        console.log('✅ Departments created');

        // Get department IDs
        const deptRows = await queryInterface.sequelize.query(
            `SELECT id, code FROM departments ORDER BY id`,
            { type: Sequelize.QueryTypes.SELECT }
        );
        const deptMap = {};
        deptRows.forEach(d => { deptMap[d.code] = d.id; });

        // ==================== 2. USERS ====================
        // 2.1 Admin (1)
        const adminUser = {
            email: 'admin@smartcampus.edu.tr',
            password_hash: passwordHash,
            full_name: 'Sistem Yöneticisi',
            phone_number: '0532 100 0001',
            role: 'admin',
            is_email_verified: true,
            failed_login_attempts: 0,
            created_at: now,
            updated_at: now
        };

        // 2.2 Faculty (5)
        const facultyUsers = [
            { email: 'ahmet.yildiz@smartcampus.edu.tr', full_name: 'Prof. Dr. Ahmet Yıldız', phone: '0532 200 0001', dept: 'CENG' },
            { email: 'ayse.demir@smartcampus.edu.tr', full_name: 'Doç. Dr. Ayşe Demir', phone: '0532 200 0002', dept: 'CENG' },
            { email: 'mehmet.kaya@smartcampus.edu.tr', full_name: 'Dr. Mehmet Kaya', phone: '0532 200 0003', dept: 'EEE' },
            { email: 'fatma.ozturk@smartcampus.edu.tr', full_name: 'Prof. Dr. Fatma Öztürk', phone: '0532 200 0004', dept: 'ME' },
            { email: 'ali.celik@smartcampus.edu.tr', full_name: 'Doç. Dr. Ali Çelik', phone: '0532 200 0005', dept: 'MATH' }
        ].map(f => ({
            email: f.email,
            password_hash: passwordHash,
            full_name: f.full_name,
            phone_number: f.phone,
            role: 'faculty',
            is_email_verified: true,
            failed_login_attempts: 0,
            created_at: now,
            updated_at: now
        }));

        // 2.3 Students (25)
        const studentNames = [
            'Ali Veli', 'Zeynep Kara', 'Emre Şahin', 'Selin Yılmaz', 'Burak Aydın',
            'Elif Aksoy', 'Cem Polat', 'Deniz Arslan', 'Gizem Tunç', 'Hakan Korkmaz',
            'Irem Demir', 'Kerem Özer', 'Lale Güneş', 'Murat Erdoğan', 'Nisa Avcı',
            'Oğuz Yalçın', 'Pelin Koç', 'Rıza Şen', 'Seda Çetin', 'Tolga Kılıç',
            'Ufuk Tekin', 'Vildan Ak', 'Yusuf Durmaz', 'Zehra Bulut', 'Caner Işık'
        ];

        const studentUsers = studentNames.map((name, i) => {
            const studentNo = `2024${String(i + 1).padStart(3, '0')}`;
            const emailName = name.toLowerCase()
                .replace(/ı/g, 'i').replace(/ş/g, 's').replace(/ğ/g, 'g')
                .replace(/ü/g, 'u').replace(/ö/g, 'o').replace(/ç/g, 'c')
                .replace(/\s/g, '.');
            return {
                email: `${emailName}@student.smartcampus.edu.tr`,
                password_hash: passwordHash,
                full_name: name,
                phone_number: `0532 300 ${String(i + 1).padStart(4, '0')}`,
                student_number: studentNo,
                role: 'student',
                is_email_verified: true,
                failed_login_attempts: 0,
                created_at: now,
                updated_at: now
            };
        });

        // Insert all users
        await queryInterface.bulkInsert('users', [adminUser, ...facultyUsers, ...studentUsers], {});
        console.log('✅ Users created (1 admin, 5 faculty, 25 students)');

        // Get user IDs
        const userRows = await queryInterface.sequelize.query(
            `SELECT id, email, role FROM users ORDER BY id`,
            { type: Sequelize.QueryTypes.SELECT }
        );
        const userMap = {};
        userRows.forEach(u => { userMap[u.email] = { id: u.id, role: u.role }; });

        const facultyIds = userRows.filter(u => u.role === 'faculty').map(u => u.id);
        const studentIds = userRows.filter(u => u.role === 'student').map(u => u.id);

        // ==================== 3. CLASSROOMS (10 classrooms) ====================
        const classrooms = [
            { name: 'A-101', building: 'A Blok', room_number: '101', capacity: 60, latitude: 41.0082, longitude: 28.9784 },
            { name: 'A-102', building: 'A Blok', room_number: '102', capacity: 40, latitude: 41.0083, longitude: 28.9785 },
            { name: 'A-201', building: 'A Blok', room_number: '201', capacity: 80, latitude: 41.0084, longitude: 28.9786 },
            { name: 'B-101', building: 'B Blok', room_number: '101', capacity: 50, latitude: 41.0085, longitude: 28.9787 },
            { name: 'B-102', building: 'B Blok', room_number: '102', capacity: 50, latitude: 41.0086, longitude: 28.9788 },
            { name: 'B-201', building: 'B Blok', room_number: '201', capacity: 100, latitude: 41.0087, longitude: 28.9789 },
            { name: 'Lab-1', building: 'Laboratuvar Binası', room_number: 'L1', capacity: 30, latitude: 41.0088, longitude: 28.9790 },
            { name: 'Lab-2', building: 'Laboratuvar Binası', room_number: 'L2', capacity: 30, latitude: 41.0089, longitude: 28.9791 },
            { name: 'Amfi-1', building: 'Merkez Bina', room_number: 'Amfi-1', capacity: 200, latitude: 41.0090, longitude: 28.9792 },
            { name: 'Amfi-2', building: 'Merkez Bina', room_number: 'Amfi-2', capacity: 150, latitude: 41.0091, longitude: 28.9793 }
        ].map(c => ({ ...c, created_at: now, updated_at: now }));

        await queryInterface.bulkInsert('classrooms', classrooms, {});
        console.log('✅ Classrooms created');

        // Get classroom IDs
        const classroomRows = await queryInterface.sequelize.query(
            `SELECT id, name FROM classrooms ORDER BY id`,
            { type: Sequelize.QueryTypes.SELECT }
        );
        const classroomMap = {};
        classroomRows.forEach(c => { classroomMap[c.name] = c.id; });

        // ==================== 4. COURSES (5 per department = 25 total) ====================
        const coursesData = [
            // CENG
            { code: 'CENG101', name: 'Bilgisayar Mühendisliğine Giriş', credits: 3, ects: 5, dept: 'CENG', weekly_hours: 3 },
            { code: 'CENG201', name: 'Veri Yapıları', credits: 4, ects: 6, dept: 'CENG', weekly_hours: 4 },
            { code: 'CENG301', name: 'Algoritmalar', credits: 4, ects: 6, dept: 'CENG', weekly_hours: 4 },
            { code: 'CENG302', name: 'Veritabanı Sistemleri', credits: 3, ects: 5, dept: 'CENG', weekly_hours: 3 },
            { code: 'CENG401', name: 'Yazılım Mühendisliği', credits: 3, ects: 5, dept: 'CENG', weekly_hours: 3 },
            // EEE
            { code: 'EEE101', name: 'Elektrik Devrelerine Giriş', credits: 3, ects: 5, dept: 'EEE', weekly_hours: 3 },
            { code: 'EEE201', name: 'Elektronik I', credits: 4, ects: 6, dept: 'EEE', weekly_hours: 4 },
            { code: 'EEE202', name: 'Elektronik II', credits: 4, ects: 6, dept: 'EEE', weekly_hours: 4 },
            { code: 'EEE301', name: 'Sinyal ve Sistemler', credits: 3, ects: 5, dept: 'EEE', weekly_hours: 3 },
            { code: 'EEE401', name: 'Kontrol Sistemleri', credits: 3, ects: 5, dept: 'EEE', weekly_hours: 3 },
            // ME
            { code: 'ME101', name: 'Mühendislik Mekaniği', credits: 3, ects: 5, dept: 'ME', weekly_hours: 3 },
            { code: 'ME201', name: 'Termodinamik', credits: 4, ects: 6, dept: 'ME', weekly_hours: 4 },
            { code: 'ME202', name: 'Akışkanlar Mekaniği', credits: 4, ects: 6, dept: 'ME', weekly_hours: 4 },
            { code: 'ME301', name: 'Makine Elemanları', credits: 3, ects: 5, dept: 'ME', weekly_hours: 3 },
            { code: 'ME401', name: 'Üretim Yöntemleri', credits: 3, ects: 5, dept: 'ME', weekly_hours: 3 },
            // IE
            { code: 'IE101', name: 'Endüstri Mühendisliğine Giriş', credits: 2, ects: 4, dept: 'IE', weekly_hours: 2 },
            { code: 'IE201', name: 'Yöneylem Araştırması I', credits: 3, ects: 5, dept: 'IE', weekly_hours: 3 },
            { code: 'IE202', name: 'Yöneylem Araştırması II', credits: 3, ects: 5, dept: 'IE', weekly_hours: 3 },
            { code: 'IE301', name: 'Simülasyon', credits: 3, ects: 5, dept: 'IE', weekly_hours: 3 },
            { code: 'IE401', name: 'Proje Yönetimi', credits: 3, ects: 5, dept: 'IE', weekly_hours: 3 },
            // MATH
            { code: 'MATH101', name: 'Matematik I', credits: 4, ects: 7, dept: 'MATH', weekly_hours: 4 },
            { code: 'MATH102', name: 'Matematik II', credits: 4, ects: 7, dept: 'MATH', weekly_hours: 4 },
            { code: 'MATH201', name: 'Lineer Cebir', credits: 3, ects: 5, dept: 'MATH', weekly_hours: 3 },
            { code: 'MATH202', name: 'Diferansiyel Denklemler', credits: 3, ects: 5, dept: 'MATH', weekly_hours: 3 },
            { code: 'MATH301', name: 'Olasılık ve İstatistik', credits: 3, ects: 5, dept: 'MATH', weekly_hours: 3 }
        ];

        const courses = coursesData.map(c => ({
            code: c.code,
            name: c.name,
            description: `${c.name} dersi açıklaması`,
            credits: c.credits,
            ects: c.ects,
            weekly_hours: c.weekly_hours,
            department_id: deptMap[c.dept],
            created_at: now,
            updated_at: now
        }));

        await queryInterface.bulkInsert('courses', courses, {});
        console.log('✅ Courses created (25 courses)');

        // Get course IDs
        const courseRows = await queryInterface.sequelize.query(
            `SELECT id, code FROM courses ORDER BY id`,
            { type: Sequelize.QueryTypes.SELECT }
        );
        const courseMap = {};
        courseRows.forEach(c => { courseMap[c.code] = c.id; });

        // ==================== 5. COURSE SECTIONS (2 per course = 50 total) ====================
        const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
        const times = [
            { start: '09:00', end: '12:00' },
            { start: '13:00', end: '16:00' },
            { start: '16:00', end: '19:00' }
        ];

        const sections = [];
        let dayIndex = 0;
        let timeIndex = 0;
        let classroomIndex = 0;

        coursesData.forEach((course, courseIdx) => {
            // 2 sections per course
            for (let sectionNum = 1; sectionNum <= 2; sectionNum++) {
                const instructorId = facultyIds[courseIdx % facultyIds.length];
                const classroomId = classroomRows[classroomIndex % classroomRows.length].id;

                const schedule = [{
                    day: days[dayIndex % days.length],
                    start: times[timeIndex % times.length].start,
                    end: times[timeIndex % times.length].end,
                    room_id: classroomId
                }];

                sections.push({
                    course_id: courseMap[course.code],
                    section_number: sectionNum,
                    semester: '2024-FALL',
                    instructor_id: instructorId,
                    capacity: 30,
                    enrolled_count: 0,
                    schedule: JSON.stringify(schedule),
                    created_at: now,
                    updated_at: now
                });

                dayIndex++;
                timeIndex++;
                classroomIndex++;
            }
        });

        await queryInterface.bulkInsert('course_sections', sections, {});
        console.log('✅ Course sections created (50 sections)');

        // Get section IDs
        const sectionRows = await queryInterface.sequelize.query(
            `SELECT id, course_id, section_number FROM course_sections ORDER BY id`,
            { type: Sequelize.QueryTypes.SELECT }
        );

        // ==================== 6. ENROLLMENTS (5 courses per student) ====================
        const enrollments = [];
        const enrollmentCounts = {}; // Track enrolled_count per section

        studentIds.forEach((studentId, studentIdx) => {
            // Each student enrolls in 5 different sections
            const startSectionIdx = (studentIdx * 3) % sectionRows.length;
            for (let i = 0; i < 5; i++) {
                const section = sectionRows[(startSectionIdx + i) % sectionRows.length];

                // Track enrollments
                if (!enrollmentCounts[section.id]) enrollmentCounts[section.id] = 0;
                if (enrollmentCounts[section.id] >= 30) continue; // Skip if full

                enrollmentCounts[section.id]++;

                enrollments.push({
                    student_id: studentId,
                    section_id: section.id,
                    status: 'ACTIVE',
                    enrollment_date: now,
                    absence_hours_used: 0,
                    absence_limit: 14,
                    created_at: now,
                    updated_at: now
                });
            }
        });

        await queryInterface.bulkInsert('enrollments', enrollments, {});
        console.log('✅ Enrollments created');

        // Update enrolled_count in course_sections
        for (const [sectionId, count] of Object.entries(enrollmentCounts)) {
            await queryInterface.sequelize.query(
                `UPDATE course_sections SET enrolled_count = ${count} WHERE id = ${sectionId}`
            );
        }
        console.log('✅ Enrollment counts updated');

        console.log('\n🎉 SEED DATA COMPLETE!');
        console.log('==================================');
        console.log('📌 Test Hesapları (Şifre: Campus123!)');
        console.log('----------------------------------');
        console.log('Admin: admin@smartcampus.edu.tr');
        console.log('Hoca:  ahmet.yildiz@smartcampus.edu.tr');
        console.log('Öğrenci: ali.veli@student.smartcampus.edu.tr');
        console.log('==================================\n');
    },

    async down(queryInterface, Sequelize) {
        // Delete in reverse order of creation
        await queryInterface.bulkDelete('enrollments', null, {});
        await queryInterface.bulkDelete('course_sections', null, {});
        await queryInterface.bulkDelete('courses', null, {});
        await queryInterface.bulkDelete('classrooms', null, {});
        await queryInterface.bulkDelete('users', null, {});
        await queryInterface.bulkDelete('departments', null, {});
        console.log('All seed data removed');
    }
};
