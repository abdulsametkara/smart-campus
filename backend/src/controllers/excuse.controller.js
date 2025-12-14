const { ExcuseRequest, User, AttendanceSession, AttendanceRecord, CourseSection, Enrollment } = require('../../models');
const { Op } = require('sequelize');
const { sendExcuseApprovedEmail, sendExcuseRejectedEmail } = require('../services/excuseNotification.service');

// Student: Submit an excuse request
exports.createExcuse = async (req, res) => {
    try {
        const student_id = req.user.id;
        const { session_id, reason, description } = req.body;

        // Verify student was absent in this session
        const session = await AttendanceSession.findByPk(session_id, {
            include: [{ model: CourseSection, as: 'section' }]
        });

        if (!session) {
            return res.status(404).json({ message: 'Oturum bulunamadı' });
        }

        // Check enrollment
        const enrollment = await Enrollment.findOne({
            where: { student_id, section_id: session.section_id, status: 'ACTIVE' }
        });

        if (!enrollment) {
            return res.status(403).json({ message: 'Bu derse kayıtlı değilsiniz' });
        }

        // Handle uploaded file
        let document_url = null;
        if (req.file) {
            // For production, use relative path from uploads folder
            document_url = `/uploads/excuses/${req.file.filename}`;
        }

        // Create excuse request
        const excuse = await ExcuseRequest.create({
            student_id,
            session_id,
            title: reason,
            description,
            document_url,
            status: 'PENDING'
        });

        res.status(201).json({ message: 'Mazeret talebiniz gönderildi', excuse });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Sunucu hatası', error: error.message });
    }
};

// Student: Get my excuse requests
exports.getMyExcuses = async (req, res) => {
    try {
        const student_id = req.user.id;

        const excuses = await ExcuseRequest.findAll({
            where: { student_id },
            include: [{
                model: AttendanceSession,
                as: 'session',
                include: [{
                    model: CourseSection,
                    as: 'section',
                    include: [{ model: require('../../models').Course, as: 'course' }]
                }]
            }],
            order: [['created_at', 'DESC']]
        });

        res.json(excuses);

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Sunucu hatası', error: error.message });
    }
};

// Instructor: Get pending excuses for their sections
exports.getPendingExcuses = async (req, res) => {
    try {
        const instructor_id = req.user.id;

        // Get instructor's sections
        const sections = await CourseSection.findAll({
            where: { instructor_id },
            attributes: ['id']
        });
        const sectionIds = sections.map(s => s.id);

        // Get pending excuses for those sections
        const excuses = await ExcuseRequest.findAll({
            where: { status: 'PENDING' },
            include: [
                { model: User, as: 'student', attributes: ['id', 'full_name', 'email'] },
                {
                    model: AttendanceSession,
                    as: 'session',
                    where: { section_id: { [Op.in]: sectionIds } },
                    include: [{
                        model: CourseSection,
                        as: 'section',
                        include: [{ model: require('../../models').Course, as: 'course' }]
                    }]
                }
            ],
            order: [['created_at', 'ASC']]
        });

        res.json(excuses);

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Sunucu hatası', error: error.message });
    }
};

// Instructor: Approve excuse
exports.approveExcuse = async (req, res) => {
    try {
        const { excuseId } = req.params;
        const instructor_id = req.user.id;

        const excuse = await ExcuseRequest.findByPk(excuseId, {
            include: [
                { model: User, as: 'student' },
                {
                    model: AttendanceSession,
                    as: 'session',
                    include: [{
                        model: CourseSection,
                        as: 'section',
                        include: [{ model: require('../../models').Course, as: 'course' }]
                    }]
                }
            ]
        });

        if (!excuse) {
            return res.status(404).json({ message: 'Mazeret talebi bulunamadı' });
        }

        // Verify instructor owns this section
        if (excuse.session.section.instructor_id !== instructor_id) {
            return res.status(403).json({ message: 'Yetkisiz işlem' });
        }

        // Update excuse status
        excuse.status = 'APPROVED';
        excuse.reviewed_by = instructor_id;
        excuse.reviewed_at = new Date();
        await excuse.save();

        // Restore absence hours
        const weeklyHours = excuse.session.section.course?.weekly_hours || 2;
        const enrollment = await Enrollment.findOne({
            where: { student_id: excuse.student_id, section_id: excuse.session.section_id }
        });

        if (enrollment && enrollment.absence_hours_used >= weeklyHours) {
            enrollment.absence_hours_used -= weeklyHours;
            await enrollment.save();
        }

        // Update attendance record to EXCUSED
        await AttendanceRecord.update(
            { status: 'EXCUSED' },
            { where: { session_id: excuse.session_id, student_id: excuse.student_id } }
        );

        // Send email notification
        const courseName = `${excuse.session.section.course?.code} - ${excuse.session.section.course?.name}`;
        sendExcuseApprovedEmail(excuse.student, excuse, courseName);

        res.json({ message: 'Mazeret onaylandı, devamsızlık iade edildi' });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Sunucu hatası', error: error.message });
    }
};

// Instructor: Reject excuse
exports.rejectExcuse = async (req, res) => {
    try {
        const { excuseId } = req.params;
        const instructor_id = req.user.id;
        const { rejection_reason } = req.body;

        const excuse = await ExcuseRequest.findByPk(excuseId, {
            include: [
                { model: User, as: 'student' },
                {
                    model: AttendanceSession,
                    as: 'session',
                    include: [{
                        model: CourseSection,
                        as: 'section',
                        include: [{ model: require('../../models').Course, as: 'course' }]
                    }]
                }
            ]
        });

        if (!excuse) {
            return res.status(404).json({ message: 'Mazeret talebi bulunamadı' });
        }

        if (excuse.session.section.instructor_id !== instructor_id) {
            return res.status(403).json({ message: 'Yetkisiz işlem' });
        }

        excuse.status = 'REJECTED';
        excuse.reviewed_by = instructor_id;
        excuse.reviewed_at = new Date();
        excuse.notes = rejection_reason || 'Belge yetersiz';
        await excuse.save();

        // Send email notification
        const courseName = `${excuse.session.section.course?.code} - ${excuse.session.section.course?.name}`;
        sendExcuseRejectedEmail(excuse.student, excuse, courseName, rejection_reason);

        res.json({ message: 'Mazeret reddedildi' });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Sunucu hatası', error: error.message });
    }
};
