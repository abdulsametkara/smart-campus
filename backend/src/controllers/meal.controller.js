const mealService = require('../services/meal.service');

const getWeeklyMenus = async (req, res) => {
    try {
        const { start, end } = req.query;
        // Default to this week if dates not provided
        const startDate = start ? new Date(start) : new Date();
        const endDate = end ? new Date(end) : new Date(new Date().setDate(new Date().getDate() + 7));

        const menus = await mealService.getMenus(startDate, endDate);
        res.json(menus);
    } catch (err) {
        console.error('Get Menus Error:', err);
        res.status(500).json({ message: 'Error retrieving menus' });
    }
};

const makeReservation = async (req, res) => {
    try {
        const { menuId } = req.body;
        if (!menuId) return res.status(400).json({ message: 'Menu ID is required' });

        const reservation = await mealService.makeReservation(req.user.id, menuId);
        res.status(201).json(reservation);
    } catch (err) {
        console.error('Reservation Error:', err);
        res.status(400).json({ message: err.message });
    }
};

const getMyReservations = async (req, res) => {
    try {
        const reservations = await mealService.getUserReservations(req.user.id);
        res.json(reservations);
    } catch (err) {
        console.error('Get Reservations Error:', err);
        res.status(500).json({ message: 'Error retrieving reservations' });
    }
};

const markAsUsed = async (req, res) => {
    try {
        const { id } = req.params;
        const result = await mealService.markAsUsed(req.user.id, parseInt(id));
        res.json(result);
    } catch (err) {
        console.error('Mark As Used Error:', err);
        res.status(400).json({ message: err.message });
    }
};

const cancelReservation = async (req, res) => {
    try {
        const { id } = req.params;
        const result = await mealService.cancelReservation(req.user.id, parseInt(id));
        res.json(result);
    } catch (err) {
        console.error('Cancel Reservation Error:', err);
        res.status(400).json({ message: err.message });
    }
};

module.exports = {
    getWeeklyMenus,
    makeReservation,
    getMyReservations,
    markAsUsed,
    cancelReservation
};
