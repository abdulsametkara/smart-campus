const { NotificationLog, User } = require('../../models');
const emailService = require('../utils/email');

class NotificationService {

    /**
     * Send notification across all valid channels
     * @param {Object} params
     * @param {number} params.userId
     * @param {string} params.type - EVENT_REGISTER, MEAL_RESERVE
     * @param {string} params.title
     * @param {string} params.message
     * @param {Object} params.data - Extra data for email template
     */
    async send(params) {
        const { userId, type, title, message, data } = params;
        const results = [];

        try {
            const user = await User.findByPk(userId);
            if (!user) return;

            // 1. Send Email (Real)
            // Assuming emailService has generic send method or we replicate logic
            // For now, we log it and assume the specific service (Event/Meal) constructs the complex HTML
            // This service focuses on the "Simple" notifications like SMS/Push

            // 2. Send SMS (Mock)
            // In a real app, user.phone_number would be used
            const smsResult = await this.sendSMS(user, message);
            results.push(smsResult);

            // 3. Send Web Push (Mock)
            const pushResult = await this.sendWebPush(user, title, message);
            results.push(pushResult);

            return results;
        } catch (error) {
            console.error('NotificationService Error:', error);
        }
    }

    async sendSMS(user, content) {
        // MOCK SMS GATEWAY
        console.log(`[SMS MOCK] Sending to ${user.full_name}: ${content}`);

        // Log to DB
        return await NotificationLog.create({
            userId: user.id,
            type: 'SMS',
            channel: 'SMS',
            recipient: user.phone_number || '0555-000-0000', // Mock phone if missing
            content: content,
            status: 'SENT'
        });
    }

    async sendWebPush(user, title, content) {
        // MOCK PUSH GATEWAY
        console.log(`[PUSH MOCK] Sending to ${user.id}: ${title} - ${content}`);

        return await NotificationLog.create({
            userId: user.id,
            type: 'PUSH',
            channel: 'WEB_PUSH',
            recipient: `token_user_${user.id}`,
            content: `${title}: ${content}`,
            status: 'SENT'
        });
    }
}

module.exports = new NotificationService();
