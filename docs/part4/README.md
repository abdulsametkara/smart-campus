# Smart Campus - Final Project (Part 4)

**Version:** 4.0-FINAL  
**Date:** December 27, 2025  
**Status:** ✅ Completed

---

## 🎯 Project Overview

Smart Campus is a comprehensive digital university management platform integrating:
- **Academic Management** - Courses, Enrollments, Grades, Transcripts
- **GPS/QR Attendance** - Real-time tracking with anti-spoofing
- **Cafeteria Services** - Meal reservations, Wallet, QR validation
- **Event Management** - Registration, Check-in, Analytics
- **IoT Integration** - Sensor monitoring (Bonus)
- **Real-time Notifications** - WebSocket-powered alerts

---

## 🛠️ Technology Stack

| Layer | Technologies |
|-------|-------------|
| **Backend** | Node.js, Express.js, PostgreSQL, Sequelize, Socket.IO |
| **Frontend** | React 18, Material UI, Chart.js, React Router |
| **Auth** | JWT (Access/Refresh), bcrypt, 2FA (TOTP) |
| **DevOps** | Docker, Docker Compose, Nginx |
| **Testing** | Jest, Supertest |

---

## 📂 Project Structure

```
smart-campus/
├── backend/
│   ├── src/
│   │   ├── controllers/    # 15+ controllers
│   │   ├── routes/         # 15+ route files
│   │   ├── services/       # Business logic
│   │   ├── middleware/     # Auth, validation
│   │   └── utils/          # Helpers
│   ├── models/             # 30+ Sequelize models
│   ├── jobs/               # Cron jobs (5 files)
│   └── tests/              # Unit + Integration
├── frontend/
│   └── src/
│       ├── pages/          # 40+ pages
│       ├── components/     # Reusable UI
│       └── services/       # API clients
├── docs/                   # Documentation
└── docker-compose.yml
```

---

## ⚡ Quick Start

### Docker (Recommended)
```bash
docker-compose up --build
```
- Frontend: http://localhost:80
- Backend: http://localhost:5000

### Local Development
```bash
# Backend
cd backend && npm install && npm run dev

# Frontend
cd frontend && npm install && npm start
```

---

## 📚 Documentation Index

| Document | Description |
|----------|-------------|
| [ARCHITECTURE.md](./ARCHITECTURE.md) | System design, tech stack, patterns |
| [API_DOCUMENTATION.md](./API_DOCUMENTATION.md) | 60+ REST endpoints |
| [DATABASE_SCHEMA.md](./DATABASE_SCHEMA.md) | 30+ tables, ER diagrams |
| [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md) | Docker, cloud deployment |
| [USER_MANUAL.md](./USER_MANUAL.md) | Student/Faculty/Admin guides |
| [DEVELOPER_GUIDE.md](./DEVELOPER_GUIDE.md) | Code structure, conventions |
| [TEST_REPORT.md](./TEST_REPORT.md) | Coverage, results |
| [ANALYTICS_GUIDE.md](./ANALYTICS_GUIDE.md) | Dashboard interpretation |
| [PROJECT_RETROSPECTIVE.md](./PROJECT_RETROSPECTIVE.md) | Lessons learned |

---

## ✨ Key Features (Part 4)

### Analytics Dashboard
- Academic Performance (GPA distribution, at-risk students)
- Attendance Analytics (trends, critical absences)
- Meal Usage (daily counts, peak hours)
- Event Analytics (popularity, check-in rates)

### Notification System
- Real-time WebSocket notifications
- Email/SMS/Push preferences
- Admin broadcast capability

### Background Jobs
- Daily absence warnings
- Event/Meal reminders
- Database backup

### Security
- Rate limiting
- Winston logging
- Input sanitization

---

## 🧪 Test Coverage

```
Test Suites: 9 passed
Tests:       58 passed
Coverage:    ~70% statements
```

---

## 👥 Contributors

- Backend Development
- Frontend Development
- DevOps & Deployment
- Documentation

---

## 📄 License

MIT License - Educational Project
