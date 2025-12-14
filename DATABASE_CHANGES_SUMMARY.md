# Database Değişiklikleri ve Migration'lar - Özet

## 📋 MEVCUT MIGRATION'LAR

### Part 1 - Core Tables (Önceden Mevcut)
1. **20241205120000-create-core-part1-tables.js**
   - `departments` tablosu
   - `users` tablosu
   - `students` tablosu
   - `faculty` tablosu

2. **20241205130000-create-auth-token-tables.js**
   - `refresh_tokens` tablosu

3. **20241206090000-add-user-profile-fields.js**
   - User profile alanları

4. **20241210150000-add-account-lockout-fields.js**
   - Account lockout alanları

5. **20241210151000-create-activity-logs.js**
   - `activity_logs` tablosu

6. **20241210160000-add-2fa-fields.js**
   - 2FA alanları

---

### Part 2 - Academic Tables (Mevcut)
**20251213140000-create-part2-academic-tables.js**

Bu migration şunları oluşturur:

#### 1. `courses` Tablosu
```sql
- id (PK, AUTO_INCREMENT)
- code (STRING(20), UNIQUE, NOT NULL)
- name (STRING(150), NOT NULL)
- description (TEXT, NULLABLE)
- credits (INTEGER, DEFAULT: 3)
- ects (INTEGER, DEFAULT: 5)
- department_id (FK → departments.id, RESTRICT)
- syllabus_url (STRING, NULLABLE)
- created_at, updated_at, deleted_at (SOFT DELETE)
```

#### 2. `course_prerequisites` Tablosu (Junction Table)
```sql
- course_id (PK, FK → courses.id, CASCADE)
- prerequisite_id (PK, FK → courses.id, CASCADE)
- created_at, updated_at
```

**Amaç:** Dersler arası önkoşul ilişkilerini saklar (Many-to-Many)

#### 3. `course_sections` Tablosu
```sql
- id (PK, AUTO_INCREMENT)
- course_id (FK → courses.id, CASCADE)
- section_number (INTEGER, DEFAULT: 1)
- semester (STRING(20), NOT NULL) -- e.g., "2024-FALL"
- instructor_id (FK → users.id, RESTRICT)
- capacity (INTEGER, DEFAULT: 50)
- enrolled_count (INTEGER, DEFAULT: 0)
- schedule (JSONB, NULLABLE) -- Program bilgisi
- created_at, updated_at
```

**Schedule JSON Formatı:**
```json
[
  {
    "day": "Monday",
    "start": "09:00",
    "end": "12:00",
    "room_id": 1
  }
]
```

#### 4. `enrollments` Tablosu
```sql
- id (PK, AUTO_INCREMENT)
- student_id (FK → users.id, CASCADE)
- section_id (FK → course_sections.id, CASCADE)
- status (ENUM: 'ACTIVE', 'DROPPED', 'FAILED', 'PASSED', DEFAULT: 'ACTIVE')
- enrollment_date (DATE, DEFAULT: now())
- midterm_grade (FLOAT, NULLABLE)
- final_grade (FLOAT, NULLABLE)
- letter_grade (STRING(5), NULLABLE)
- grade_point (FLOAT, NULLABLE)
- created_at, updated_at
```

**Unique Constraint:**
- `unique_student_section_enrollment` on (`student_id`, `section_id`)

---

### Part 2 - Attendance Tables (Mevcut)
**20251213140500-create-part2-attendance-tables.js**

Bu migration şunları oluşturur:

#### 1. `classrooms` Tablosu
```sql
- id (PK, AUTO_INCREMENT)
- name (STRING(50), NOT NULL)
- building (STRING(100), NOT NULL)
- room_number (STRING(20), NULLABLE)
- capacity (INTEGER, DEFAULT: 30)
- latitude (DECIMAL(10,8), NOT NULL)
- longitude (DECIMAL(11,8), NOT NULL)
- features (JSONB, NULLABLE) -- e.g., ["Projector", "SmartBoard"]
- created_at, updated_at
```

#### 2. `attendance_sessions` Tablosu
```sql
- id (PK, AUTO_INCREMENT)
- section_id (FK → course_sections.id, CASCADE)
- start_time (DATE, NOT NULL)
- end_time (DATE, NULLABLE)
- status (ENUM: 'ACTIVE', 'CLOSED', DEFAULT: 'ACTIVE')
- qr_code (STRING, NULLABLE)
- qr_code_expires_at (DATE, NULLABLE)
- latitude (DECIMAL(10,8), NOT NULL)
- longitude (DECIMAL(11,8), NOT NULL)
- radius_meters (INTEGER, DEFAULT: 50)
- created_at, updated_at
```

#### 3. `attendance_records` Tablosu
```sql
- id (PK, AUTO_INCREMENT)
- session_id (FK → attendance_sessions.id, CASCADE)
- student_id (FK → users.id, CASCADE)
- check_in_time (DATE, NULLABLE)
- latitude (DECIMAL(10,8), NULLABLE)
- longitude (DECIMAL(11,8), NULLABLE)
- distance_from_center (FLOAT, NULLABLE)
- status (ENUM: 'PRESENT', 'ABSENT', 'EXCUSED', NOT NULL)
- is_flagged (BOOLEAN, DEFAULT: false)
- flag_reason (STRING, NULLABLE)
- created_at, updated_at
```

