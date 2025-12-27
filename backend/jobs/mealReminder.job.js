const cron = require('node-cron');
const { MealReservation, MealMenu, User, Notification } = require('../models');
const { Op } = require('sequelize');

/**
 * Meal Reminder Job
 * Runs every day at 10 AM to remind users about their meal reservations for the day
 */
async function sendMealReminders() {
    try {
        const today = new Date().toISOString().split('T')[0];

        // Find today's reservations
        const todayReservations = await MealReservation.findAll({
            where: {
                status: 'reserved'
            },
            include: [
                {
                    model: MealMenu,
                    as: 'menu',
                    where: { date: today }
                },
                {
                    model: User,
                    as: 'user',
                    attributes: ['id', 'full_name', 'email']
                }
            ]
        });

        for (const reservation of todayReservations) {
            if (reservation.user) {
                const mealType = reservation.meal_type === 'lunch' ? 'Öğle' : 'Akşam';
                await Notification.create({
                    userId: reservation.user.id,
                    title: 'Yemek Hatırlatması',
                    message: `Bugün için ${mealType} yemeği rezervasyonunuz var. QR kodunuzu hazır bulundurun!`,
                    type: 'meal',
                    isRead: false
                });
                console.log(`Meal reminder sent to user ${reservation.user.id}`);
            }
        }

        console.log(`Meal reminders processed. ${todayReservations.length} reservations reminded.`);
    } catch (error) {
        console.error('Meal Reminder Job Error:', error);
    }
}

// Run every day at 10 AM
const mealReminderJob = cron.schedule('0 10 * * *', sendMealReminders, {
    scheduled: true,
    timezone: 'Europe/Istanbul'
});

module.exports = { mealReminderJob, sendMealReminders };
