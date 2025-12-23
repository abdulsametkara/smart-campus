const { Event, EventRegistration, User, sequelize } = require('../../models');
const qrService = require('./qr.service');
const walletService = require('./wallet.service');
const { Op } = require('sequelize');
const emailService = require('../utils/email');

class EventService {
    /**
     * Get all events with filters
     */
    async getAllEvents(filters = {}) {
        const { category, date, status, search, page = 1, limit = 20 } = filters;
        const where = {};

        if (category) where.category = category;
        if (status) where.status = status;
        if (date) {
            where.date = date;
        }
        if (search) {
            where[Op.or] = [
                { title: { [Op.iLike]: `%${search}%` } },
                { description: { [Op.iLike]: `%${search}%` } },
                { location: { [Op.iLike]: `%${search}%` } }
            ];
        }

        const offset = (page - 1) * limit;

        const { count, rows } = await Event.findAndCountAll({
            where,
            limit: parseInt(limit),
            offset: parseInt(offset),
            order: [['date', 'ASC'], ['start_time', 'ASC']],
            include: [
                {
                    model: EventRegistration,
                    as: 'registrations',
                    attributes: ['id'],
                    required: false
                }
            ]
        });

        return {
            events: rows,
            pagination: {
                total: count,
                page: parseInt(page),
                limit: parseInt(limit),
                totalPages: Math.ceil(count / limit)
            }
        };
    }

    /**
     * Get event by ID with details
     */
    async getEventById(eventId) {
        const event = await Event.findByPk(eventId, {
            include: [
                {
                    model: EventRegistration,
                    as: 'registrations',
                    include: [
                        {
                            model: User,
                            as: 'user',
                            attributes: ['id', 'full_name', 'email', 'student_number']
                        }
                    ]
                }
            ]
        });

        if (!event) {
            throw new Error('Event not found');
        }

        return event;
    }

    /**
     * Create new event (Admin/Event Manager only)
     */
    async createEvent(eventData) {
        const event = await Event.create(eventData);
        return event;
    }

    /**
     * Update event
     */
    async updateEvent(eventId, eventData) {
        const event = await Event.findByPk(eventId);
        if (!event) {
            throw new Error('Event not found');
        }

        await event.update(eventData);
        return event;
    }

    /**
     * Delete event
     */
    async deleteEvent(eventId) {
        const event = await Event.findByPk(eventId);
        if (!event) {
            throw new Error('Event not found');
        }

        await event.destroy();
        return { message: 'Event deleted successfully' };
    }

    /**
     * Register user to event
     * Handles capacity check, waitlist, QR generation, payment
     */
    async registerToEvent(userId, eventId, customFields = {}) {
        const t = await sequelize.transaction();
        let event;
        let registration;
        let qrImage;
        let isWaitlisted = false;

        try {
            // 1. Get event
            event = await Event.findByPk(eventId, { transaction: t });
            if (!event) {
                throw new Error('Event not found');
            }

            // 2. Check if event is published
            if (event.status !== 'published') {
                throw new Error('Event is not available for registration');
            }

            // 3. Check registration deadline
            if (event.registration_deadline && new Date(event.registration_deadline) < new Date()) {
                throw new Error('Registration deadline has passed');
            }

            // 4. Check if already registered
            const existingRegistration = await EventRegistration.findOne({
                where: {
                    event_id: eventId,
                    user_id: userId
                },
                transaction: t
            });

            if (existingRegistration) {
                throw new Error('Already registered to this event');
            }

            // 5. Check capacity and handle waitlist
            const currentRegistrations = await EventRegistration.count({
                where: {
                    event_id: eventId,
                    checked_in: false // Only count non-checked-in registrations
                },
                transaction: t
            });

            isWaitlisted = false;
            if (currentRegistrations >= event.capacity) {
                // Capacity full - add to waitlist (bonus feature)
                isWaitlisted = true;
            }

            // 6. Process payment if event is paid (walletService uses its own transaction)
            if (event.is_paid && event.price > 0) {
                await walletService.processPayment(
                    userId,
                    parseFloat(event.price),
                    `Event Registration: ${event.title}`
                );
            }

            // 7. Generate QR Code
            const qrData = {
                type: 'event',
                eventId: eventId,
                userId: userId,
                timestamp: Date.now()
            };
            const qrCodeString = JSON.stringify(qrData);
            qrImage = await qrService.generate(qrData);

            // 8. Create registration
            registration = await EventRegistration.create({
                event_id: eventId,
                user_id: userId,
                registration_date: new Date(),
                qr_code: qrCodeString, // Store as string for validation
                checked_in: false,
                custom_fields_json: customFields
            }, { transaction: t });

            // 9. Update registered_count (atomic)
            if (!isWaitlisted) {
                await event.increment('registered_count', { transaction: t });
            }

            await t.commit();
        } catch (error) {
            await t.rollback();
            throw error;
        }

        // 10. Send notifications
        try {
            const user = await User.findByPk(userId);
            const notificationService = require('./notification.service');

            // Send Email (New Logic)
            if (user && user.email) {
                await emailService.sendEventRegistrationEmail(user, event, registration, qrImage, isWaitlisted);
            }

            // Send SMS & Push (Bonus)
            await notificationService.send({
                userId,
                type: 'EVENT_REGISTER',
                title: 'Etkinlik Kaydı',
                message: `${event.title} etkinliğine kaydınız ${isWaitlisted ? 'bekleme listesine' : 'başarıyla'} alındı.`
            });

        } catch (notifError) {
            console.error('Failed to send notifications:', notifError);
            // Don't fail the request
        }

        return {
            registration,
            qrCode: qrImage,
            isWaitlisted
        };
    }

