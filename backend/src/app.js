const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const authRoutes = require('./routes/auth.routes');
const userRoutes = require('./routes/user.routes');
const departmentRoutes = require('./routes/department.routes');

const app = express();

const { limiter } = require('./middleware/rateLimiter');
const logger = require('./utils/logger');
const morgan = require('morgan');

app.use(cors());
app.use(express.json());
app.use(morgan('combined', { stream: { write: message => logger.info(message.trim()) } }));
app.use('/api', limiter); // Apply rate limiting to all API routes
app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));

app.get('/', (req, res) => {
  res.json({ message: 'Smart Campus API is running' });
});

app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/users', userRoutes);
app.use('/api/v1/departments', departmentRoutes);
app.use('/api/v1/admin', require('./routes/admin.routes'));
app.use('/api/v1/attendance', require('../routes/attendance.routes'));
app.use('/api/v1/academic', require('./routes/academic.routes'));
app.use('/api/v1/excuses', require('./routes/excuse.routes'));
app.use('/api/v1/grading', require('./routes/grading.routes'));
app.use('/api/v1/notifications', require('./routes/notification.routes'));
app.use('/api/v1/iot', require('./routes/iot.routes'));
app.use('/api/v1/announcements', require('./routes/announcement.routes'));
app.use('/api/v1/wallet', require('./routes/wallet.routes'));
app.use('/api/v1/analytics', require('./routes/analytics.routes'));
app.use('/api/v1/meals', require('./routes/meal.routes'));
app.use('/api/v1/events', require('./routes/event.routes'));
app.use('/api/v1/scheduling', require('./routes/scheduling.routes'));

// Events Routes (Developer 2)
app.use('/api/v1/events', require('./routes/event.routes'));

// Scheduling & Reservation Routes (Developer 3)
app.use('/api/v1/scheduling', require('./routes/scheduling.routes'));
app.use('/api/v1/reservations', require('./routes/reservation.routes'));

module.exports = app;
