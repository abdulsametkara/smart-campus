'use strict';
const { Course, CourseSection, User, Enrollment, Department, Classroom, AttendanceSession, AttendanceRecord, Student, Faculty, SystemSetting } = require('../../models');
const { Op } = require('sequelize');
const sequelize = require('../../models').sequelize;
const prerequisiteService = require('../services/prerequisite.service');
const scheduleConflictService = require('../services/scheduleConflict.service');

// Get all sections with course and instructor info
exports.getAllSections = async (req, res) => {
    try {
        const { course_id, semester, instructor_id, page = 1, limit = 20 } = req.query;
        const userRole = req.user?.role;
        const userId = req.user?.id;

        // Build where clause
        const where = {};
        if (course_id) where.course_id = course_id;
        if (semester) where.semester = semester;
        if (instructor_id) where.instructor_id = instructor_id;

        // Role-based filtering by DEPARTMENT
        // Students: see all sections from their department's courses
        if (userRole === 'student') {
            const studentProfile = await Student.findOne({ where: { user_id: userId } });
            if (studentProfile) {
                // Get all courses from student's department
                const deptCourses = await Course.findAll({
                    where: { department_id: studentProfile.department_id },
                    attributes: ['id']
                });
                const deptCourseIds = deptCourses.map(c => c.id);
                where.course_id = { [Op.in]: deptCourseIds.length > 0 ? deptCourseIds : [0] };
            }
        }

        // Faculty: see all sections from their department's courses
        if (userRole === 'faculty') {
            const facultyProfile = await Faculty.findOne({ where: { user_id: userId } });
            if (facultyProfile) {
                const deptCourses = await Course.findAll({
                    where: { department_id: facultyProfile.department_id },
                    attributes: ['id']
                });
                const deptCourseIds = deptCourses.map(c => c.id);
                where.course_id = { [Op.in]: deptCourseIds.length > 0 ? deptCourseIds : [0] };
            }
        }

        // Pagination
        const offset = (parseInt(page) - 1) * parseInt(limit);
        const limitNum = parseInt(limit);

        // Get sections with pagination
        const { count, rows: sections } = await CourseSection.findAndCountAll({
            where,
            include: [
                {
                    model: Course,
                    as: 'course',
                    attributes: ['id', 'code', 'name', 'credits', 'ects', 'department_id'],
                    include: [
                        { model: Department, as: 'department', attributes: ['id', 'name', 'code'] }
                    ]
                },
                {
                    model: User,
                    as: 'instructor',
                    attributes: ['id', 'full_name', 'email']
                }
            ],
            order: [['section_number', 'ASC']],
            limit: limitNum,
            offset: offset
        });

        // Add capacity info
        const sectionsWithCapacity = sections.map(section => ({
            ...section.toJSON(),
            available_spots: section.capacity - section.enrolled_count,
            is_full: section.enrolled_count >= section.capacity
        }));

        res.json({
            sections: sectionsWithCapacity,
            pagination: {
                page: parseInt(page),
                limit: limitNum,
                total: count,
                totalPages: Math.ceil(count / limitNum)
            }
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// Assign instructor to a section
exports.assignInstructor = async (req, res) => {
    try {
        const { sectionId } = req.params;
        const { instructorId } = req.body;

        const section = await CourseSection.findByPk(sectionId, {
            include: [{ model: Course, as: 'course', attributes: ['department_id'] }]
        });
        if (!section) return res.status(404).json({ message: 'Section not found' });

        // Verify user is faculty
        const instructor = await User.findOne({ where: { id: instructorId, role: 'faculty' } });
        if (!instructor) return res.status(400).json({ message: 'User is not a faculty member' });

        // Verify faculty belongs to the same department as the course
        const facultyProfile = await Faculty.findOne({ where: { user_id: instructorId } });
        if (facultyProfile && section.course && facultyProfile.department_id !== section.course.department_id) {
            return res.status(403).json({ message: 'Bu öğretim üyesi bu bölümün dersine atanamaz. Öğretim üyesi sadece kendi bölümündeki derslere atanabilir.' });
        }

        section.instructor_id = instructorId;
        await section.save();

        res.json({ message: 'Instructor assigned successfully', section });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// Enroll a student to a section
exports.enrollStudent = async (req, res) => {
    try {
        const { sectionId } = req.params;
        const { email } = req.body; // Assign by email for ease

        const section = await CourseSection.findByPk(sectionId);
        if (!section) return res.status(404).json({ message: 'Section not found' });

        const student = await User.findOne({ where: { email, role: 'student' } });
        if (!student) return res.status(404).json({ message: 'Student not found or not a student role' });

        // Check if already enrolled
        const existing = await Enrollment.findOne({
            where: { student_id: student.id, section_id: sectionId }
        });

        if (existing) {
            if (existing.status !== 'ACTIVE') {
                existing.status = 'ACTIVE';
                await existing.save();
                return res.json({ message: 'Student re-enrolled successfully' });
            }
            return res.status(400).json({ message: 'Student already enrolled' });
        }

        await Enrollment.create({
            student_id: student.id,
            section_id: sectionId,
            status: 'ACTIVE'
        });

        res.json({ message: 'Student enrolled successfully', student });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// Get section by ID with all details
exports.getSectionById = async (req, res) => {
    try {
        const { id } = req.params;

        const section = await CourseSection.findByPk(id, {
            include: [
                {
                    model: Course,
                    as: 'course',
                    include: [
                        { model: Department, as: 'department', attributes: ['id', 'name', 'code'] },
                        {
                            model: Course,
                            as: 'Prerequisites',
                            attributes: ['id', 'code', 'name', 'credits'],
                            through: { attributes: [] }
                        }
                    ]
                },
                {
                    model: User,
                    as: 'instructor',
                    attributes: ['id', 'full_name', 'email', 'phone_number']
                },
                {
                    model: Enrollment,
                    as: 'enrollments',
                    where: { status: 'ACTIVE' },
                    required: false,
                    include: [
                        {
                            model: User,
                            as: 'student',
                            attributes: ['id', 'full_name', 'email', 'student_number']
                        }
                    ]
                },
                {
                    model: AttendanceSession,
                    as: 'sessions',
                    required: false,
                    attributes: ['id', 'start_time', 'end_time', 'status'],
                    order: [['start_time', 'DESC']],
                    limit: 10
                }
            ]
        });

        if (!section) {
            return res.status(404).json({ message: 'Section not found' });
        }

        // Enrich schedule with classroom info if room_id exists
        let enrichedSchedule = section.schedule;
        if (section.schedule && Array.isArray(section.schedule)) {
            const roomIds = section.schedule
                .map(s => s.room_id)
                .filter(id => id != null);

            if (roomIds.length > 0) {
                const classrooms = await Classroom.findAll({
                    where: { id: { [Op.in]: roomIds } },
                    attributes: ['id', 'name', 'building', 'room_number']
                });

                const classroomMap = {};
                classrooms.forEach(c => { classroomMap[c.id] = c.toJSON(); });

                enrichedSchedule = section.schedule.map(s => ({
                    ...s,
                    classroom: s.room_id ? classroomMap[s.room_id] : null
                }));
            }
        }

        const sectionData = section.toJSON();
        sectionData.schedule = enrichedSchedule;
        sectionData.available_spots = section.capacity - section.enrolled_count;
        sectionData.is_full = section.enrolled_count >= section.capacity;

        res.json(sectionData);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// Create new section
exports.createSection = async (req, res) => {
    try {
        const { course_id, section_number, semester, instructor_id, capacity, schedule } = req.body;
        const userRole = req.user.role;

        // Validate required fields
        if (!course_id || !section_number || !semester || !instructor_id || !capacity) {
            return res.status(400).json({
                message: 'Missing required fields: course_id, section_number, semester, instructor_id, capacity'
            });
        }

        // Validate capacity
        if (capacity <= 0 || !Number.isInteger(capacity)) {
            return res.status(400).json({ message: 'Capacity must be a positive integer' });
        }

        // Validate section_number
        if (section_number <= 0 || !Number.isInteger(section_number)) {
            return res.status(400).json({ message: 'Section number must be a positive integer' });
        }

        // Check if course exists
        const course = await Course.findByPk(course_id);
        if (!course) {
            return res.status(404).json({ message: 'Course not found' });
        }

        // Check if instructor exists and is faculty
        const instructor = await User.findOne({
            where: { id: instructor_id, role: 'faculty' }
        });
        if (!instructor) {
            return res.status(400).json({ message: 'Invalid instructor. User must be a faculty member' });
        }

        // Check for duplicate section (same course_id, section_number, semester)
        const existing = await CourseSection.findOne({
            where: {
                course_id,
                section_number,
                semester
            }
        });
        if (existing) {
            return res.status(409).json({
                message: `Section ${section_number} already exists for course ${course.code} in semester ${semester}`
            });
        }

        // Validate schedule format if provided
        if (schedule) {
            if (!Array.isArray(schedule)) {
                return res.status(400).json({ message: 'Schedule must be an array' });
            }

            const validDays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
            const timeRegex = /^([0-1][0-9]|2[0-3]):[0-5][0-9]$/;

            for (const item of schedule) {
                if (!item.day || !item.start || !item.end) {
                    return res.status(400).json({
                        message: 'Each schedule item must have day, start, and end fields'
                    });
                }

                if (!validDays.includes(item.day)) {
                    return res.status(400).json({
                        message: `Invalid day: ${item.day}. Must be one of: ${validDays.join(', ')}`
                    });
                }

                if (!timeRegex.test(item.start) || !timeRegex.test(item.end)) {
                    return res.status(400).json({
                        message: 'Start and end times must be in HH:MM format (24-hour)'
                    });
                }

                // Validate time logic
                const [startHour, startMin] = item.start.split(':').map(Number);
                const [endHour, endMin] = item.end.split(':').map(Number);
                const startTime = startHour * 60 + startMin;
                const endTime = endHour * 60 + endMin;

                if (endTime <= startTime) {
                    return res.status(400).json({
                        message: `End time must be after start time for ${item.day}`
                    });
                }

                // If room_id provided, validate it exists
                if (item.room_id) {
                    const classroom = await Classroom.findByPk(item.room_id);
                    if (!classroom) {
                        return res.status(404).json({
                            message: `Classroom with id ${item.room_id} not found`
                        });
                    }
                }
            }
        }

        // Create section
        const section = await CourseSection.create({
            course_id,
            section_number,
            semester,
            instructor_id,
            capacity,
            enrolled_count: 0,
            schedule: schedule || []
        });

        // Return section with related data
        const sectionWithDetails = await CourseSection.findByPk(section.id, {
            include: [
                { model: Course, as: 'course' },
                { model: User, as: 'instructor' }
            ]
        });

        res.status(201).json({
            message: 'Section created successfully',
            section: {
                ...sectionWithDetails.toJSON(),
                available_spots: sectionWithDetails.capacity,
                is_full: false
            }
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// Update section
exports.updateSection = async (req, res) => {
    try {
        const { id } = req.params;
        const { capacity, instructor_id, schedule } = req.body;
        const userRole = req.user.role;

        const section = await CourseSection.findByPk(id);
        if (!section) {
            return res.status(404).json({ message: 'Section not found' });
        }

        // Check authorization - faculty can only update their own sections
        if (userRole === 'faculty' && section.instructor_id !== req.user.id) {
            return res.status(403).json({ message: 'You can only update your own sections' });
        }

        // Update capacity if provided
        if (capacity !== undefined) {
            if (capacity <= 0 || !Number.isInteger(capacity)) {
                return res.status(400).json({ message: 'Capacity must be a positive integer' });
            }
            if (capacity < section.enrolled_count) {
                return res.status(400).json({
                    message: `Capacity cannot be less than enrolled count (${section.enrolled_count})`
                });
            }
            section.capacity = capacity;
        }

        // Update instructor if provided
        if (instructor_id !== undefined) {
            const instructor = await User.findOne({
                where: { id: instructor_id, role: 'faculty' }
            });
            if (!instructor) {
                return res.status(400).json({ message: 'Invalid instructor. User must be a faculty member' });
            }
            section.instructor_id = instructor_id;
        }

        // Update schedule if provided
        if (schedule !== undefined) {
            if (!Array.isArray(schedule)) {
                return res.status(400).json({ message: 'Schedule must be an array' });
            }

            // Validate schedule format (same as create)
            const validDays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
            const timeRegex = /^([0-1][0-9]|2[0-3]):[0-5][0-9]$/;

            for (const item of schedule) {
                if (!item.day || !item.start || !item.end) {
                    return res.status(400).json({
                        message: 'Each schedule item must have day, start, and end fields'
                    });
                }

                if (!validDays.includes(item.day)) {
                    return res.status(400).json({
                        message: `Invalid day: ${item.day}`
                    });
                }

                if (!timeRegex.test(item.start) || !timeRegex.test(item.end)) {
                    return res.status(400).json({
                        message: 'Start and end times must be in HH:MM format'
                    });
                }

                if (item.room_id) {
                    const classroom = await Classroom.findByPk(item.room_id);
                    if (!classroom) {
                        return res.status(404).json({
                            message: `Classroom with id ${item.room_id} not found`
                        });
                    }
                }
            }

            section.schedule = schedule;
        }

        await section.save();

        // Return updated section with related data
        const updatedSection = await CourseSection.findByPk(section.id, {
            include: [
                { model: Course, as: 'course' },
                { model: User, as: 'instructor' }
            ]
        });

        res.json({
            message: 'Section updated successfully',
            section: {
                ...updatedSection.toJSON(),
                available_spots: updatedSection.capacity - updatedSection.enrolled_count,
                is_full: updatedSection.enrolled_count >= updatedSection.capacity
            }
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// Delete section
exports.deleteSection = async (req, res) => {
    try {
        const { id } = req.params;

        const section = await CourseSection.findByPk(id, {
            include: [
                { model: Enrollment, as: 'enrollments' },
                { model: AttendanceSession, as: 'sessions' }
            ]
        });

        if (!section) {
            return res.status(404).json({ message: 'Section not found' });
        }

        // Check if section has active enrollments
        const activeEnrollments = section.enrollments.filter(e => e.status === 'ACTIVE');
        if (activeEnrollments.length > 0) {
            return res.status(400).json({
                message: `Cannot delete section with ${activeEnrollments.length} active enrollments. Please drop all students first.`
            });
        }

        // Check if section has attendance sessions
        if (section.sessions && section.sessions.length > 0) {
            return res.status(400).json({
                message: 'Cannot delete section with attendance sessions. Consider archiving instead.'
            });
        }

        await section.destroy();

        res.json({ message: 'Section deleted successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// Get students in a section
// Get students in a section
exports.getSectionStudents = async (req, res) => {
    try {
        const { sectionId } = req.params;

        // Access Control for Faculty
        if (req.user.role === 'faculty') {
            const section = await CourseSection.findByPk(sectionId);
            if (!section) return res.status(404).json({ message: 'Section not found' });
            if (section.instructor_id !== req.user.id) {
                return res.status(403).json({ message: 'Forbidden: You are not the instructor of this section' });
            }
        }

        const enrollments = await Enrollment.findAll({
            where: { section_id: sectionId, status: 'ACTIVE' },
            include: [
                {
                    model: User,
                    as: 'student',
                    attributes: ['id', 'full_name', 'email']
                }
            ]
        });

        // Try to fetch student numbers if possible (optional enhancement)
        // For now, simplify to just returning user details as student
        const students = await Promise.all(enrollments.map(async e => {
            const usr = e.student.toJSON();
            // Manually fetch student profile for number
            const profile = await Student.findOne({ where: { user_id: usr.id } });
            return { ...usr, student_number: profile ? profile.student_number : '' };
        }));

        res.json(students);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// ==================== ENROLLMENT ENDPOINTS ====================

// Enroll student to a section (Student)
exports.enrollToSection = async (req, res) => {
    const transaction = await sequelize.transaction();

    try {
        const { section_id } = req.body;
        const studentId = req.user.id;

        // Verify user is a student
        if (req.user.role !== 'student') {
            await transaction.rollback();
            return res.status(403).json({ message: 'Only students can enroll in courses' });
        }

        // Get section with course info
        const section = await CourseSection.findByPk(section_id, {
            include: [{
                model: Course,
                as: 'course',
                attributes: ['id', 'code', 'name']
            }],
            transaction
        });

        if (!section) {
            await transaction.rollback();
            return res.status(404).json({ message: 'Section not found' });
        }

        // Check if enrollment is open
        const enrollmentSetting = await SystemSetting.findOne({ where: { key: 'enrollment_open' }, transaction });
        const isEnrollmentOpen = enrollmentSetting ? enrollmentSetting.value === 'true' : true; // Default true if not set

        if (!isEnrollmentOpen) {
            await transaction.rollback();
            return res.status(403).json({ message: 'Ders seçim dönemi şu anda kapalıdır.' });
        }

        // 0. Check department (students can only enroll in their department's courses)
        const studentProfile = await Student.findOne({ where: { user_id: studentId }, transaction });
        if (studentProfile && section.course) {
            const course = await Course.findByPk(section.course_id, { attributes: ['department_id'], transaction });
            if (course && studentProfile.department_id !== course.department_id) {
                await transaction.rollback();
                return res.status(403).json({
                    message: 'Bu ders sizin bölümünüze ait değil. Sadece kendi bölümünüzdeki derslere kayıt olabilirsiniz.'
                });
            }
        }

        // 1. Check if already enrolled
        // 1. Check if already enrolled
        const existingEnrollment = await Enrollment.findOne({
            where: {
                student_id: studentId,
                section_id: section_id
            },
            transaction
        });

        if (existingEnrollment) {
            if (existingEnrollment.status === 'ACTIVE') {
                await transaction.rollback();
                return res.status(400).json({ message: 'You are already enrolled in this section' });
            }
            if (existingEnrollment.status === 'PENDING') {
                await transaction.rollback();
                return res.status(400).json({ message: 'Enrollment is already pending approval' });
            }
        }

        // 2. Check prerequisites
        const prereqCheck = await prerequisiteService.checkPrerequisites(studentId, section.course_id);
        if (!prereqCheck.valid) {
            await transaction.rollback();
            return res.status(400).json({
                message: 'Prerequisites not met',
                missing_prerequisites: prereqCheck.missing
            });
        }

        // 3. Check schedule conflict
        const conflictCheck = await scheduleConflictService.checkConflict(studentId, section_id);
        if (conflictCheck.hasConflict) {
            await transaction.rollback();
            return res.status(400).json({
                message: 'Schedule conflict detected',
                conflicts: conflictCheck.conflicts
            });
        }

        // 4. Check capacity (Atomic increment)
        const [affectedRows] = await CourseSection.update(
            { enrolled_count: sequelize.literal('enrolled_count + 1') },
            {
                where: {
                    id: section_id,
                    enrolled_count: { [Op.lt]: sequelize.col('capacity') }
                },
                transaction
            }
        );

        if (affectedRows === 0) {
            await transaction.rollback();
            return res.status(400).json({ message: 'Section is full' });
        }

        // 5. Create enrollment (PENDING for advisor approval)
        // 5. Create or Update enrollment (PENDING for advisor approval)
        let enrollment;
        if (existingEnrollment) {
            enrollment = await existingEnrollment.update({
                status: 'PENDING',
                enrollment_date: new Date(),
                rejection_reason: null,
                approved_by: null,
                approved_at: null
            }, { transaction });
        } else {
            enrollment = await Enrollment.create({
                student_id: studentId,
                section_id: section_id,
                status: 'PENDING',
                enrollment_date: new Date()
            }, { transaction });
        }

        await transaction.commit();

        // Get enrollment with details
        const enrollmentWithDetails = await Enrollment.findByPk(enrollment.id, {
            include: [
                {
                    model: CourseSection,
                    as: 'section',
                    include: [{
                        model: Course,
                        as: 'course'
                    }]
                }
            ]
        });

        res.status(201).json({
            message: 'Successfully enrolled in section',
            enrollment: enrollmentWithDetails
        });
    } catch (error) {
        await transaction.rollback();
        console.error(error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// Get student's enrollments
exports.getMyEnrollments = async (req, res) => {
    try {
        const studentId = req.user.id;

        if (req.user.role !== 'student') {
            return res.status(403).json({ message: 'Only students can view their enrollments' });
        }

        const enrollments = await Enrollment.findAll({
            where: { student_id: studentId },
            include: [
                {
                    model: CourseSection,
                    as: 'section',
                    include: [
                        {
                            model: Course,
                            as: 'course',
                            include: [{
                                model: Department,
                                as: 'department',
                                attributes: ['id', 'name', 'code']
                            }]
                        },
                        {
                            model: User,
                            as: 'instructor',
                            attributes: ['id', 'full_name', 'email']
                        }
                    ]
                }
            ],
            order: [['enrollment_date', 'DESC']]
        });

        // Add attendance statistics for each enrollment
        const enrollmentsWithStats = await Promise.all(
            enrollments.map(async (enrollment) => {
                const sectionId = enrollment.section_id;

                // Get attendance records for this enrollment
                const attendanceRecords = await AttendanceRecord.findAll({
                    where: {
                        student_id: studentId
                    },
                    include: [{
                        model: AttendanceSession,
                        as: 'session',
                        where: { section_id: sectionId },
                        required: true,
                        attributes: []
                    }]
                });

                const totalSessions = await AttendanceSession.count({
                    where: { section_id: sectionId }
                });

                const presentCount = attendanceRecords.filter(r => r.status === 'PRESENT').length;
                const absentCount = attendanceRecords.filter(r => r.status === 'ABSENT').length;
                const excusedCount = attendanceRecords.filter(r => r.status === 'EXCUSED').length;

                return {
                    ...enrollment.toJSON(),
                    attendance_stats: {
                        total_sessions: totalSessions,
                        present: presentCount,
                        absent: absentCount,
                        excused: excusedCount,
                        attendance_percentage: totalSessions > 0
                            ? Math.round((presentCount / totalSessions) * 100)
                            : 0
                    }
                };
            })
        );

        res.json({ enrollments: enrollmentsWithStats });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// Drop course (Student)
exports.dropEnrollment = async (req, res) => {
    const transaction = await sequelize.transaction();

    try {
        const { id } = req.params;
        const studentId = req.user.id;

        if (req.user.role !== 'student') {
            await transaction.rollback();
            return res.status(403).json({ message: 'Only students can drop courses' });
        }

        // Get enrollment
        const enrollment = await Enrollment.findByPk(id, {
            include: [{
                model: CourseSection,
                as: 'section',
                attributes: ['id', 'enrolled_count']
            }],
            transaction
        });

        if (!enrollment) {
            await transaction.rollback();
            return res.status(404).json({ message: 'Enrollment not found' });
        }

        // Verify ownership
        if (enrollment.student_id !== studentId) {
            await transaction.rollback();
            return res.status(403).json({ message: 'You can only drop your own enrollments' });
        }

        // Check if already dropped
        if (enrollment.status !== 'ACTIVE') {
            await transaction.rollback();
            return res.status(400).json({ message: 'Enrollment is already dropped or completed' });
        }

        // Update enrollment status
        enrollment.status = 'DROPPED';
        await enrollment.save({ transaction });

        // Decrement section capacity (Atomic)
        await CourseSection.update(
            { enrolled_count: sequelize.literal('enrolled_count - 1') },
            {
                where: { id: enrollment.section_id },
                transaction
            }
        );

        await transaction.commit();

        res.json({
            message: 'Successfully dropped from course',
            enrollment: enrollment
        });
    } catch (error) {
        await transaction.rollback();
        console.error(error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// ==================== COURSE ENDPOINTS ====================

// Get all courses
exports.getAllCourses = async (req, res) => {
    try {
        const { department_id, search, page = 1, limit = 20 } = req.query;
        const userRole = req.user?.role;
        const userId = req.user?.id;

        const where = {};
        if (department_id) where.department_id = department_id;
        if (search) {
            where[Op.or] = [
                { code: { [Op.iLike]: `%${search}%` } },
                { name: { [Op.iLike]: `%${search}%` } }
            ];
        }

        // Role-based filtering by DEPARTMENT
        // Students: see all courses from their department
        if (userRole === 'student') {
            const studentProfile = await Student.findOne({ where: { user_id: userId } });
            if (studentProfile) {
                where.department_id = studentProfile.department_id;
            }
        }

        // Faculty: see all courses from their department
        if (userRole === 'faculty') {
            const facultyProfile = await Faculty.findOne({ where: { user_id: userId } });
            if (facultyProfile) {
                where.department_id = facultyProfile.department_id;
            }
        }

        const offset = (parseInt(page) - 1) * parseInt(limit);
        const limitNum = parseInt(limit);

        const { count, rows: courses } = await Course.findAndCountAll({
            where,
            include: [
                {
                    model: Department,
                    as: 'department',
                    attributes: ['id', 'name', 'code']
                }
            ],
            order: [['code', 'ASC']],
            limit: limitNum,
            offset: offset,
            paranoid: true
        });

        res.json({
            courses,
            pagination: {
                page: parseInt(page),
                limit: limitNum,
                total: count,
                totalPages: Math.ceil(count / limitNum)
            }
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// Get course by ID
exports.getCourseById = async (req, res) => {
    try {
        const { id } = req.params;

        const course = await Course.findByPk(id, {
            include: [
                {
                    model: Department,
                    as: 'department',
                    attributes: ['id', 'name', 'code']
                },
                {
                    model: Course,
                    as: 'Prerequisites',
                    attributes: ['id', 'code', 'name', 'credits'],
                    through: { attributes: [] }
                },
                {
                    model: CourseSection,
                    as: 'sections',
                    include: [{
                        model: User,
                        as: 'instructor',
                        attributes: ['id', 'full_name', 'email']
                    }]
                }
            ],
            paranoid: true
        });

        if (!course) {
            return res.status(404).json({ message: 'Course not found' });
        }

        res.json(course);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// Create new course
exports.createCourse = async (req, res) => {
    try {
        const { code, name, description, credits, ects, department_id, syllabus_url, prerequisites } = req.body;

        // Validate required fields
        if (!code || !name || !credits || !ects || !department_id) {
            return res.status(400).json({
                message: 'Missing required fields: code, name, credits, ects, department_id'
            });
        }

        // Check if department exists
        const department = await Department.findByPk(department_id);
        if (!department) {
            return res.status(404).json({ message: 'Department not found' });
        }

        // Check if course code already exists
        const existing = await Course.findOne({
            where: { code },
            paranoid: false
        });
        if (existing) {
            return res.status(409).json({ message: `Course with code ${code} already exists` });
        }

        // Create course
        const course = await Course.create({
            code,
            name,
            description,
            credits: parseInt(credits),
            ects: parseInt(ects),
            department_id,
            syllabus_url
        });

        // Add prerequisites if provided
        if (prerequisites && Array.isArray(prerequisites) && prerequisites.length > 0) {
            const prereqCourses = await Course.findAll({
                where: { id: { [Op.in]: prerequisites } }
            });

            if (prereqCourses.length !== prerequisites.length) {
                return res.status(400).json({ message: 'Some prerequisite courses not found' });
            }

            await course.setPrerequisites(prereqCourses);
        }

        // Return course with details
        const courseWithDetails = await Course.findByPk(course.id, {
            include: [
                {
                    model: Department,
                    as: 'department'
                },
                {
                    model: Course,
                    as: 'Prerequisites',
                    attributes: ['id', 'code', 'name'],
                    through: { attributes: [] }
                }
            ]
        });

        res.status(201).json({
            message: 'Course created successfully',
            course: courseWithDetails
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// Update course
exports.updateCourse = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, description, credits, ects, department_id, syllabus_url, prerequisites } = req.body;

        const course = await Course.findByPk(id, { paranoid: true });
        if (!course) {
            return res.status(404).json({ message: 'Course not found' });
        }

        // Update fields
        if (name !== undefined) course.name = name;
        if (description !== undefined) course.description = description;
        if (credits !== undefined) course.credits = parseInt(credits);
        if (ects !== undefined) course.ects = parseInt(ects);
        if (department_id !== undefined) {
            const department = await Department.findByPk(department_id);
            if (!department) {
                return res.status(404).json({ message: 'Department not found' });
            }
            course.department_id = department_id;
        }
        if (syllabus_url !== undefined) course.syllabus_url = syllabus_url;

        await course.save();

        // Update prerequisites if provided
        if (prerequisites !== undefined) {
            if (Array.isArray(prerequisites) && prerequisites.length > 0) {
                const prereqCourses = await Course.findAll({
                    where: { id: { [Op.in]: prerequisites } }
                });

                if (prereqCourses.length !== prerequisites.length) {
                    return res.status(400).json({ message: 'Some prerequisite courses not found' });
                }

                await course.setPrerequisites(prereqCourses);
            } else {
                await course.setPrerequisites([]);
            }
        }

        // Return updated course
        const updatedCourse = await Course.findByPk(course.id, {
            include: [
                {
                    model: Department,
                    as: 'department'
                },
                {
                    model: Course,
                    as: 'Prerequisites',
                    attributes: ['id', 'code', 'name'],
                    through: { attributes: [] }
                }
            ]
        });

        res.json({
            message: 'Course updated successfully',
            course: updatedCourse
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// Delete course (Soft delete)
exports.deleteCourse = async (req, res) => {
    try {
        const { id } = req.params;

        const course = await Course.findByPk(id, {
            include: [{
                model: CourseSection,
                as: 'sections'
            }]
        });

        if (!course) {
            return res.status(404).json({ message: 'Course not found' });
        }

        // Check if course has active sections
        if (course.sections && course.sections.length > 0) {
            return res.status(400).json({
                message: 'Cannot delete course with active sections. Please delete or archive sections first.'
            });
        }

        // Soft delete
        await course.destroy();

        res.json({ message: 'Course deleted successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// ==================== DROPDOWN DATA ENDPOINTS ====================

// Get all classrooms (for dropdown)
exports.getAllClassrooms = async (req, res) => {
    try {
        const classrooms = await Classroom.findAll({
            attributes: ['id', 'name', 'building', 'room_number', 'capacity'],
            order: [['building', 'ASC'], ['name', 'ASC']]
        });
        res.json(classrooms);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// Get faculty list (for instructor dropdown)
exports.getFacultyList = async (req, res) => {
    try {
        const faculty = await User.findAll({
            where: { role: 'faculty' },
            attributes: ['id', 'full_name', 'email'],
            order: [['full_name', 'ASC']]
        });
        res.json(faculty);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// ==================== SYSTEM SETTINGS ENDPOINTS ====================
// Get system settings
exports.getSettings = async (req, res) => {
    try {
        const settings = await SystemSetting.findAll();
        const settingsMap = {};
        settings.forEach(s => {
            settingsMap[s.key] = s.value;
        });
        res.json(settingsMap);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// Update system settings (Admin only)
exports.updateSettings = async (req, res) => {
    try {
        const { key, value } = req.body;

        if (!key || value === undefined) {
            return res.status(400).json({ message: 'Key and value are required' });
        }

        let setting = await SystemSetting.findOne({ where: { key } });
        if (setting) {
            setting.value = String(value);
            await setting.save();
        } else {
            setting = await SystemSetting.create({
                key,
                value: String(value)
            });
        }

        res.json({ message: 'Setting updated successfully', setting });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// ==================== ADVISOR APPROVAL ENDPOINTS ====================

// Get pending enrollments for advisor
exports.getAdvisorPendingEnrollments = async (req, res) => {
    try {
        const advisorUserId = req.user.id;

        // Find faculty profile
        const facultyProfile = await Faculty.findOne({ where: { user_id: advisorUserId } });
        if (!facultyProfile) {
            return res.status(404).json({ message: 'Faculty profile not found' });
        }

        // Find students who have this faculty as advisor
        const adviseeStudents = await Student.findAll({
            where: { advisor_id: facultyProfile.id },
            include: [{ model: User, as: 'user', attributes: ['id', 'full_name', 'email'] }]
        });

        const studentUserIds = adviseeStudents.map(s => s.user_id);

        if (studentUserIds.length === 0) {
            return res.json([]);
        }

        // Get pending enrollments for these students
        const pendingEnrollments = await Enrollment.findAll({
            where: {
                student_id: { [Op.in]: studentUserIds },
                status: 'PENDING'
            },
            include: [
                { model: User, as: 'student', attributes: ['id', 'full_name', 'email', 'student_number'] },
                {
                    model: CourseSection,
                    as: 'section',
                    include: [
                        { model: Course, as: 'course', attributes: ['id', 'code', 'name', 'credits'] },
                        { model: User, as: 'instructor', attributes: ['id', 'full_name'] }
                    ]
                }
            ],
            order: [['enrollment_date', 'DESC']]
        });

        res.json(pendingEnrollments);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// Approve enrollment (Advisor)
exports.approveEnrollment = async (req, res) => {
    try {
        const { id } = req.params;
        const advisorUserId = req.user.id;

        const enrollment = await Enrollment.findByPk(id, {
            include: [
                { model: User, as: 'student' },
                { model: CourseSection, as: 'section', include: [{ model: Course, as: 'course' }] }
            ]
        });

        if (!enrollment) {
            return res.status(404).json({ message: 'Enrollment not found' });
        }

        if (enrollment.status !== 'PENDING') {
            return res.status(400).json({ message: 'This enrollment is not pending approval' });
        }

        // Verify advisor relationship
        const facultyProfile = await Faculty.findOne({ where: { user_id: advisorUserId } });
        const studentProfile = await Student.findOne({ where: { user_id: enrollment.student_id } });

        if (!facultyProfile || !studentProfile || studentProfile.advisor_id !== facultyProfile.id) {
            return res.status(403).json({ message: 'You are not the advisor for this student' });
        }

        // Approve enrollment - set to ACTIVE for system compatibility
        enrollment.status = 'ACTIVE';
        enrollment.approved_by = advisorUserId;
        enrollment.approved_at = new Date();
        await enrollment.save();

        res.json({ message: 'Enrollment approved successfully', enrollment });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// Reject enrollment (Advisor)
exports.rejectEnrollment = async (req, res) => {
    try {
        const { id } = req.params;
        const { reason } = req.body;
        const advisorUserId = req.user.id;

        const enrollment = await Enrollment.findByPk(id, {
            include: [
                { model: User, as: 'student' },
                { model: CourseSection, as: 'section' }
            ]
        });

        if (!enrollment) {
            return res.status(404).json({ message: 'Enrollment not found' });
        }

        if (enrollment.status !== 'PENDING') {
            return res.status(400).json({ message: 'This enrollment is not pending approval' });
        }

        // Verify advisor relationship
        const facultyProfile = await Faculty.findOne({ where: { user_id: advisorUserId } });
        const studentProfile = await Student.findOne({ where: { user_id: enrollment.student_id } });

        if (!facultyProfile || !studentProfile || studentProfile.advisor_id !== facultyProfile.id) {
            return res.status(403).json({ message: 'You are not the advisor for this student' });
        }

        // Decrease enrolled count since we're rejecting
        await CourseSection.decrement('enrolled_count', {
            where: { id: enrollment.section_id }
        });

        // Reject enrollment
        enrollment.status = 'REJECTED';
        enrollment.approved_by = advisorUserId;
        enrollment.approved_at = new Date();
        enrollment.rejection_reason = reason || 'No reason provided';
        await enrollment.save();

        res.json({ message: 'Enrollment rejected', enrollment });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// Get student's advisor info
exports.getMyAdvisor = async (req, res) => {
    try {
        const userId = req.user.id;

        const studentProfile = await Student.findOne({
            where: { user_id: userId },
            include: [{
                model: Faculty,
                as: 'advisor',
                include: [
                    { model: User, as: 'user', attributes: ['id', 'full_name', 'email', 'profile_picture_url'] },
                    { model: Department, as: 'department', attributes: ['id', 'name'] }
                ]
            }]
        });

        if (!studentProfile) {
            return res.status(404).json({ message: 'Student profile not found' });
        }

        if (!studentProfile.advisor) {
            return res.json({ advisor: null, message: 'No advisor assigned' });
        }

        res.json({
            advisor: {
                id: studentProfile.advisor.id,
                title: studentProfile.advisor.title,
                name: studentProfile.advisor.user?.full_name,
                email: studentProfile.advisor.user?.email,
                profile_picture: studentProfile.advisor.user?.profile_picture_url,
                department: studentProfile.advisor.department?.name,
                office: studentProfile.advisor.office
            }
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// Get faculty's advisees (students they advise)
exports.getMyAdvisees = async (req, res) => {
    try {
        const userId = req.user.id;

        const facultyProfile = await Faculty.findOne({ where: { user_id: userId } });

        if (!facultyProfile) {
            return res.status(404).json({ message: 'Faculty profile not found' });
        }

        const advisees = await Student.findAll({
            where: { advisor_id: facultyProfile.id },
            include: [
                {
                    model: User,
                    as: 'user',
                    attributes: ['id', 'full_name', 'email', 'student_number', 'profile_picture_url']
                },
                { model: Department, as: 'department', attributes: ['id', 'name'] }
            ],
            order: [[{ model: User, as: 'user' }, 'full_name', 'ASC']]
        });

        res.json({
            count: advisees.length,
            advisees: advisees.map(s => ({
                id: s.id,
                user_id: s.user_id,
                student_number: s.user?.student_number || s.student_number,
                name: s.user?.full_name,
                email: s.user?.email,
                profile_picture: s.user?.profile_picture_url,
                department: s.department?.name,
                gpa: s.gpa,
                cgpa: s.cgpa
            }))
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};