const { Event, EventRegistration, User, Sequelize } = require('../../models');
const { Op } = require('sequelize');

class EventService {
    async getAllEvents({ category, date, status, search, page = 1, limit = 10 }) {
        const where = {};
        if (category && category !== 'Tüm Kategoriler') where.category = category;
        if (date) where.date = date; // Support filtering by exact date
        if (status) where.status = status;
        // Simple search
        if (search) {
            where[Op.or] = [
                { title: { [Op.iLike]: `%${search}%` } },
                { description: { [Op.iLike]: `%${search}%` } }
            ];
        }

        const offset = (page - 1) * limit;
        const { count, rows } = await Event.findAndCountAll({
            where,
            offset,
            limit,
            order: [['date', 'ASC']]
        });

        return {
            events: rows,
            pagination: {
                total: count,
                page: parseInt(page),
                totalPages: Math.ceil(count / limit)
            }
        };
    }

    async getEventById(id) {
        const event = await Event.findByPk(id);
        if (!event) throw new Error('Event not found');
        return event;
    }

    async createEvent(data) {
        return await Event.create(data);
    }

    async updateEvent(id, data) {
        const event = await this.getEventById(id);
        return await event.update(data);
    }

    async deleteEvent(id) {
        const event = await this.getEventById(id);
        return await event.destroy();
    }

    async registerToEvent(userId, eventId, customFields) {
        const event = await this.getEventById(eventId);
        if (event.status !== 'published') throw new Error('Event is not open for registration');
        if (event.registered_count >= event.capacity) throw new Error('Event is full');

        // Check existing
        const existing = await EventRegistration.findOne({ where: { user_id: userId, event_id: eventId } });
        if (existing) throw new Error('Already registered');

        const registration = await EventRegistration.create({
            user_id: userId,
            event_id: eventId,
            registration_date: new Date(),
            custom_fields_json: customFields,
            qr_code: JSON.stringify({
                type: 'event',
                eventId: parseInt(eventId),
                userId: userId,
                timestamp: Date.now()
            })
        });

        await event.increment('registered_count');
        return registration;
    }

    async cancelRegistration(userId, eventId, regId) {
        const registration = await EventRegistration.findOne({
            where: { id: regId, user_id: userId, event_id: eventId }
        });
        if (!registration) throw new Error('Registration not found');

        await registration.destroy();
        await Event.decrement('registered_count', { where: { id: eventId } });
        return { message: 'Registration cancelled' };
    }

    async getEventRegistrations(eventId) {
        return await EventRegistration.findAll({
            where: { event_id: eventId },
            include: [{ model: User, as: 'user', attributes: ['id', 'full_name', 'email', 'student_number'] }]
        });
    }

    async checkInUser(eventId, regId, qrCodeData) {
        const registration = await EventRegistration.findOne({
            where: { id: regId, event_id: eventId },
            include: [{ model: User, as: 'user' }]
        });
        if (!registration) throw new Error('Registration not found');
        if (registration.checked_in) throw new Error('Already checked in');

        // Can validate qrCodeData matching registration.qr_code here if strictly enabled
        // For now, accept ID match

        registration.checked_in = true;
        registration.checked_in_at = new Date();
        await registration.save();

        return { message: 'Check-in successful', user: registration.user };
    }

    async getUserRegistrations(userId) {
        return await EventRegistration.findAll({
            where: { user_id: userId },
            include: [{ model: Event, as: 'event' }],
            order: [['registration_date', 'DESC']]
        });
    }
}

module.exports = new EventService();
