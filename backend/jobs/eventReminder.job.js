const cron = require('node-cron');
const { Event, EventRegistration, User, Notification } = require('../models');
const { Op } = require('sequelize');

/**
 * Event Reminder Job
 * Runs every hour to check for events happening in the next 24 hours
 * Sends reminders to registered users
 */
async function sendEventReminders() {
    try {
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        const tomorrowStart = new Date(tomorrow.setHours(0, 0, 0, 0));
        const tomorrowEnd = new Date(tomorrow.setHours(23, 59, 59, 999));

        // Find events happening tomorrow
        const upcomingEvents = await Event.findAll({
            where: {
                date: {
                    [Op.between]: [tomorrowStart, tomorrowEnd]
                },
                status: 'published'
            },
            include: [{
                model: EventRegistration,
                as: 'registrations',
                include: [{ model: User, as: 'user', attributes: ['id', 'full_name', 'email'] }]
            }]
        });

        for (const event of upcomingEvents) {
            for (const reg of event.registrations) {
                if (reg.user) {
                    await Notification.create({
                        userId: reg.user.id,
                        title: 'Etkinlik Hatırlatması',
                        message: `Yarın "${event.title}" etkinliği var. Saat: ${event.start_time}`,
                        type: 'event',
                        isRead: false
                    });
                    console.log(`Event reminder sent to user ${reg.user.id} for event ${event.id}`);
                }
            }
        }

        console.log(`Event reminders processed. ${upcomingEvents.length} events checked.`);
    } catch (error) {
        console.error('Event Reminder Job Error:', error);
    }
}

// Run every day at 9 AM
const eventReminderJob = cron.schedule('0 9 * * *', sendEventReminders, {
    scheduled: true,
    timezone: 'Europe/Istanbul'
});

module.exports = { eventReminderJob, sendEventReminders };
