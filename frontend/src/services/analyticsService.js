import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api/v1';

const getAuthHeader = () => {
    const token = localStorage.getItem('accessToken');
    return token ? { Authorization: `Bearer ${token}` } : {};
};

const analyticsService = {
    getDashboardStats: async () => {
        const response = await axios.get(`${API_URL}/analytics/dashboard`, {
            headers: getAuthHeader()
        });
        return response.data;
    },

    getAcademicPerformance: async () => {
        const response = await axios.get(`${API_URL}/analytics/academic-performance`, {
            headers: getAuthHeader()
        });
        return response.data;
    },

    getAttendanceAnalytics: async () => {
        const response = await axios.get(`${API_URL}/analytics/attendance`, {
            headers: getAuthHeader()
        });
        return response.data;
    },

    getMealUsage: async () => {
        const response = await axios.get(`${API_URL}/analytics/meal-usage`, {
            headers: getAuthHeader()
        });
        return response.data;
    },

    getEventsAnalytics: async () => {
        const response = await axios.get(`${API_URL}/analytics/events`, {
            headers: getAuthHeader()
        });
        return response.data;
    },

    exportReport: async (type) => {
        // For file download
        const response = await axios.get(`${API_URL}/analytics/export/${type}`, {
            headers: getAuthHeader(),
            responseType: 'blob'
        });
        return response.data;
    }
};

export default analyticsService;
