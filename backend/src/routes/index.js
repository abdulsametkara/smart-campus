const express = require('express');
const router = express.Router();

router.use('/auth', require('./auth.routes'));
router.use('/users', require('./user.routes'));
router.use('/departments', require('./department.routes'));
router.use('/admin', require('./admin.routes'));
router.use('/scheduling', require('./scheduling.routes'));
router.use('/reservations', require('./reservation.routes'));

module.exports = router;
