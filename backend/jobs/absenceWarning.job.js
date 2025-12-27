const cron = require('node-cron');
const db = require('../models');
const { createAndEmitNotification } = require('../src/utils/notificationHelper');
const app = require('../src/app');

const checkAbsences = async () => {
    console.log('Running Absence Warning Job...');
    try {
        // Fetch all active enrollments
        const enrollments = await db.Enrollment.findAll({
            where: { status: 'ACTIVE' },
            include: [
                { model: db.User, as: 'student' },
                { model: db.CourseSection, as: 'section' }
            ]
        });

        for (const enrollment of enrollments) {
            // Calculate attendance stats
            const totalSessions = await db.AttendanceSession.count({
                where: { section_id: enrollment.section_id, status: 'CLOSED' }
            });

            if (totalSessions === 0) continue;

            const attendedSessions = await db.AttendanceRecord.count({
                where: {
                    student_id: enrollment.student_id,
                    status: 'PRESENT',
                    '$session.section_id$': enrollment.section_id
                },
                include: [{
                    model: db.AttendanceSession,
                    as: 'session',
                    where: { section_id: enrollment.section_id }
                }]
            });

            const absenceRate = (totalSessions - attendedSessions) / totalSessions;

            if (absenceRate >= 0.20) {
                console.log(`WARNING: Student ${enrollment.student.email} has ${(absenceRate * 100).toFixed(1)}% absence`);

                // Create Notification using helper (emits socket event)
                await createAndEmitNotification(app, {
                    userId: enrollment.student.id,
                    title: 'Devamsızlık Uyarısı',
                    message: `Bu derste devamsızlık oranınız %${(absenceRate * 100).toFixed(1)} seviyesine ulaştı.`,
                    type: 'attendance',
                    isRead: false
                });
            }
        }
    } catch (error) {
        console.error('Error in Absence Warning Job:', error);
    }
};

// Run every night at 00:00
const job = cron.schedule('0 0 * * *', checkAbsences, {
    scheduled: false // Don't start immediately, let server.js start it
});

module.exports = job;