    /**
     * Cancel event registration
     */
    async cancelRegistration(userId, eventId, registrationId) {
        const t = await sequelize.transaction();
        let registration;
        let event;

        try {
            registration = await EventRegistration.findOne({
                where: {
                    id: registrationId,
                    event_id: eventId,
                    user_id: userId
                },
                include: [{ model: Event, as: 'event' }],
                transaction: t
            });

            if (!registration) {
                throw new Error('Registration not found');
            }

            // Check if already checked in
            if (registration.checked_in) {
                throw new Error('Cannot cancel checked-in registration');
            }

            event = registration.event;

            // Refund if paid
            if (event.is_paid && event.price > 0) {
                await walletService.topUp(
                    userId,
                    parseFloat(event.price),
                    `Event Registration Refund: ${event.title}`
                );
            }

            // Decrement registered_count
            await event.decrement('registered_count', { transaction: t });

            // Delete registration
            await registration.destroy({ transaction: t });

            // TODO: If waitlist exists, notify next person (bonus feature)

            await t.commit();
        } catch (error) {
            await t.rollback();
            throw error;
        }

        // Send cancellation email (outside transaction)
        try {
            const user = await User.findByPk(userId);
            if (user && user.email) {
                await emailService.sendEventCancellationEmail(user, event);
            }
        } catch (emailError) {
            console.error('Failed to send cancellation email:', emailError);
        }

        return { message: 'Registration cancelled successfully' };
    }

    /**
     * Get event registrations (for event manager)
     */
    async getEventRegistrations(eventId) {
        const registrations = await EventRegistration.findAll({
            where: { event_id: eventId },
            include: [
                {
                    model: User,
                    as: 'user',
                    attributes: ['id', 'full_name', 'email', 'student_number', 'role']
                }
            ],
            order: [['registration_date', 'ASC']]
        });

        return registrations;
    }

    /**
     * Check-in user using QR code (Staff view)
     */
    async checkInUser(eventId, registrationId, qrCodeData) {
        const t = await sequelize.transaction();

        try {
            // Validate QR code
            let qrData;
            try {
                qrData = typeof qrCodeData === 'string'
                    ? JSON.parse(qrCodeData)
                    : qrCodeData;
            } catch (error) {
                throw new Error('Invalid QR code format');
            }

            // Find registration
            const registration = await EventRegistration.findOne({
                where: {
                    id: registrationId,
                    event_id: eventId
                },
                include: [
                    { model: Event, as: 'event' },
                    { model: User, as: 'user' }
                ],
                transaction: t
            });

            if (!registration) {
                throw new Error('Registration not found');
            }

            // Validate QR code matches
            const storedQrData = JSON.parse(registration.qr_code);
            if (storedQrData.eventId !== qrData.eventId ||
                storedQrData.userId !== qrData.userId) {
                throw new Error('QR code does not match registration');
            }

            // Check if already checked in
            if (registration.checked_in) {
                throw new Error('User already checked in');
            }

            // Check event date
            const today = new Date().toISOString().split('T')[0];
            if (registration.event.date !== today) {
                throw new Error('Check-in is only available on event date');
            }

            // Mark as checked in
            registration.checked_in = true;
            registration.checked_in_at = new Date();
            await registration.save({ transaction: t });

            await t.commit();

            return {
                message: 'Check-in successful',
                user: registration.user,
                registration
            };
        } catch (error) {
            await t.rollback();
            throw error;
        }
    }

    /**
     * Get user's event registrations
     */
    async getUserRegistrations(userId) {
        const registrations = await EventRegistration.findAll({
            where: { user_id: userId },
            include: [
                {
                    model: Event,
                    as: 'event',
                    attributes: ['id', 'title', 'description', 'date', 'start_time', 'end_time', 'location', 'category']
                }
            ],
            order: [['registration_date', 'DESC']]
        });

        // Generate QR images for each registration
        const registrationsWithQR = await Promise.all(
            registrations.map(async (reg) => {
                const qrData = JSON.parse(reg.qr_code);
                const qrImage = await qrService.generate(qrData);
                return {
                    ...reg.toJSON(),
                    qrImage
                };
            })
        );

        return registrationsWithQR;
    }
}

module.exports = new EventService();

