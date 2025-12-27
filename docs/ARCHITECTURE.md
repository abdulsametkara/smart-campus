# Smart Campus - System Architecture

## 1. Overview
The Smart Campus application is a full-stack web platform designed to digitize campus operations. It follows a micro-service-ready monolithic architecture, separating concerns between a robust RESTful API backend and a dynamic Single Page Application (SPA) frontend.

## 2. Technology Stack

### Backend
- **Runtime:** Node.js (v16+)
- **Framework:** Express.js (v5)
- **Database:** PostgreSQL (v14) with Sequelize ORM
- **Authentication:** JWT (Access & Refresh Tokens)
- **Real-time:** Socket.IO
- **Task Scheduling:** Node-cron
- **Logging:** Winston + Morgan
- **Security:** Helmet, CORS, Rate-limiting, Bcrypt

### Frontend
- **Framework:** React.js (v18)
- **Routing:** React Router DOM (v6)
- **UI Component:** Material UI (MUI) v5
- **Charts:** Chart.js & React-Chartjs-2
- **State Management:** React Context API (Auth, Socket)
- **HTTP Client:** Axios (Interceptors for auth)

### DevOps & Infrastructure
- **Containerization:** Docker & Docker Compose
- **Web Server:** Nginx (Frontend reverse proxy)
- **CI/CD:** GitHub Actions
- **Monitoring:** Health checks

## 3. High-Level Architecture Diagram
[User/Browser] <--> [Nginx/Frontend Container] <--> [Express Container] <--> [PostgreSQL]
                                                         ^
                                                         | (WebSockets)
[IoT Sensors] <------------------------------------------+

## 4. Modules & Data Flow
1. **User Service:** Handles Registration, Login, Profile mgmt.
2. **Academic Service:** Courses, Sections, Enrollments, Grades.
3. **Attendance Service:** QR generation (Backend), Scanning (Mobile/Frontend), Geo-fencing.
4. **Cafeteria Service:** Menus, Meal Reservations, QR Validation.
5. **Wallet Service:** Top-up, Cards, Transactions.
6. **Notification System:** Real-time push, Email, Persistent storage.
7. **IoT System:** Sensor data ingestion, Dashboard streaming.

## 5. Design Patterns
- **MVC (Model-View-Controller):** Standard backend structure.
- **Repository Pattern (via ORM):** Sequelize models abstract DB logic.
- **Publisher-Subscriber:** Socket.IO for real-time events.
- **Middleware Chain:** Auth, Validation, Rate-limiting pipeline.
