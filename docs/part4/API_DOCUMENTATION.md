# Smart Campus - API Documentation (Complete)

**Base URL:** `http://localhost:5000/api/v1`  
**Authentication:** Bearer Token (JWT)

---

## Table of Contents
1. [Authentication](#1-authentication)
2. [User Management](#2-user-management)
3. [Academic](#3-academic)
4. [Grading](#4-grading)
5. [Attendance](#5-attendance)
6. [Meals & Cafeteria](#6-meals--cafeteria)
7. [Wallet](#7-wallet)
8. [Events](#8-events)
9. [Notifications](#9-notifications)
10. [Analytics](#10-analytics)
11. [IoT Sensors](#11-iot-sensors)
12. [Scheduling](#12-scheduling)

---

## 1. Authentication

### POST /auth/register
Create a new user account.

**Body:**
```json
{
  "email": "student@campus.edu",
  "password": "Password123!",
  "full_name": "Ali Yılmaz",
  "role": "student",
  "student_number": "2024001"
}
```

### POST /auth/login
Authenticate user and receive tokens.

**Body:**
```json
{
  "email": "student@campus.edu",
  "password": "Password123!"
}
```

**Response:**
```json
{
  "accessToken": "eyJhbG...",
  "refreshToken": "eyJhbG...",
  "user": { "id": 1, "role": "student" }
}
```

### POST /auth/refresh
Refresh access token.

### POST /auth/forgot-password
### POST /auth/reset-password
### POST /auth/2fa/setup
### POST /auth/2fa/verify-login

---

## 2. User Management

### GET /users/me
Get current user profile. **Auth: Required**

### PUT /users/me
Update profile. **Auth: Required**

### POST /users/profile-picture
Upload avatar (multipart/form-data). **Auth: Required**

### GET /users (Admin)
List all users with pagination.

### PUT /users/:id (Admin)
Update any user.

### DELETE /users/:id (Admin)
Soft delete user.

---

## 3. Academic

### GET /academic/courses
List all courses with department filter.

### GET /academic/courses/:id
Get course details with prerequisites.

### POST /academic/courses (Admin)
Create new course.

### GET /academic/sections
List course sections.

**Query:** `?course_id=1&semester=Fall`

### POST /academic/sections (Admin)
Create section with instructor and schedule.

### GET /academic/enrollments
Get student's enrollments.

### POST /academic/enrollments
Enroll in a section.

**Body:**
```json
{
  "section_id": 5
}
```

**Validations:**
- Prerequisite check
- Schedule conflict check
- Capacity check

### DELETE /academic/enrollments/:id
Drop enrollment.

### GET /academic/advisor/students (Faculty)
List advisees.

---

## 4. Grading

### GET /grading/exams
List exams for a section.

### POST /grading/exams (Faculty)
Create exam.

**Body:**
```json
{
  "section_id": 5,
  "name": "Midterm",
  "type": "midterm",
  "weight": 30,
  "date": "2024-04-15"
}
```

### POST /grading/grades (Faculty)
Submit grades for an exam.

**Body:**
```json
{
  "exam_id": 1,
  "grades": [
    { "student_id": 10, "score": 85 },
    { "student_id": 11, "score": 72 }
  ]
}
```

### GET /grading/transcript
Get student's transcript.

### GET /grading/transcript/pdf
Download PDF transcript.

---

## 5. Attendance

### GET /attendance/sessions (Faculty)
List attendance sessions for instructor's sections.

### POST /attendance/sessions (Faculty)
Start new attendance session.

**Body:**
```json
{
  "section_id": 5,
  "type": "qr",
  "latitude": 41.0082,
  "longitude": 28.9784,
  "radius": 50,
  "duration_minutes": 15
}
```

### POST /attendance/check-in (Student)
Check in to session.

**Body:**
```json
{
  "session_id": 1,
  "qr_code": "encrypted_qr_data",
  "latitude": 41.0083,
  "longitude": 28.9785
}
```

**Validations:**
- Distance from classroom (Haversine)
- Speed check (GPS spoofing detection)
- Mock location detection

### GET /attendance/my-attendance (Student)
Get attendance summary.

### POST /attendance/excuses (Student)
Submit excuse request.

### GET /attendance/excuses (Faculty)
Review excuse requests.

### PUT /attendance/excuses/:id (Faculty)
Approve/Reject excuse.

---

## 6. Meals & Cafeteria

### GET /meals/menus
List menus for date range.

**Query:** `?start_date=2024-04-01&end_date=2024-04-07`

### GET /meals/cafeterias
List cafeterias.

### POST /meals/reserve
Make meal reservation.

**Body:**
```json
{
  "menu_id": 15
}
```

**Process:**
1. Check wallet balance
2. Deduct payment
3. Generate QR code
4. Create reservation

### GET /meals/reservations
Get user's reservations.

### DELETE /meals/reservations/:id
Cancel reservation (refund applied).

### POST /meals/use
Mark reservation as used (staff endpoint).

**Body:**
```json
{
  "reservation_id": 10,
  "qr_code": "scanned_data"
}
```

---

## 7. Wallet

### GET /wallet
Get wallet balance.

### POST /wallet/topup
Add funds.

**Body:**
```json
{
  "amount": 100,
  "payment_method": "credit_card"
}
```

### GET /wallet/transactions
Get transaction history.

### POST /wallet/cards
Save payment card.

### DELETE /wallet/cards/:id
Remove saved card.

---

## 8. Events

### GET /events
List events with filters.

**Query:** `?category=Seminer&status=published&page=1`

### GET /events/:id
Get event details.

### POST /events (Admin)
Create event.

### POST /events/:id/register
Register for event.

### DELETE /events/:id/registrations/:regId
Cancel registration.

### POST /events/:id/check-in (Staff)
Check in attendee.

**Body:**
```json
{
  "registration_id": 5,
  "qr_code": "scanned_data"
}
```

### GET /events/:id/registrations (Admin)
List all registrations.

---

## 9. Notifications

### GET /notifications
List user's notifications.

**Query:** `?page=1&limit=10&isRead=false`

### PUT /notifications/:id/read
Mark as read.

### PUT /notifications/mark-all-read
Mark all as read.

### DELETE /notifications/:id
Delete notification.

### GET /notifications/preferences
Get notification settings.

### PUT /notifications/preferences
Update preferences.

**Body:**
```json
{
  "email_academic": true,
  "email_attendance": true,
  "push_meal": false
}
```

### POST /notifications/send (Admin)
Broadcast notification.

---

## 10. Analytics

### GET /analytics/dashboard
Admin dashboard stats.

**Response:**
```json
{
  "totalUsers": 1250,
  "activeUsersToday": 456,
  "totalCourses": 120,
  "attendanceRate": 87.5,
  "mealReservationsToday": 890
}
```

### GET /analytics/academic-performance
GPA distribution, at-risk students.

### GET /analytics/attendance
Attendance rates, trends.

### GET /analytics/meal-usage
Daily counts, peak hours.

### GET /analytics/events
Popular events, check-in rates.

### GET /analytics/export/:type
Export report (Excel/PDF/CSV).

**Types:** `academic`, `attendance`, `meal`, `event`

---

## 11. IoT Sensors

### GET /iot/sensors
List all sensors.

### GET /iot/sensors/:id
Get sensor details.

### GET /iot/sensors/:id/data
Get historical readings.

**Query:** `?start=2024-04-01&end=2024-04-07&aggregation=hourly`

### POST /iot/sensors/:id/data
Submit sensor reading (IoT device).

**WebSocket:** Real-time streaming via Socket.IO on `sensor:data` channel.

---

## 12. Scheduling

### POST /scheduling/generate (Admin)
Generate schedule using CSP algorithm.

**Body:**
```json
{
  "semester": "Fall"
}
```

### POST /scheduling/save (Admin)
Save generated schedule to database.

---

## Error Codes

| Code | Description |
|------|-------------|
| 400 | Bad Request - Validation error |
| 401 | Unauthorized - Missing/invalid token |
| 403 | Forbidden - Insufficient permissions |
| 404 | Not Found - Resource doesn't exist |
| 409 | Conflict - Duplicate entry |
| 429 | Too Many Requests - Rate limited |
| 500 | Server Error |

---

## Rate Limits

- **General:** 100 requests / 15 minutes
- **Auth endpoints:** 10 requests / 15 minutes
- **File upload:** 5 requests / minute
