const eventService = require('../services/event.service');
/**
 * Get all events with filters
 */
const getAllEvents = async (req, res) => {
    try {
        const { category, date, status, search, page, limit } = req.query;
        const result = await eventService.getAllEvents({
            category,
            date,
            status,
            search,
            page,
            limit
        });
        res.json(result);
    } catch (error) {
        console.error('Get Events Error:', error);
        res.status(500).json({ message: error.message || 'Error retrieving events' });
    }
};
/**
 * Get event by ID
 */
const getEventById = async (req, res) => {
    try {
        const { id } = req.params;
        const event = await eventService.getEventById(id);
        res.json(event);
    } catch (error) {
        console.error('Get Event Error:', error);
        if (error.message === 'Event not found') {
            return res.status(404).json({ message: error.message });
        }
        res.status(500).json({ message: error.message || 'Error retrieving event' });
    }
};
/**
 * Create new event (Admin/Event Manager only)
 */
const createEvent = async (req, res) => {
    try {
        const eventData = req.body;
        const event = await eventService.createEvent(eventData);
        res.status(201).json(event);
    } catch (error) {
        console.error('Create Event Error:', error);
        res.status(400).json({ message: error.message || 'Error creating event' });
    }
};
/**
 * Update event
 */
const updateEvent = async (req, res) => {
    try {
        const { id } = req.params;
        const eventData = req.body;
        const event = await eventService.updateEvent(id, eventData);
        res.json(event);
    } catch (error) {
        console.error('Update Event Error:', error);
        if (error.message === 'Event not found') {
            return res.status(404).json({ message: error.message });
        }
        res.status(400).json({ message: error.message || 'Error updating event' });
    }
};
/**
 * Delete event
 */
const deleteEvent = async (req, res) => {
    try {
        const { id } = req.params;
        const result = await eventService.deleteEvent(id);
        res.json(result);
    } catch (error) {
        console.error('Delete Event Error:', error);
        if (error.message === 'Event not found') {
            return res.status(404).json({ message: error.message });
        }
        res.status(400).json({ message: error.message || 'Error deleting event' });
    }
};
module.exports = {
    getAllEvents,
    getEventById,
    createEvent,
    updateEvent,
    deleteEvent
};
