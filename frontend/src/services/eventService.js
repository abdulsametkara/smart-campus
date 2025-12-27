import api from './api';
const eventService = {
    // Get all events with filters
    getAll: async (params = {}) => {
        const { category, date, status, search, page = 1, limit = 20 } = params;
        const queryParams = new URLSearchParams();
        if (category) queryParams.append('category', category);
        if (date) queryParams.append('date', date);
        if (status) queryParams.append('status', status);
        if (search) queryParams.append('search', search);
        queryParams.append('page', page);
        queryParams.append('limit', limit);
        const response = await api.get(`/events?${queryParams.toString()}`);
        return response.data;
    },
    // Get event by ID
    getById: async (id) => {
        const response = await api.get(`/events/${id}`);
        return response.data;
    },
    // Create event (Admin only)
    create: async (eventData) => {
        const response = await api.post('/events', eventData);
        return response.data;
    },
    // Update event (Admin only)
    update: async (id, eventData) => {
        const response = await api.put(`/events/${id}`, eventData);
        return response.data;
    },
    // Delete event (Admin only)
    delete: async (id) => {
        const response = await api.delete(`/events/${id}`);
        return response.data;
    },
    // Register to event
    register: async (eventId, customFields = {}) => {
        const response = await api.post(`/events/${eventId}/register`, { customFields });
        return response.data;
    },
    // Cancel registration
    cancelRegistration: async (eventId, registrationId) => {
        const response = await api.delete(`/events/${eventId}/registrations/${registrationId}`);
        return response.data;
    },
    // Get event registrations (Admin/Staff)
    getRegistrations: async (eventId) => {
        const response = await api.get(`/events/${eventId}/registrations`);
        return response.data;
    },
    // Check-in user (Admin/Staff)
    checkIn: async (eventId, registrationId, qrCodeData) => {
        const response = await api.post(
            `/events/${eventId}/registrations/${registrationId}/checkin`,
            { qrCodeData }
        );
        return response.data;
    },
    // Get user's registrations
    getMyRegistrations: async () => {
        const response = await api.get('/events/my/registrations');
        return response.data;
    }
};
export default eventService;
