const { Notification } = require('../../models');

/**
 * Creates a notification and emits a real-time event via Socket.IO
 * @param {Object} app - Express app instance (to access io)
 * @param {Object} data - Notification data { userId, title, message, type }
 */
exports.createAndEmitNotification = async (app, data) => {
    try {
        const { userId, title, message, type } = data;

        // 1. Create in Database
        const notification = await Notification.create({
            userId,
            title,
            message,
            type,
            isRead: false
        });

        // 2. Emit via Socket.IO
        const io = app.get('io');
        if (io) {
            // Emit to specific user room if logic exists, otherwise generic broadcast or specific implementation
            // In server.js we see rooms like 'session-X' or 'instructor-X'.
            // For general user notifications, we should ideally have a 'user-{userId}' room.
            // Let's assume the client joins 'user-{userId}' on connection (we need to update server.js for this)

            io.to(`user-${userId}`).emit('notification', notification);
            console.log(`[Notification] Sent to user-${userId}`);
        }

        return notification;
    } catch (error) {
        console.error('Error creating notification:', error);
        throw error;
    }
};
