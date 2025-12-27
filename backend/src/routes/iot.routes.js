const express = require('express');
const router = express.Router();
const iotController = require('../controllers/iot.controller');
const { authenticate, authorize } = require('../middleware/auth');

router.use(authenticate);

router.get('/sensors', iotController.getSensors);
router.get('/sensors/:id/data', iotController.getSensorData);
router.post('/simulate', authorize('admin'), iotController.simulateData);

module.exports = router;
