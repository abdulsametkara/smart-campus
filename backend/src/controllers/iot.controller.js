const { Sensor, SensorData, Sequelize } = require('../../models');
const { Op } = require('sequelize');

exports.getSensors = async (req, res) => {
    try {
        const sensors = await Sensor.findAll();
        res.json(sensors);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching sensors' });
    }
};

exports.getSensorData = async (req, res) => {
    try {
        const { id } = req.params;
        const { start, end, limit = 100 } = req.query;

        const where = { sensorId: id };
        if (start || end) {
            where.timestamp = {};
            if (start) where.timestamp[Op.gte] = new Date(start);
            if (end) where.timestamp[Op.lte] = new Date(end);
        }

        const data = await SensorData.findAll({
            where,
            limit: parseInt(limit),
            order: [['timestamp', 'DESC']]
        });

        res.json(data);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching sensor data' });
    }
};

// Simulate creating data for demo purposes
exports.simulateData = async (req, res) => {
    try {
        const { id, value } = req.body;
        const data = await SensorData.create({
            sensorId: id,
            value,
            timestamp: new Date()
        });

        // Emit via Socket.IO if available
        const io = req.app.get('io');
        if (io) {
            io.emit('sensor-update', { sensorId: id, data });
        }

        res.json(data);
    } catch (error) {
        res.status(500).json({ message: 'Error simulating data' });
    }
};
