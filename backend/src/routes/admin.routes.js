const express = require('express');
const { listLogs } = require('../controllers/admin.controller');
const { authenticate, authorize } = require('../middleware/auth');

const router = express.Router();

// Sadece 'admin' rolüne sahip kullanıcılar erişebilir
router.get('/logs', authenticate, authorize('admin'), listLogs);

module.exports = router;
