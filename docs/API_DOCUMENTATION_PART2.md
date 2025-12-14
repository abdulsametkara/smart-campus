# Part 2 API Documentation

## Academic Management Endpoints

### Courses
*   `GET /api/v1/courses`
*   `GET /api/v1/courses/:id`
*   `POST /api/v1/courses` (Admin)

### Sections
*   `GET /api/v1/sections`
*   `GET /api/v1/sections/:id`

### Enrollments
*   `POST /api/v1/enrollments`
    *   **Body**: `{ "section_id": 123 }`
    *   **Checks**: Prerequisites, Capacity, Time Conflict.
*   `DELETE /api/v1/enrollments/:id` (Drop)

### Grades
*   `POST /api/v1/grades`
*   `GET /api/v1/grades/transcript`

## Attendance Endpoints

### Sessions
*   `POST /api/v1/attendance/sessions`
*   `GET /api/v1/attendance/sessions/my-sessions`

### Check-in
*   `POST /api/v1/attendance/checkin`
    *   **Body**: `{ "latitude": 41.0, "longitude": 29.0, "qr_code": "..." }`
    *   **Logic**: Haversine distance check (15m radius).

### Excuses
*   `POST /api/v1/excuses`
