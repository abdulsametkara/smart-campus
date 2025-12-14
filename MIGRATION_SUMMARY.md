# Migration ve Database Değişiklikleri - Özet

## 📋 BU SESSION'DA OLUŞTURULAN MIGRATION

### ✅ Yeni Migration: `20251213141000-add-absence-fields-to-enrollments.js`

**Amaç:** `enrollments` tablosuna devamsızlık takibi için alanlar ekler.

**Eklenen Alanlar:**
1. `absence_hours_used` (INTEGER, DEFAULT: 0)
   - Öğrencinin kullandığı toplam devamsızlık saati
   
2. `absence_limit` (INTEGER, DEFAULT: 8)
   - Maksimum izin verilen devamsızlık saati (varsayılan: 8 saat)

**Çalıştırma:**
```bash
cd backend
npm run db:migrate
```

---

## 📊 MEVCUT MIGRATION'LAR (Önceden Mevcut)

### Part 1 - Core Tables
1. ✅ `20241205120000-create-core-part1-tables.js`
   - departments, users, students, faculty

2. ✅ `20241205130000-create-auth-token-tables.js`
   - refresh_tokens

3. ✅ `20241206090000-add-user-profile-fields.js`
   - User profile alanları

4. ✅ `20241210150000-add-account-lockout-fields.js`
   - Account lockout

5. ✅ `20241210151000-create-activity-logs.js`
   - activity_logs

6. ✅ `20241210160000-add-2fa-fields.js`
   - 2FA alanları

### Part 2 - Academic Tables
7. ✅ `20251213140000-create-part2-academic-tables.js`
   - courses
   - course_prerequisites (junction table)
   - course_sections
   - enrollments

### Part 2 - Attendance Tables
8. ✅ `20251213140500-create-part2-attendance-tables.js`
   - classrooms
   - attendance_sessions
   - attendance_records

### Part 2 - Enrollment Absence Fields (YENİ)
9. ✅ `20251213141000-add-absence-fields-to-enrollments.js` ← **YENİ**

---

## 🔄 MODEL DEĞİŞİKLİKLERİ

### 1. Department Model
**Dosya:** `backend/models/department.js`

**Eklenen:**
```javascript
Department.hasMany(models.Course, { 
    foreignKey: 'department_id', 
    as: 'courses' 
});
```

**Açıklama:** Department-Course ilişkisi tanımlandı (migration'da FK zaten vardı).

---

## 📝 VERİTABANI ŞEMASI

### `enrollments` Tablosu (Güncel)

```sql
CREATE TABLE enrollments (
    id SERIAL PRIMARY KEY,
    student_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    section_id INTEGER NOT NULL REFERENCES course_sections(id) ON DELETE CASCADE,
    status ENUM('ACTIVE', 'DROPPED', 'FAILED', 'PASSED') DEFAULT 'ACTIVE',
    enrollment_date DATE DEFAULT now(),
    midterm_grade FLOAT,
    final_grade FLOAT,
    letter_grade VARCHAR(5),
    grade_point FLOAT,
    absence_hours_used INTEGER DEFAULT 0,  -- ← YENİ
    absence_limit INTEGER DEFAULT 8,         -- ← YENİ
    created_at TIMESTAMP NOT NULL,
    updated_at TIMESTAMP NOT NULL,
    UNIQUE(student_id, section_id)
);
```

---

## ✅ SONUÇ

**Toplam Migration:** 9 adet
- 8 adet önceden mevcut ✅
- 1 adet bu session'da oluşturuldu ✅

**Model Değişiklikleri:** 1 adet (Department association) ✅

**Durum:** Tüm migration'lar hazır! ✅

