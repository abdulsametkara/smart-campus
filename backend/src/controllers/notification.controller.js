const { Notification, NotificationPreference, User, Sequelize } = require('../../models');
const { Op } = require('sequelize');

exports.getNotifications = async (req, res) => {
    try {
        const userId = req.user.id;
        const { page = 1, limit = 10, isRead, type } = req.query;
        const offset = (page - 1) * limit;

        const whereClause = { userId };
        if (isRead !== undefined) whereClause.isRead = isRead === 'true';
        if (type) whereClause.type = type;

        const { count, rows } = await Notification.findAndCountAll({
            where: whereClause,
            limit: parseInt(limit),
            offset: parseInt(offset),
            order: [['createdAt', 'DESC']]
        });

        const unreadCount = await Notification.count({
            where: { userId, isRead: false }
        });

        res.json({
            notifications: rows,
            total: count,
            totalPages: Math.ceil(count / limit),
            currentPage: parseInt(page),
            unreadCount
        });
    } catch (error) {
        console.error('Get Notifications Error:', error);
        res.status(500).json({ message: 'Error fetching notifications' });
    }
};

exports.markAsRead = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.id;

        const notification = await Notification.findOne({ where: { id, userId } });
        if (!notification) {
            return res.status(404).json({ message: 'Notification not found' });
        }

        notification.isRead = true;
        await notification.save();

        res.json({ message: 'Notification marked as read', notification });
    } catch (error) {
        res.status(500).json({ message: 'Error updating notification' });
    }
};

exports.markAllAsRead = async (req, res) => {
    try {
        const userId = req.user.id;
        await Notification.update(
            { isRead: true },
            { where: { userId, isRead: false } }
        );
        res.json({ message: 'All notifications marked as read' });
    } catch (error) {
        res.status(500).json({ message: 'Error processing request' });
    }
};

exports.deleteNotification = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.id;
        const deleted = await Notification.destroy({ where: { id, userId } });

        if (!deleted) return res.status(404).json({ message: 'Notification not found' });

        res.json({ message: 'Notification deleted' });
    } catch (error) {
        res.status(500).json({ message: 'Error deleting notification' });
    }
};

exports.getPreferences = async (req, res) => {
    try {
        const userId = req.user.id;
        const [prefs] = await NotificationPreference.findOrCreate({
            where: { userId },
            defaults: { userId } // Default values are handled by model
        });
        res.json(prefs);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching preferences' });
    }
};

exports.updatePreferences = async (req, res) => {
    try {
        const userId = req.user.id;
        const updates = req.body;

        // Whitelist allowed fields to prevent overwriting ID or userId
        const allowedFields = [
            'email_academic', 'email_attendance', 'email_meal', 'email_event', 'email_payment', 'email_system',
            'push_academic', 'push_attendance', 'push_meal', 'push_event', 'push_payment', 'push_system',
            'sms_attendance', 'sms_payment'
        ];

        const filteredUpdates = Object.keys(updates)
            .filter(key => allowedFields.includes(key))
            .reduce((obj, key) => {
                obj[key] = updates[key];
                return obj;
            }, {});

        const [prefs] = await NotificationPreference.findOrCreate({ where: { userId } });
        await prefs.update(filteredUpdates);

        res.json({ message: 'Preferences updated', prefs });
    } catch (error) {
        res.status(500).json({ message: 'Error updating preferences' });
    }
};

exports.sendNotification = async (req, res) => {
    try {
        const { userIds, title, message, type = 'system' } = req.body;
        const senderId = req.user.id; // Admin sending

        if (!title || !message) {
            return res.status(400).json({ message: 'Title and message are required' });
        }

        let targetIds = [];

        // If userIds is not provided or empty, we assume BROADCAST to ALL users? 
        // Or strictly require userIds? Let's implement specific targets or "all" flag.
        // For safety, let's require 'all': true or explicit userIds.

        if (req.body.all === true) {
            const allUsers = await User.findAll({ attributes: ['id'] });
            targetIds = allUsers.map(u => u.id);
        } else if (Array.isArray(userIds) && userIds.length > 0) {
            targetIds = userIds;
        } else {
            return res.status(400).json({ message: 'Target users (userIds array) or "all": true is required' });
        }

        // Helper to send individual notifications
        // We can optimize this with bulkCreate but we also need to emit socket events
        const { createAndEmitNotification } = require('../utils/notificationHelper');

        // Process in chunks or one by one? detailed await loop might be slow for thousands but fine for MVP
        let successCount = 0;
        for (const uid of targetIds) {
            try {
                // Determine type based on input or default to 'system'
                await createAndEmitNotification(req.app, {
                    userId: uid,
                    title,
                    message,
                    type
                });
                successCount++;
            } catch (err) {
                console.error(`Failed to send to user ${uid}`, err);
            }
        }

        res.json({ message: `Notification sent to ${successCount} users` });

    } catch (error) {
        console.error('Send Notification Error:', error);
        res.status(500).json({ message: 'Error sending notifications' });
    }
};
