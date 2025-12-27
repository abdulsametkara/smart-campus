# Smart Campus - System Architecture (Final)

## 1. Overview

Smart Campus is a full-stack university management platform following a modular monolithic architecture with micro-service readiness. The system integrates academic operations, attendance tracking, cafeteria services, and campus events.

---

## 2. High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        CLIENT LAYER                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐           │
│  │  Web Browser │  │  Mobile App  │  │  IoT Sensors │           │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘           │
└─────────┼─────────────────┼─────────────────┼───────────────────┘
          │                 │                 │
          ▼                 ▼                 ▼
┌─────────────────────────────────────────────────────────────────┐
│                      NGINX (Reverse Proxy)                       │
│                    Port 80 → Frontend Container                  │
└─────────────────────────────────────────────────────────────────┘
          │
          ▼
┌─────────────────────────────────────────────────────────────────┐
│                      APPLICATION LAYER                           │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │              EXPRESS.JS API SERVER (Port 5000)            │   │
│  │  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐         │   │
│  │  │  Auth   │ │Academic │ │ Attend  │ │  Meal   │         │   │
│  │  │Controller│ │Controller│ │Controller│ │Controller│       │   │
│  │  └─────────┘ └─────────┘ └─────────┘ └─────────┘         │   │
│  │  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐         │   │
│  │  │  Event  │ │ Wallet  │ │Analytics│ │   IoT   │         │   │
│  │  │Controller│ │Controller│ │Controller│ │Controller│       │   │
│  │  └─────────┘ └─────────┘ └─────────┘ └─────────┘         │   │
│  └──────────────────────────────────────────────────────────┘   │
│                              │                                   │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │                    SOCKET.IO SERVER                       │   │
│  │           Real-time Notifications & IoT Streaming         │   │
│  └──────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
          │
          ▼
┌─────────────────────────────────────────────────────────────────┐
│                       DATA LAYER                                 │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │              POSTGRESQL DATABASE (Port 5432)              │   │
│  │                      30+ Tables                           │   │
│  │   Users, Courses, Enrollments, Grades, Attendance,        │   │
│  │   Meals, Wallets, Events, Notifications, Sensors...       │   │
│  └──────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

---

## 3. Technology Stack

### Backend
| Component | Technology | Version |
|-----------|-----------|---------|
| Runtime | Node.js | 18+ |
| Framework | Express.js | 4.x |
| Database | PostgreSQL | 14+ |
| ORM | Sequelize | 6.x |
| Real-time | Socket.IO | 4.x |
| Auth | JWT + bcrypt | - |
| 2FA | Speakeasy (TOTP) | - |
| Scheduler | node-cron | - |
| Logging | Winston + Morgan | - |
| Security | Helmet, CORS, Rate-limit | - |

### Frontend
| Component | Technology | Version |
|-----------|-----------|---------|
| Framework | React | 18.x |
| UI Library | Material UI (MUI) | 5.x |
| Charts | Chart.js + react-chartjs-2 | - |
| Routing | React Router DOM | 6.x |
| HTTP | Axios | - |
| State | React Context API | - |
| i18n | Custom (translations.js) | TR/EN |

### DevOps
| Component | Technology |
|-----------|-----------|
| Containerization | Docker + Docker Compose |
| Web Server | Nginx |
| CI/CD | GitHub Actions (optional) |

---

## 4. Module Breakdown

### Core Modules
1. **Authentication** - Register, Login, JWT, 2FA, Password Reset
2. **User Management** - Profile, Roles (Student/Faculty/Admin)
3. **Academic** - Courses, Sections, Enrollments, Prerequisites
4. **Grading** - Exams, Grades, Transcripts (PDF)
5. **Attendance** - GPS/QR sessions, Anti-spoofing, Excuses

### Campus Life Modules
6. **Cafeteria** - Menus, Reservations, QR validation
7. **Wallet** - Balance, Top-up, Transactions
8. **Events** - Registration, Check-in, Capacity management

### Admin Modules
9. **Analytics** - Dashboard, Reports, Export (Excel/PDF)
10. **Notifications** - Real-time, Preferences, Broadcast
11. **IoT** - Sensor data, Streaming (Bonus)
12. **Scheduling** - CSP-based auto-scheduling (Bonus)

---

## 5. Design Patterns

| Pattern | Implementation |
|---------|---------------|
| **MVC** | Controllers handle requests, Models define data, Views (React) render UI |
| **Repository** | Sequelize models abstract database operations |
| **Middleware Chain** | Auth → Validation → Rate-limit → Controller |
| **Pub-Sub** | Socket.IO for real-time event broadcasting |
| **Service Layer** | Business logic separated from controllers |
| **Factory** | QR code generation with configurable options |

---

## 6. Data Flow Example: Meal Reservation

```
1. User selects menu item on frontend
2. POST /api/v1/meals/reserve → mealController
3. mealService.makeReservation()
   ├── Check wallet balance
   ├── Deduct payment (walletService)
   ├── Generate QR code (qrService)
   └── Create reservation record
4. Emit 'notification' via Socket.IO
5. Return QR code to frontend
6. User presents QR at cafeteria
7. Staff scans → POST /api/v1/meals/use
8. Reservation marked as 'used'
```

---

## 7. Security Measures

- **Authentication**: JWT with short-lived access tokens + refresh tokens
- **Password**: bcrypt hashing with salt rounds
- **2FA**: TOTP-based (Google Authenticator compatible)
- **Rate Limiting**: 100 requests/15min per IP
- **Input Validation**: Joi/Yup schemas
- **CORS**: Configured for allowed origins
- **SQL Injection**: Sequelize parameterized queries
- **Logging**: Winston for audit trails
