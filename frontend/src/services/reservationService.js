import api from './api';

// Classroom reservation API (backend: /api/v1/reservations)
const reservationService = {
  // Create new reservation request
  create: async (payload) => {
    const response = await api.post('/reservations', payload);
    return response.data;
  },

  // List reservations (for availability & admin view)
  list: async (params = {}) => {
    const response = await api.get('/reservations', { params });
    return response.data;
  },

  // Update status (admin)
  updateStatus: async (id, status) => {
    const response = await api.patch(`/reservations/${id}/approve`, { status });
    return response.data;
  }
};

export default reservationService;


