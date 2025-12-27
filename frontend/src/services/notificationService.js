import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api/v1';

const getAuthHeader = () => {
    const token = localStorage.getItem('accessToken');
    return token ? { Authorization: `Bearer ${token}` } : {};
};

const notificationService = {
    getNotifications: async (page = 1, limit = 10, type = null) => {
        const params = { page, limit };
        if (type) params.type = type;

        const response = await axios.get(`${API_URL}/notifications`, {
            headers: getAuthHeader(),
            params
        });
        return response.data;
    },

    markAsRead: async (id) => {
        const response = await axios.put(`${API_URL}/notifications/${id}/read`, {}, {
            headers: getAuthHeader()
        });
        return response.data;
    },

    markAllRead: async () => {
        const response = await axios.put(`${API_URL}/notifications/mark-all-read`, {}, {
            headers: getAuthHeader()
        });
        return response.data;
    },

    deleteNotification: async (id) => {
        const response = await axios.delete(`${API_URL}/notifications/${id}`, {
            headers: getAuthHeader()
        });
        return response.data;
    },

    getPreferences: async () => {
        const response = await axios.get(`${API_URL}/notifications/preferences`, {
            headers: getAuthHeader()
        });
        return response.data;
    },

    updatePreferences: async (prefs) => {
        const response = await axios.put(`${API_URL}/notifications/preferences`, prefs, {
            headers: getAuthHeader()
        });
        return response.data;
    },

    sendNotification: async (data) => {
        const response = await axios.post(`${API_URL}/notifications/send`, data, {
            headers: getAuthHeader()
        });
        return response.data;
    }
};

export default notificationService;
