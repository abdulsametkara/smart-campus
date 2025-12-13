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
        const { session_id, latitude, longitude, qr_code } = req.body;
        const student_id = req.user.id;

        // Find session by ID or by QR code
        let session;
        if (session_id) {
            session = await AttendanceSession.findByPk(session_id);
        } else if (qr_code) {
            session = await AttendanceSession.findOne({ where: { qr_code } });
        }

        if (!session) {
            return res.status(404).json({ message: 'Session not found' });
        }

        // Use Service for Validation Logic
        const validation = await attendanceService.validateCheckIn(session, student_id, latitude, longitude, qr_code);

        if (!validation.valid) {
            // Log failed attempt if flagged
            if (validation.isFlagged) {
                await AttendanceRecord.create({
                    session_id: session.id,
                    student_id,
                    latitude,
                    longitude,
                    distance_from_center: validation.distance,
                    status: 'ABSENT', // Or some other status indicating failed attempt
                    is_flagged: true,
                    flag_reason: validation.flagReason
                });
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
    // TODO: Implement stats
    res.json({ message: "Work in progress" });
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

        // Get students who checked in
        const records = await AttendanceRecord.findAll({
            where: { session_id: sessionId, status: 'PRESENT' }
        });
        const presentStudentIds = records.map(r => r.student_id);

        // Process absences
        let absentCount = 0;
        for (const enrollment of enrollments) {
            if (!presentStudentIds.includes(enrollment.student_id)) {
                // Student was absent
                absentCount++;

                // Create ABSENT record
                await AttendanceRecord.create({
                    session_id: session.id,
                    student_id: enrollment.student_id,
                    status: 'ABSENT',
                    is_flagged: false
                });

                // Update enrollment absence hours
                enrollment.absence_hours_used += weeklyHours;
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
