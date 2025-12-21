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

        // 10. Send confirmation email (outside transaction)
        try {
            const user = await User.findByPk(userId);
            if (user && user.email) {
                await this.sendRegistrationEmail(user, event, registration, qrImage, isWaitlisted);
            }
        } catch (emailError) {
            console.error('Failed to send registration email:', emailError);
            // Don't fail the request if email fails
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
                await this.sendCancellationEmail(user, event);
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

    /**
     * Send registration confirmation email
     */
    async sendRegistrationEmail(user, event, registration, qrImage, isWaitlisted) {
        const transporter = require('nodemailer').createTransport({
            host: process.env.EMAIL_HOST,
            port: Number(process.env.EMAIL_PORT) || 587,
            secure: false,
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS,
            },
        });

        const statusText = isWaitlisted ? 'Waitlist' : 'Confirmed';
        const html = `
            <!DOCTYPE html>
            <html>
            <head>
                <style>
                    body { font-family: Arial, sans-serif; background-color: #f3f4f6; padding: 20px; }
                    .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 8px; padding: 30px; }
                    .header { background: #10b981; color: white; padding: 20px; border-radius: 8px 8px 0 0; margin: -30px -30px 20px -30px; }
                    .qr-code { text-align: center; margin: 20px 0; }
                    .qr-code img { max-width: 200px; }
                    .info { background: #f9fafb; padding: 15px; border-radius: 5px; margin: 15px 0; }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h1>Event Registration ${statusText}</h1>
                    </div>
                    <p>Hello <strong>${user.full_name}</strong>,</p>
                    <p>Your registration for <strong>${event.title}</strong> has been ${isWaitlisted ? 'added to the waitlist' : 'confirmed'}.</p>
                    <div class="info">
                        <p><strong>Event Details:</strong></p>
                        <p>Date: ${event.date}</p>
                        <p>Time: ${event.start_time} - ${event.end_time}</p>
                        <p>Location: ${event.location}</p>
                    </div>
                    ${!isWaitlisted ? `
                        <div class="qr-code">
                            <p><strong>Your QR Code for Check-in:</strong></p>
                            <img src="${qrImage}" alt="QR Code" />
                        </div>
                    ` : '<p>You will be notified if a spot becomes available.</p>'}
                </div>
            </body>
            </html>
        `;

        await transporter.sendMail({
            from: `"Campy Events" <${process.env.EMAIL_USER}>`,
            to: user.email,
            subject: `Event Registration ${statusText}: ${event.title}`,
            html: html
        });
    }

    /**
     * Send cancellation email
     */
    async sendCancellationEmail(user, event) {
        const transporter = require('nodemailer').createTransport({
            host: process.env.EMAIL_HOST,
            port: Number(process.env.EMAIL_PORT) || 587,
            secure: false,
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS,
            },
        });

        const html = `
            <!DOCTYPE html>
            <html>
            <head>
                <style>
                    body { font-family: Arial, sans-serif; background-color: #f3f4f6; padding: 20px; }
                    .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 8px; padding: 30px; }
                    .header { background: #ef4444; color: white; padding: 20px; border-radius: 8px 8px 0 0; margin: -30px -30px 20px -30px; }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h1>Event Registration Cancelled</h1>
                    </div>
                    <p>Hello <strong>${user.full_name}</strong>,</p>
                    <p>Your registration for <strong>${event.title}</strong> has been cancelled.</p>
                    <p>If you paid for this event, the amount has been refunded to your wallet.</p>
                </div>
            </body>
            </html>
        `;

        await transporter.sendMail({
            from: `"Campy Events" <${process.env.EMAIL_USER}>`,
            to: user.email,
            subject: `Event Registration Cancelled: ${event.title}`,
            html: html
        });
    }
}

module.exports = new EventService();

