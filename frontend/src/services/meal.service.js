import api from './api';

const getWeeklyMenus = async (start, end) => {
    const response = await api.get('/meals/menus', {
        params: { start, end }
    });
    return response.data;
};

const makeReservation = async (menuId) => {
    const response = await api.post('/meals/reservations', { menuId });
    return response.data;
};

const getMyReservations = async () => {
    const response = await api.get('/meals/reservations');
    return response.data;
};

const markAsUsed = async (reservationId) => {
    const response = await api.patch(`/meals/reservations/${reservationId}/use`);
    return response.data;
};

const mealService = {
    getWeeklyMenus,
    makeReservation,
    getMyReservations,
    markAsUsed
};

export default mealService;
