import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api/v1';

const getAuthHeader = () => {
    const token = localStorage.getItem('accessToken');
    return token ? { Authorization: `Bearer ${token}` } : {};
};

const iotService = {
    getSensors: async () => {
        const response = await axios.get(`${API_URL}/iot/sensors`, {
            headers: getAuthHeader()
        });
        return response.data;
    },

    getSensorData: async (id, start, end) => {
        const params = {};
        if (start) params.start = start;
        if (end) params.end = end;

        const response = await axios.get(`${API_URL}/iot/sensors/${id}/data`, {
            headers: getAuthHeader(),
            params
        });
        return response.data;
    },

    // For demo simulation
    simulateData: async (id, value) => {
        const response = await axios.post(`${API_URL}/iot/simulate`, { id, value }, {
            headers: getAuthHeader()
        });
        return response.data;
    }
};

export default iotService;
