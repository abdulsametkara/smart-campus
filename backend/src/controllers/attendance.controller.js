const { AttendanceSession, AttendanceRecord, CourseSection, Classroom } = require('../../models');
const attendanceService = require('../services/attendance.service');
const crypto = require('crypto');

exports.createSession = async (req, res) => {
    try {
        const { section_id, duration_minutes, radius, latitude, longitude } = req.body;
        const instructor_id = req.user.id; // From Auth Middleware

        // Verify Instructor teaches this section
        const section = await CourseSection.findOne({ where: { id: section_id, instructor_id } });
        if (!section) {
            return res.status(403).json({ message: 'Not authorized for this section' });
        }

        // Generate QR Code content (Unique Hash)
        const qr_string = crypto.randomBytes(16).toString('hex');

        const start_time = new Date();
        const end_time = new Date(start_time.getTime() + (duration_minutes || 60) * 60000);

        // If lat/lon not provided, try to get from Classroom linked to schedule (Complex, skipped for now or fetch manually)
        // For now, assume simplified flow: Instructor sends lat/lon (dynamic) or we pick from body
        // If body is empty, default to 0,0 (Should be handled by frontend sending classroom coords)

        const session = await AttendanceSession.create({
            section_id,
            instructor_id,
            start_time,
            end_time,
            latitude: latitude || 0,
            longitude: longitude || 0,
            radius: radius || 15,
            qr_code: qr_string,
            status: 'ACTIVE'
        });

        res.status(201).json({
            message: 'Attendance session started',
            session_id: session.id,
            qr_code: qr_string,
            expires_at: end_time
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

exports.checkIn = async (req, res) => {
    try {
        const { session_id, latitude, longitude, qr_code, accuracy } = req.body;
        const student_id = req.user.id;

        // Find session by ID or by QR code
        let session;
        if (session_id) {
            session = await AttendanceSession.findByPk(session_id);
        } else if (qr_code) {
            session = await AttendanceSession.findOne({ where: { qr_code } });
        }

        if (!session) {
            return res.status(404).json({ message: 'Oturum bulunamadı' });
        }

        // Use Service for Validation Logic (with accuracy for spoofing detection)
        const validation = await attendanceService.validateCheckIn(session, student_id, latitude, longitude, qr_code, accuracy || 10);

        if (!validation.valid) {
            // Don't create record on failed attempt - allow student to retry
            // Just log for monitoring purposes
            if (validation.isFlagged) {
                console.log(`[SPOOFING] Student ${student_id} flagged: ${validation.flagReason}`);
            }
            return res.status(400).json({ message: validation.reason });
        }

        // Create Successful Record
        await AttendanceRecord.create({
            session_id: session.id,
            student_id,
            latitude,
            longitude,
            distance_from_center: validation.distance,
            status: 'PRESENT',
            is_flagged: false
        });

        res.status(200).json({ message: 'Check-in successful' });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

exports.getMyAttendance = async (req, res) => {
    try {
        const student_id = req.user.id;
        const { Enrollment, User, Course } = require('../../models');
        const { Op } = require('sequelize');

        // Get all enrollments for this student with course info
        const enrollments = await Enrollment.findAll({
            where: { student_id, status: 'ACTIVE' },
            include: [{
                model: CourseSection,
                as: 'section',
                include: [{ model: Course, as: 'course' }]
            }]
        });

        // For each enrollment, count attendance records
        const stats = await Promise.all(enrollments.map(async (enrollment) => {
            // Get all closed sessions for this section
            const closedSessions = await AttendanceSession.findAll({
                where: { section_id: enrollment.section_id, status: 'CLOSED' },
                attributes: ['id']
            });
            const sessionIds = closedSessions.map(s => s.id);
            const totalSessions = sessionIds.length;

            // Count sessions where student was present
            let attendedSessions = 0;
            if (sessionIds.length > 0) {
                attendedSessions = await AttendanceRecord.count({
                    where: {
                        student_id,
                        status: 'PRESENT',
                        session_id: { [Op.in]: sessionIds }
                    }
                });
            }

            const percent = totalSessions > 0 ? Math.round((attendedSessions / totalSessions) * 100) : 100;

            return {
                section_id: enrollment.section_id,
                course_code: enrollment.section?.course?.code,
                course_name: enrollment.section?.course?.name,
                attended: attendedSessions,
                total: totalSessions,
                percent: Math.min(percent, 100), // Cap at 100%
                absence_hours_used: enrollment.absence_hours_used || 0,
                absence_limit: enrollment.absence_limit || 8,
                weekly_hours: enrollment.section?.course?.weekly_hours || 2
            };
        }));

        res.json(stats);

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// Get student's absent sessions (for excuse request)
exports.getMyAbsences = async (req, res) => {
    try {
        const student_id = req.user.id;
        const { Enrollment, Course, ExcuseRequest } = require('../../models');
        const { Op } = require('sequelize');

        // Get student's enrollments
        const enrollments = await Enrollment.findAll({
            where: { student_id, status: 'ACTIVE' },
            include: [{
                model: CourseSection,
                as: 'section',
                include: [{ model: Course, as: 'course' }]
            }]
        });

        const sectionIds = enrollments.map(e => e.section_id);

        // Get all closed sessions for enrolled sections
        const allSessions = await AttendanceSession.findAll({
            where: {
                section_id: { [Op.in]: sectionIds },
                status: 'CLOSED'
            },
            include: [{
                model: CourseSection,
                as: 'section',
                include: [{ model: Course, as: 'course' }]
            }],
            order: [['start_time', 'DESC']]
        });

        // Get sessions where student was absent
        const absentSessions = [];
        for (const session of allSessions) {
            const attendanceRecord = await AttendanceRecord.findOne({
                where: { session_id: session.id, student_id, status: 'PRESENT' }
            });

            // Check if already has excuse request
            const existingExcuse = await ExcuseRequest.findOne({
                where: { session_id: session.id, student_id }
            });

            // If not present and no excuse request yet
            if (!attendanceRecord && !existingExcuse) {
                absentSessions.push({
                    id: session.id,
                    date: session.start_time,
                    course_code: session.section?.course?.code,
                    course_name: session.section?.course?.name,
                    section_number: session.section?.section_number
                });
            }
        }

        res.json(absentSessions);

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// Get active session for instructor (to persist on page refresh)
exports.getActiveSession = async (req, res) => {
    try {
        const instructor_id = req.user.id;

        const session = await AttendanceSession.findOne({
            where: { instructor_id, status: 'ACTIVE' },
            include: [{
                model: CourseSection,
                as: 'section',
                include: [{ model: require('../../models').Course, as: 'course' }]
            }],
            order: [['created_at', 'DESC']]
        });

        if (!session) {
            return res.json({ active: false });
        }

        res.json({
            active: true,
            session_id: session.id,
            qr_code: session.qr_code,
            expires_at: session.end_time,
            section_id: session.section_id,
            course_name: session.section?.course?.name,
            course_code: session.section?.course?.code
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// Get attendance report for a session (for instructor)
exports.getSessionReport = async (req, res) => {
    try {
        const { sessionId } = req.params;
        const instructor_id = req.user.id;

        const session = await AttendanceSession.findByPk(sessionId, {
            include: [{
                model: CourseSection,
                as: 'section',
                include: [{ model: require('../../models').Course, as: 'course' }]
            }]
        });

        if (!session) {
            return res.status(404).json({ message: 'Session not found' });
        }

        if (session.instructor_id !== instructor_id) {
            return res.status(403).json({ message: 'Not authorized' });
        }

        // Get all enrolled students for this section
        const { Enrollment, User } = require('../../models');
        const enrollments = await Enrollment.findAll({
            where: { section_id: session.section_id, status: 'ACTIVE' },
            include: [{ model: User, as: 'student', attributes: ['id', 'full_name', 'email'] }]
        });

        // Get attendance records for this session
        const records = await AttendanceRecord.findAll({
            where: { session_id: sessionId }
        });

        const recordMap = {};
        records.forEach(r => { recordMap[r.student_id] = r; });

        // Build report
        const report = enrollments.map(enrollment => {
            const record = recordMap[enrollment.student_id];
            return {
                student_id: enrollment.student_id,
                student_name: enrollment.student?.full_name,
                student_email: enrollment.student?.email,
                status: record ? record.status : 'NOT_CHECKED_IN',
                check_in_time: record?.check_in_time || null,
                distance: record?.distance_from_center || null,
                is_flagged: record?.is_flagged || false,
                absence_hours_used: enrollment.absence_hours_used,
                absence_limit: enrollment.absence_limit
            };
        });

        res.json({
            session: {
                id: session.id,
                course_code: session.section?.course?.code,
                course_name: session.section?.course?.name,
                start_time: session.start_time,
                end_time: session.end_time,
                status: session.status
            },
            report
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// End session and process absences
exports.endSession = async (req, res) => {
    try {
        const { sessionId } = req.params;
        const instructor_id = req.user.id;

        const session = await AttendanceSession.findByPk(sessionId, {
            include: [{
                model: CourseSection,
                as: 'section',
                include: [{ model: require('../../models').Course, as: 'course' }]
            }]
        });

        if (!session) {
            return res.status(404).json({ message: 'Session not found' });
        }

        if (session.instructor_id !== instructor_id) {
            return res.status(403).json({ message: 'Not authorized' });
        }

        if (session.status !== 'ACTIVE') {
            return res.status(400).json({ message: 'Session already ended' });
        }

        const weeklyHours = session.section?.course?.weekly_hours || 2;

        // Get all enrolled students
        const { Enrollment, User } = require('../../models');
        const enrollments = await Enrollment.findAll({
            where: { section_id: session.section_id, status: 'ACTIVE' }
        });

        // Get students who already have ANY record for this session
        const records = await AttendanceRecord.findAll({
            where: { session_id: sessionId }
        });
        const recordedStudentIds = records.map(r => r.student_id);

        // Process absences only for students without any record
        let absentCount = 0;
        for (const enrollment of enrollments) {
            if (!recordedStudentIds.includes(enrollment.student_id)) {
                // Student was absent and has no record yet
                absentCount++;

                // Create ABSENT record
                await AttendanceRecord.create({
                    session_id: session.id,
                    student_id: enrollment.student_id,
                    status: 'ABSENT',
                    is_flagged: false
                });

                // Update enrollment absence hours
                enrollment.absence_hours_used = (enrollment.absence_hours_used || 0) + weeklyHours;
                await enrollment.save();
            }
        }

        // Close session
        session.status = 'CLOSED';
        session.end_time = new Date();
        await session.save();

        res.json({
            message: 'Session ended successfully',
            absent_count: absentCount,
            hours_deducted: weeklyHours
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// Get section summary for semester report (faculty)
exports.getSectionSummary = async (req, res) => {
    try {
        const { sectionId } = req.params;
        const instructor_id = req.user.id;

        const section = await CourseSection.findByPk(sectionId, {
            include: [{ model: require('../../models').Course, as: 'course' }]
        });

        if (!section) {
            return res.status(404).json({ message: 'Şube bulunamadı' });
        }

        if (section.instructor_id !== instructor_id) {
            return res.status(403).json({ message: 'Yetkisiz işlem' });
        }

        // Get all enrollments
        const { Enrollment, User } = require('../../models');
        const enrollments = await Enrollment.findAll({
            where: { section_id: sectionId, status: 'ACTIVE' },
            include: [{ model: User, as: 'student', attributes: ['id', 'full_name', 'email'] }]
        });

        // Count total closed sessions
        const closedSessions = await AttendanceSession.findAll({
            where: { section_id: sectionId, status: 'CLOSED' },
            attributes: ['id']
        });
        const sessionIds = closedSessions.map(s => s.id);
        const totalSessions = sessionIds.length;

        // For each student, get attendance summary
        const { Op } = require('sequelize');
        const summary = await Promise.all(enrollments.map(async (enrollment) => {
            let attendedCount = 0;
            if (sessionIds.length > 0) {
                attendedCount = await AttendanceRecord.count({
                    where: {
                        student_id: enrollment.student_id,
                        status: 'PRESENT',
                        session_id: { [Op.in]: sessionIds }
                    }
                });
            }

            const percent = totalSessions > 0 ? Math.round((attendedCount / totalSessions) * 100) : 100;

            return {
                student_id: enrollment.student_id,
                student_name: enrollment.student?.full_name,
                student_email: enrollment.student?.email,
                attended: attendedCount,
                total: totalSessions,
                percent: Math.min(percent, 100),
                absence_hours_used: enrollment.absence_hours_used || 0,
                absence_limit: enrollment.absence_limit || 8,
                status: percent < 70 ? 'CRITICAL' : (percent < 80 ? 'WARNING' : 'OK')
            };
        }));

        res.json({
            section: {
                id: section.id,
                course_code: section.course?.code,
                course_name: section.course?.name,
                section_number: section.section_number
            },
            total_sessions: totalSessions,
            students: summary
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// Get instructor's sections list
exports.getMySections = async (req, res) => {
    try {
        const instructor_id = req.user.id;

        const sections = await CourseSection.findAll({
            where: { instructor_id },
            include: [{ model: require('../../models').Course, as: 'course' }]
        });

        res.json(sections.map(s => ({
            id: s.id,
            name: `${s.course?.code} - Section ${s.section_number}`,
            course_code: s.course?.code,
            course_name: s.course?.name,
            section_number: s.section_number,
            schedule: s.schedule || [], // Include schedule for timetable
            course: s.course // Include full course object for frontend compatibility
        })));

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// Student: Get attendance history with dates
exports.getMyAttendanceHistory = async (req, res) => {
    try {
        const student_id = req.user.id;
        const { Enrollment, Course } = require('../../models');

        // Get all enrollments
        const enrollments = await Enrollment.findAll({
            where: { student_id, status: 'ACTIVE' },
            include: [{
                model: CourseSection,
                as: 'section',
                include: [{ model: Course, as: 'course' }]
            }]
        });

        const history = [];

        for (const enrollment of enrollments) {
            // Get all attendance records for this student in this section's sessions
            const sessions = await AttendanceSession.findAll({
                where: { section_id: enrollment.section_id, status: 'CLOSED' },
                order: [['start_time', 'DESC']]
            });

            for (const session of sessions) {
                const record = await AttendanceRecord.findOne({
                    where: { session_id: session.id, student_id }
                });

                history.push({
                    id: session.id,
                    date: session.start_time,
                    course_code: enrollment.section?.course?.code,
                    course_name: enrollment.section?.course?.name,
                    status: record?.status || 'ABSENT',
                    check_in_time: record?.check_in_time
                });
            }
        }

        res.json(history);

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// Instructor: Get session history for a section
exports.getSessionHistory = async (req, res) => {
    try {
        const instructor_id = req.user.id;
        const { sectionId } = req.params;

        const section = await CourseSection.findByPk(sectionId, {
            include: [{ model: require('../../models').Course, as: 'course' }]
        });

        if (!section || section.instructor_id !== instructor_id) {
            return res.status(403).json({ message: 'Yetkisiz işlem' });
        }

        const sessions = await AttendanceSession.findAll({
            where: { section_id: sectionId, status: 'CLOSED' },
            order: [['start_time', 'DESC']]
        });

        const { Enrollment } = require('../../models');
        const enrollmentCount = await Enrollment.count({
            where: { section_id: sectionId, status: 'ACTIVE' }
        });

        const history = await Promise.all(sessions.map(async (session) => {
            const presentCount = await AttendanceRecord.count({
                where: { session_id: session.id, status: 'PRESENT' }
            });

            return {
                id: session.id,
                date: session.start_time,
                end_time: session.end_time,
                present_count: presentCount,
                total_students: enrollmentCount,
                attendance_rate: enrollmentCount > 0 ? Math.round((presentCount / enrollmentCount) * 100) : 0
            };
        }));

        res.json({
            section: {
                id: section.id,
                course_code: section.course?.code,
                course_name: section.course?.name
            },
            sessions: history
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// Get session details by ID
exports.getSessionById = async (req, res) => {
    try {
        const { sessionId } = req.params;
        const user_id = req.user.id;
        const user_role = req.user.role;

        const session = await AttendanceSession.findByPk(sessionId, {
            include: [{
                model: CourseSection,
                as: 'section',
                include: [{ model: require('../../models').Course, as: 'course' }]
            }]
        });

        if (!session) {
            return res.status(404).json({ message: 'Oturum bulunamadı' });
        }

        // Authorization check
        if (user_role === 'faculty' && session.instructor_id !== user_id) {
            return res.status(403).json({ message: 'Yetkisiz erişim' });
        }

        // Get attendance records for this session
        const records = await AttendanceRecord.findAll({
            where: { session_id: sessionId },
            include: [{ model: require('../../models').User, as: 'student', attributes: ['id', 'full_name', 'email'] }]
        });

        const stats = {
            total: records.length,
            present: records.filter(r => r.status === 'PRESENT').length,
            absent: records.filter(r => r.status === 'ABSENT').length,
            excused: records.filter(r => r.status === 'EXCUSED').length,
            flagged: records.filter(r => r.is_flagged).length
        };

        res.json({
            session: {
                id: session.id,
                course_code: session.section?.course?.code,
                course_name: session.section?.course?.name,
                section_number: session.section?.section_number,
                start_time: session.start_time,
                end_time: session.end_time,
                latitude: session.latitude,
                longitude: session.longitude,
                radius: session.radius,
                qr_code: session.qr_code,
                status: session.status
            },
            stats,
            records: records.map(r => ({
                id: r.id,
                student_id: r.student_id,
                student_name: r.student?.full_name,
                student_email: r.student?.email,
                check_in_time: r.check_in_time,
                distance: r.distance_from_center,
                status: r.status,
                is_flagged: r.is_flagged,
                flag_reason: r.flag_reason
            }))
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// Faculty: Get all my sessions history
exports.getMySessionsHistory = async (req, res) => {
    try {
        const instructor_id = req.user.id;

        const sessions = await AttendanceSession.findAll({
            where: { instructor_id },
            include: [{
                model: CourseSection,
                as: 'section',
                include: [{ model: require('../../models').Course, as: 'course' }]
            }],
            order: [['start_time', 'DESC']],
            limit: 50
        });

        const { Enrollment } = require('../../models');

        const history = await Promise.all(sessions.map(async (session) => {
            const presentCount = await AttendanceRecord.count({
                where: { session_id: session.id, status: 'PRESENT' }
            });
            const enrollmentCount = await Enrollment.count({
                where: { section_id: session.section_id, status: 'ACTIVE' }
            });

            return {
                id: session.id,
                course_code: session.section?.course?.code,
                course_name: session.section?.course?.name,
                section_number: session.section?.section_number,
                date: session.start_time,
                status: session.status,
                present_count: presentCount,
                total_students: enrollmentCount,
                attendance_rate: enrollmentCount > 0 ? Math.round((presentCount / enrollmentCount) * 100) : 0
            };
        }));

        res.json(history);

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};
