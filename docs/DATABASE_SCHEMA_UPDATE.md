# Part 2: Database Schema (Shared Contract)

> [!NOTE]
> This document serves as the **Single Source of Truth** for both Developer 1 (Academic) and Developer 2 (Attendance). Both developers must adhere to these table definitions to ensure integration points (like `section_id` and `student_id`) work correctly.

## 1. Academic Management (Developer 1)

### `Departments` (Existing/New)
| Column | Type | Description |
| :--- | :--- | :--- |
| `id` | SERIAL (PK) | |
| `name` | VARCHAR | e.g. "Computer Engineering" |
| `code` | VARCHAR | e.g. "CENG" |
| `faculty_name` | VARCHAR | e.g. "Engineering" |

### `Courses`
| Column | Type | Description |
| :--- | :--- | :--- |
| `id` | SERIAL (PK) | |
| `code` | VARCHAR | e.g. "CENG101" (Unique) |
| `name` | VARCHAR | e.g. "Intro to Programming" |
| `description` | TEXT | |
| `credits` | INTEGER | e.g. 3 |
| `ects` | INTEGER | e.g. 5 |
| `department_id` | INTEGER (FK) | -> Departments.id |
| `syllabus_url` | VARCHAR | Optional PDF link |
| `deleted_at` | TIMESTAMP | Soft delete support |

### `CoursePrerequisites`
| Column | Type | Description |
| :--- | :--- | :--- |
| `course_id` | INTEGER (FK) | -> Courses.id |
| `prerequisite_id` | INTEGER (FK) | -> Courses.id |

### `CourseSections`
> [!IMPORTANT]
> **Integration Point:** Developer 2 needs `id` from this table for `AttendanceSessions`.
| Column | Type | Description |
| :--- | :--- | :--- |
| `id` | SERIAL (PK) | **Used by Dev 2** |
| `course_id` | INTEGER (FK) | -> Courses.id |
| `section_number` | INTEGER | e.g. 1, 2 |
| `semester` | VARCHAR | e.g. "2024-FALL" |
| `instructor_id` | INTEGER (FK) | -> Users.id (Faculty) |
| `capacity` | INTEGER | e.g. 50 |
| `enrolled_count` | INTEGER | Default 0 |
| `schedule` | JSONB | e.g. `[{"day": "Mon", "start": "09:00", "end": "12:00", "room_id": 1}]` |

### `Enrollments`
> [!IMPORTANT]
> **Integration Point:** Developer 2 needs to check if `student_id` exists here for a specific `section_id`.
| Column | Type | Description |
| :--- | :--- | :--- |
| `id` | SERIAL (PK) | |
| `student_id` | INTEGER (FK) | -> Users.id (Student) |
| `section_id` | INTEGER (FK) | -> CourseSections.id |
| `status` | ENUM | 'ACTIVE', 'DROPPED', 'FAILED' |
| `enrollment_date` | TIMESTAMP | |
| `midterm_grade` | FLOAT | |
| `final_grade` | FLOAT | |
| `letter_grade` | VARCHAR | AA, BA, etc. |
| `gpa_point` | FLOAT | 4.0, 3.5, etc. |

---

## 2. GPS Attendance (Developer 2)

### `Classrooms`
| Column | Type | Description |
| :--- | :--- | :--- |
| `id` | SERIAL (PK) | **Used in CourseSections.schedule** |
| `name` | VARCHAR | e.g. "B-201" |
| `building` | VARCHAR | e.g. "Engineering Block B" |
| `capacity` | INTEGER | |
| `latitude` | DECIMAL(10, 8) | Fixed GPS Lat |
| `longitude` | DECIMAL(11, 8) | Fixed GPS Lng |

### `AttendanceSessions`
| Column | Type | Description |
| :--- | :--- | :--- |
| `id` | SERIAL (PK) | |
| `section_id` | INTEGER (FK) | -> CourseSections.id |
| `instructor_id` | INTEGER (FK) | -> Users.id |
| `start_time` | TIMESTAMP | |
| `end_time` | TIMESTAMP | |
| `latitude` | DECIMAL | Dynamic session location (or Classroom loc) |
| `longitude` | DECIMAL | |
| `radius` | INTEGER | Default 15 (meters) |
| `qr_code` | VARCHAR | Unique hash |
| `status` | ENUM | 'ACTIVE', 'CLOSED' |

### `AttendanceRecords`
| Column | Type | Description |
| :--- | :--- | :--- |
| `id` | SERIAL (PK) | |
| `session_id` | INTEGER (FK) | -> AttendanceSessions.id |
| `student_id` | INTEGER (FK) | -> Users.id |
| `check_in_time` | TIMESTAMP | |
| `latitude` | DECIMAL | Student's location |
| `longitude` | DECIMAL | |
| `distance` | FLOAT | Distance to center (meters) |
| `status` | ENUM | 'PRESENT', 'ABSENT', 'EXCUSED' |
| `is_flagged` | BOOLEAN | Spoofing detected? |

### `ExcuseRequests`
| Column | Type | Description |
| :--- | :--- | :--- |
| `id` | SERIAL (PK) | |
| `student_id` | INTEGER (FK) | |
| `session_id` | INTEGER (FK) | Optional (General excuse or Specific session) |
| `title` | VARCHAR | e.g. "Medical Report" |
| `description` | TEXT | |
| `document_url` | VARCHAR | Path to uploaded file |
| `status` | ENUM | 'PENDING', 'APPROVED', 'REJECTED' |

---

## Common Enumerations
*   **User Roles**: 'admin', 'faculty', 'student'
*   **Days**: 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'
