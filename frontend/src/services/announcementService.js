import api from './api';

const announcementService = {
    create: (data) => api.post('/announcements', data),
    getAll: () => api.get('/announcements'),
    delete: (id) => api.delete(`/announcements/${id}`)
};

export default announcementService;
