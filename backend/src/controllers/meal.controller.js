const mealService = require('../services/meal.service');

const getWeeklyMenus = async (req, res) => {
    try {
        const { start, end } = req.query;
        console.log('[MealController] getWeeklyMenus called with start:', start, 'end:', end);
        
        // Default to this week if dates not provided
        const startDate = start || new Date().toISOString().split('T')[0];
        const endDate = end || new Date(new Date().setDate(new Date().getDate() + 7)).toISOString().split('T')[0];

        const menus = await mealService.getMenus(startDate, endDate);
        console.log('[MealController] Returning', menus.length, 'menus');
        res.json(menus);
    } catch (err) {
        console.error('Get Menus Error:', err);
        res.status(500).json({ message: 'Error retrieving menus', error: err.message });
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

// Admin Menu Management
const createMenu = async (req, res) => {
    try {
        const menu = await mealService.createMenu(req.body);
        res.status(201).json(menu);
    } catch (err) {
        console.error('Create Menu Error:', err);
        res.status(400).json({ message: err.message });
    }
};

const updateMenu = async (req, res) => {
    try {
        const { id } = req.params;
        const menu = await mealService.updateMenu(parseInt(id), req.body);
        res.json(menu);
    } catch (err) {
        console.error('Update Menu Error:', err);
        res.status(400).json({ message: err.message });
    }
};

const deleteMenu = async (req, res) => {
    try {
        const { id } = req.params;
        const result = await mealService.deleteMenu(parseInt(id));
        res.json(result);
    } catch (err) {
        console.error('Delete Menu Error:', err);
        res.status(400).json({ message: err.message });
    }
};

const togglePublish = async (req, res) => {
    try {
        const { id } = req.params;
        const menu = await mealService.togglePublish(parseInt(id));
        res.json(menu);
    } catch (err) {
        console.error('Toggle Publish Error:', err);
        res.status(400).json({ message: err.message });
    }
};

const getAllMenus = async (req, res) => {
    try {
        const { start, end, cafeteria_id, is_published } = req.query;
        const filters = {};
        if (start) filters.start = start;
        if (end) filters.end = end;
        if (cafeteria_id) filters.cafeteria_id = parseInt(cafeteria_id);
        if (is_published !== undefined) filters.is_published = is_published === 'true';

        const menus = await mealService.getAllMenus(filters);
        res.json(menus);
    } catch (err) {
        console.error('Get All Menus Error:', err);
        res.status(500).json({ message: err.message });
    }
};

module.exports = {
    getWeeklyMenus,
    makeReservation,
    getMyReservations,
    markAsUsed,
    cancelReservation,
    createMenu,
    updateMenu,
    deleteMenu,
    togglePublish,
    getAllMenus
};
