const cron = require('node-cron');
const { AttendanceSession, AttendanceRecord, CourseSection, Enrollment } = require('../models');
const { Op } = require('sequelize');

// Auto-close expired attendance sessions every minute
const startSessionCloser = () => {
    cron.schedule('* * * * *', async () => {
        try {
            const now = new Date();

            // Find all active sessions that have passed their end_time
            const expiredSessions = await AttendanceSession.findAll({
                where: {
                    status: 'ACTIVE',
                    end_time: { [Op.lt]: now }
                },
                include: [{
                    model: CourseSection,
                    as: 'section',
                    include: [{ model: require('../models').Course, as: 'course' }]
                }]
            });

            for (const session of expiredSessions) {
                console.log(`Auto-closing session ${session.id} (expired at ${session.end_time})`);

                const weeklyHours = session.section?.course?.weekly_hours || 2;

                // Get enrolled students
                const enrollments = await Enrollment.findAll({
                    where: { section_id: session.section_id, status: 'ACTIVE' }
                });

                // Get students who already have a record
                const records = await AttendanceRecord.findAll({
                    where: { session_id: session.id }
                });
                const recordedStudentIds = records.map(r => r.student_id);

                // Mark absent students
                for (const enrollment of enrollments) {
                    if (!recordedStudentIds.includes(enrollment.student_id)) {
                        await AttendanceRecord.create({
                            session_id: session.id,
                            student_id: enrollment.student_id,
                            status: 'ABSENT',
                            is_flagged: false
                        });

                        enrollment.absence_hours_used = (enrollment.absence_hours_used || 0) + weeklyHours;
                        await enrollment.save();
                    }
                }

                // Close the session
                session.status = 'CLOSED';
                await session.save();

                console.log(`Session ${session.id} closed automatically`);
            }
        } catch (error) {
            console.error('Auto-close session error:', error);
        }
    });

    console.log('Session auto-closer cron job started');
};

module.exports = { startSessionCloser };
