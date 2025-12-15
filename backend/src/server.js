const http = require('http');
const app = require('./app');
const { Server } = require('socket.io');

const PORT = process.env.PORT || 5000;

// Create HTTP server
const server = http.createServer(app);

// Initialize Socket.IO
const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_URL || "http://localhost:3000",
    methods: ["GET", "POST"],
    credentials: true
  }
});

// Store active sessions for real-time updates
const activeSessions = new Map();

// Socket.IO connection handling
io.on('connection', (socket) => {
  console.log(`[WebSocket] Client connected: ${socket.id}`);

  // Join a specific session room (for instructors and students)
  socket.on('join-session', (sessionId) => {
    socket.join(`session-${sessionId}`);
    console.log(`[WebSocket] ${socket.id} joined session-${sessionId}`);
  });

  // Leave session room
  socket.on('leave-session', (sessionId) => {
    socket.leave(`session-${sessionId}`);
    console.log(`[WebSocket] ${socket.id} left session-${sessionId}`);
  });

  // Join instructor dashboard room
  socket.on('join-instructor-dashboard', (instructorId) => {
    socket.join(`instructor-${instructorId}`);
    console.log(`[WebSocket] Instructor ${instructorId} joined dashboard`);
  });

  socket.on('disconnect', () => {
    console.log(`[WebSocket] Client disconnected: ${socket.id}`);
  });
});

// Export io for use in controllers
app.set('io', io);

// Start server
server.listen(PORT, () => {
  console.log(`Backend server listening on port ${PORT}`);
  console.log(`WebSocket server ready`);

  // Start Background Jobs
  const absenceJob = require('../jobs/absenceWarning.job');
  absenceJob.start();

  // Start session auto-closer
  const { startSessionCloser } = require('../jobs/sessionCloser.job');
  startSessionCloser();
});

module.exports = { server, io };
