'use strict';

const express = require('express');
const router = express.Router();
const schedulingController = require('../controllers/scheduling.controller');
const { authenticate, authorize } = require('../middleware/auth');

// Routes protected by Admin role
router.post('/generate', [authenticate, authorize('admin')], schedulingController.generateSchedule);
router.post('/save', [authenticate, authorize('admin')], schedulingController.saveSchedule);

module.exports = router;