---

## ⚠️ EKSİK MIGRATION - ÖNEMLİ!

### `enrollments` Tablosuna Eksik Alanlar

**Model'de Var Ama Migration'da Yok:**

```javascript
// backend/models/enrollment.js
absence_hours_used: { type: DataTypes.INTEGER, defaultValue: 0 }
absence_limit: { type: DataTypes.INTEGER, defaultValue: 8 }
```

**Bu alanlar migration'da yok!** Yeni bir migration oluşturulmalı:

```javascript
// Yeni migration: 20251213141000-add-absence-fields-to-enrollments.js
await queryInterface.addColumn('enrollments', 'absence_hours_used', {
    type: Sequelize.INTEGER,
    allowNull: false,
    defaultValue: 0
});

await queryInterface.addColumn('enrollments', 'absence_limit', {
    type: Sequelize.INTEGER,
    allowNull: false,
    defaultValue: 8
});
```

---

## 🔄 BU SESSION'DA YAPILAN MODEL DEĞİŞİKLİKLERİ

### 1. Department Model - Association Eklendi ✅
**Dosya:** `backend/models/department.js`

**Değişiklik:**
```javascript
// Eklendi:
Department.hasMany(models.Course, { foreignKey: 'department_id', as: 'courses' });
```

**Açıklama:** Department ile Course arasındaki ilişki tanımlandı (zaten migration'da FK var).

---

### 2. Course Model - Prerequisites Association ✅
**Dosya:** `backend/models/course.js`

**Mevcut (Zaten Vardı):**
```javascript
Course.belongsToMany(models.Course, {
    as: 'Prerequisites',
    through: 'course_prerequisites',
    foreignKey: 'course_id',
    otherKey: 'prerequisite_id'
});
```

**Açıklama:** Course prerequisites ilişkisi zaten tanımlıydı.

---

### 3. Enrollment Model - Absence Fields ✅
**Dosya:** `backend/models/enrollment.js`

**Mevcut:**
```javascript
absence_hours_used: { type: DataTypes.INTEGER, defaultValue: 0 }
absence_limit: { type: DataTypes.INTEGER, defaultValue: 8 }
```

**Sorun:** Model'de var ama migration'da yok! ⚠️

---

## 📊 MIGRATION ÖZET TABLOSU

| Migration | Tablo | Durum | Notlar |
|-----------|-------|-------|--------|
| 20251213140000 | `courses` | ✅ | Soft delete destekli |
| 20251213140000 | `course_prerequisites` | ✅ | Junction table |
| 20251213140000 | `course_sections` | ✅ | JSONB schedule |
| 20251213140000 | `enrollments` | ⚠️ | `absence_hours_used`, `absence_limit` eksik |
| 20251213140500 | `classrooms` | ✅ | GPS koordinatları |
| 20251213140500 | `attendance_sessions` | ✅ | QR code desteği |
| 20251213140500 | `attendance_records` | ✅ | GPS tracking |

---

## 🎯 YAPILMASI GEREKENLER

### Öncelik 1: Eksik Migration Oluştur ⚠️

**Dosya:** `backend/migrations/20251213141000-add-absence-fields-to-enrollments.js`

```javascript
'use strict';

module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.addColumn('enrollments', 'absence_hours_used', {
            type: Sequelize.INTEGER,
            allowNull: false,
            defaultValue: 0
        });

        await queryInterface.addColumn('enrollments', 'absence_limit', {
            type: Sequelize.INTEGER,
            allowNull: false,
            defaultValue: 8
        });
    },

    async down(queryInterface, Sequelize) {
        await queryInterface.removeColumn('enrollments', 'absence_hours_used');
        await queryInterface.removeColumn('enrollments', 'absence_limit');
    }
};
```

**Çalıştırma:**
```bash
cd backend
npm run db:migrate
```

---

## 📝 VERİTABANI ŞEMASI ÖZET

### İlişkiler (Relationships)

```
departments (1) ──< (N) courses
courses (1) ──< (N) course_sections
courses (N) ──<─> (N) courses (prerequisites)
course_sections (1) ──< (N) enrollments
course_sections (1) ──< (N) attendance_sessions
users (1) ──< (N) enrollments (as student)
users (1) ──< (N) course_sections (as instructor)
attendance_sessions (1) ──< (N) attendance_records
users (1) ──< (N) attendance_records (as student)
classrooms (1) ──< (N) course_sections.schedule[].room_id (JSONB içinde)
```

---

## ✅ SONUÇ

**Mevcut Migration'lar:** 8 adet ✅
**Eksik Migration:** 1 adet (absence fields) ⚠️
**Model Değişiklikleri:** 1 adet (Department association) ✅

**Aksiyon Gerekiyor:** Eksik migration oluşturulmalı!

