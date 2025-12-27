const eventService = require('../services/event.service');
/**
 * Register user to event
 */
const registerToEvent = async (req, res) => {
    try {
        const { id: eventId } = req.params;
        const { customFields } = req.body;
        const userId = req.user.id;
        const result = await eventService.registerToEvent(userId, eventId, customFields);
        // Wrap response to match expected format
        res.status(201).json({
            registration: result,
            qrCode: result.qr_code
        });
    } catch (error) {
        console.error('Register to Event Error:', error);
        const statusCode = error.statusCode || 400;
        res.status(statusCode).json({ message: error.message || 'Error registering to event' });
    }
};
/**
 * Cancel event registration
 */
const cancelRegistration = async (req, res) => {
    try {
        const { eventId, regId } = req.params;
        const userId = req.user.id;
        const result = await eventService.cancelRegistration(userId, eventId, regId);
        res.json(result);
    } catch (error) {
        console.error('Cancel Registration Error:', error);
        res.status(400).json({ message: error.message || 'Error cancelling registration' });
    }
};
/**
 * Get event registrations (for event manager/staff)
 */
const getEventRegistrations = async (req, res) => {
    try {
        const { id: eventId } = req.params;
        const registrations = await eventService.getEventRegistrations(eventId);
        res.json(registrations);
    } catch (error) {
        console.error('Get Event Registrations Error:', error);
        res.status(500).json({ message: error.message || 'Error retrieving registrations' });
    }
};
/**
 * Check-in user using QR code (Staff view)
 */
const checkInUser = async (req, res) => {
    try {
        const { eventId, regId } = req.params;
        const { qrCodeData } = req.body;
        if (!qrCodeData) {
            return res.status(400).json({ message: 'QR code data is required' });
        }
        const result = await eventService.checkInUser(eventId, regId, qrCodeData);
        res.json(result);
    } catch (error) {
        console.error('Check-in Error:', error);
        res.status(400).json({ message: error.message || 'Error checking in user' });
    }
};
/**
 * Get user's event registrations
 */
const getMyRegistrations = async (req, res) => {
    try {
        const userId = req.user.id;
        const registrations = await eventService.getUserRegistrations(userId);
        res.json(registrations);
    } catch (error) {
        console.error('Get My Registrations Error:', error);
        res.status(500).json({ message: error.message || 'Error retrieving registrations' });
    }
};
module.exports = {
    registerToEvent,
    cancelRegistration,
    getEventRegistrations,
    checkInUser,
    getMyRegistrations
};
