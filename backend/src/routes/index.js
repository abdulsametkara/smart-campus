const express = require('express');
const router = express.Router();


router.use('/auth', require('./auth.routes'));
router.use('/users', require('./user.routes'));
router.use('/departments', require('./department.routes'));
router.use('/academic', require('./academic.routes')); // Ensure academic routes are linked if not already
router.use('/scheduling', require('./scheduling.routes')); // New route
router.use('/admin', require('./admin.routes'));

module.exports = router;

