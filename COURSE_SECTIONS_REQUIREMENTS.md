# Ders Bölümleri (Course Sections) - Gereksinimler

## 📋 Genel Bakış

Ders bölümleri (sections), bir dersin farklı zaman dilimlerinde ve farklı öğretim üyeleriyle açılan alt gruplarıdır. Her bölümün kendi kapasitesi, programı (schedule) ve öğretim üyesi vardır.

---

## 🗄️ Veritabanı Yapısı

### `course_sections` Tablosu

| Kolon | Tip | Açıklama |
|-------|-----|----------|
| `id` | INTEGER (PK) | Bölüm ID'si |
| `course_id` | INTEGER (FK) | Hangi derse ait |
| `section_number` | INTEGER | Bölüm numarası (1, 2, 3...) |
| `semester` | VARCHAR(20) | Dönem (örn: "2024-FALL", "2025-SPRING") |
| `instructor_id` | INTEGER (FK) | Öğretim üyesi (Users tablosundan, role='faculty') |
| `capacity` | INTEGER | Maksimum öğrenci sayısı (örn: 50) |
| `enrolled_count` | INTEGER | Şu an kayıtlı öğrenci sayısı (default: 0) |
| `schedule` | JSONB | Program bilgisi (aşağıda detay) |

### Schedule JSON Formatı

```json
[
  {
    "day": "Monday",
    "start": "09:00",
    "end": "12:00",
    "room_id": 1
  },
  {
    "day": "Wednesday",
    "start": "09:00",
    "end": "12:00",
    "room_id": 1
  }
]
```

**Not:** `room_id` opsiyoneldir, `classrooms` tablosuna referans verir.

---

## 🔌 API Endpoint'leri

### 1. GET /api/v1/sections
**Açıklama:** Tüm ders bölümlerini listele

**Yetkilendirme:** Herkes (public veya authenticated)

**Query Parametreleri:**
- `course_id` (opsiyonel): Belirli bir dersin bölümlerini filtrele
- `semester` (opsiyonel): Dönem filtreleme (örn: "2024-FALL")
- `instructor_id` (opsiyonel): Belirli öğretim üyesinin bölümlerini filtrele
- `page` (opsiyonel): Sayfa numarası (pagination)
- `limit` (opsiyonel): Sayfa başına kayıt sayısı

**Response Örneği:**
```json
{
  "sections": [
    {
      "id": 1,
      "course_id": 5,
      "section_number": 1,
      "semester": "2024-FALL",
      "instructor_id": 3,
      "capacity": 50,
      "enrolled_count": 35,
      "schedule": [
        {
          "day": "Monday",
          "start": "09:00",
          "end": "12:00",
          "room_id": 1
        }
      ],
      "course": {
        "code": "CENG101",
        "name": "Introduction to Programming"
      },
      "instructor": {
        "id": 3,
        "full_name": "Dr. Ahmet Yılmaz",
        "email": "ahmet.yilmaz@university.edu"
      },
      "available_spots": 15,
      "is_full": false
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 45,
    "totalPages": 3
  }
}
```

**Gereksinimler:**
- ✅ Course bilgisi dahil edilmeli
- ✅ Instructor bilgisi dahil edilmeli
- ✅ Filtreleme yapılabilmeli
- ✅ Kapasite durumu gösterilmeli (available_spots, is_full)
- ✅ Sayfalama (pagination) desteği

---

### 2. GET /api/v1/sections/:id
**Açıklama:** Belirli bir bölümün detaylı bilgilerini getir

**Yetkilendirme:** Herkes (public veya authenticated)

**Response Örneği:**
```json
{
  "id": 1,
  "course_id": 5,
  "section_number": 1,
  "semester": "2024-FALL",
  "instructor_id": 3,
  "capacity": 50,
  "enrolled_count": 35,
  "schedule": [
    {
      "day": "Monday",
      "start": "09:00",
      "end": "12:00",
      "room_id": 1,
      "classroom": {
        "name": "B-201",
        "building": "Engineering Block B"
      }
    }
  ],
  "course": {
    "id": 5,
    "code": "CENG101",
    "name": "Introduction to Programming",
    "credits": 3,
    "ects": 5,
    "description": "...",
    "prerequisites": [
      {
        "id": 3,
        "code": "MATH101",
        "name": "Calculus I"
      }
    ]
  },
  "instructor": {
    "id": 3,
    "full_name": "Dr. Ahmet Yılmaz",
    "email": "ahmet.yilmaz@university.edu"
  },
  "enrolled_students": [
    {
      "id": 10,
      "full_name": "Ali Veli",
      "email": "ali.veli@student.edu",
      "enrollment_date": "2024-09-15T10:00:00Z"
    }
  ],
  "attendance_sessions": [
    {
      "id": 1,
      "start_time": "2024-10-01T09:00:00Z",
      "end_time": "2024-10-01T12:00:00Z",
      "status": "CLOSED"
    }
  ],
  "available_spots": 15,
  "is_full": false
}
```

**Gereksinimler:**
- ✅ Course detayları dahil
- ✅ Instructor bilgisi dahil
- ✅ Kayıtlı öğrenciler listesi (opsiyonel, sadece faculty/admin için)
- ✅ Schedule bilgisi (classroom bilgisiyle birlikte)
- ✅ Attendance sessions listesi
- ✅ Kapasite durumu

---

### 3. POST /api/v1/sections
**Açıklama:** Yeni ders bölümü oluştur

**Yetkilendirme:** Admin veya Faculty (kendi dersleri için)

**Request Body:**
```json
{
  "course_id": 5,
  "section_number": 2,
  "semester": "2024-FALL",
  "instructor_id": 3,
  "capacity": 50,
  "schedule": [
    {
      "day": "Tuesday",
      "start": "14:00",
      "end": "17:00",
      "room_id": 2
    },
    {
      "day": "Thursday",
      "start": "14:00",
      "end": "17:00",
      "room_id": 2
    }
  ]
}
```

**Validasyonlar:**
- ✅ `course_id` geçerli olmalı (courses tablosunda var olmalı)
- ✅ `instructor_id` geçerli olmalı ve role='faculty' olmalı
- ✅ `section_number` pozitif integer olmalı
- ✅ `semester` formatı doğru olmalı (örn: "2024-FALL")
- ✅ `capacity` pozitif integer olmalı (örn: > 0)
- ✅ `schedule` JSON formatı doğru olmalı:
  - Her item'da `day`, `start`, `end` olmalı
  - `day` geçerli bir gün olmalı (Monday, Tuesday, ...)
  - `start` ve `end` saat formatı doğru olmalı (HH:MM)
  - `room_id` opsiyonel ama varsa geçerli olmalı

**Response:**
```json
{
  "message": "Section created successfully",
  "section": {
    "id": 2,
    "course_id": 5,
    "section_number": 2,
    "semester": "2024-FALL",
    "instructor_id": 3,
    "capacity": 50,
    "enrolled_count": 0,
    "schedule": [...],
    "created_at": "2024-09-01T10:00:00Z"
  }
}
```

**Hata Durumları:**
- `400 Bad Request`: Validasyon hatası
- `403 Forbidden`: Yetki yok (faculty sadece kendi derslerini oluşturabilir)
- `404 Not Found`: Course veya instructor bulunamadı
- `409 Conflict`: Aynı course_id, section_number, semester kombinasyonu zaten var

---

### 4. PUT /api/v1/sections/:id
**Açıklama:** Ders bölümünü güncelle

**Yetkilendirme:** Admin veya Faculty (kendi bölümleri için)

**Request Body:** (Sadece güncellenecek alanlar)
```json
{
  "capacity": 60,
  "instructor_id": 4,
  "schedule": [
    {
      "day": "Monday",
      "start": "10:00",
      "end": "13:00",
      "room_id": 3
    }
  ]
}
```

**Validasyonlar:**
- ✅ Capacity güncelleniyorsa, yeni capacity >= enrolled_count olmalı
- ✅ Instructor değiştiriliyorsa, yeni instructor role='faculty' olmalı
- ✅ Schedule güncelleniyorsa, format kontrolü yapılmalı

**Response:**
```json
{
  "message": "Section updated successfully",
  "section": { ... }
}
```

**Hata Durumları:**
- `400 Bad Request`: Validasyon hatası (örn: capacity < enrolled_count)
- `403 Forbidden`: Yetki yok
- `404 Not Found`: Section bulunamadı

---

### 5. DELETE /api/v1/sections/:id
**Açıklama:** Ders bölümünü sil

**Yetkilendirme:** Admin

**Not:** Bu endpoint genellikle kullanılmaz. Bunun yerine soft delete veya status field kullanılabilir. Eğer hard delete yapılıyorsa:
- ✅ Enrolled students varsa silinmemeli (CASCADE kontrolü)
- ✅ Attendance sessions varsa silinmemeli

**Response:**
```json
{
  "message": "Section deleted successfully"
}
```

---

## 🔗 İlişkiler (Associations)

### CourseSection Model İlişkileri

```javascript
CourseSection.belongsTo(Course, { foreignKey: 'course_id', as: 'course' });
CourseSection.belongsTo(User, { foreignKey: 'instructor_id', as: 'instructor' });
CourseSection.hasMany(Enrollment, { foreignKey: 'section_id', as: 'enrollments' });
CourseSection.hasMany(AttendanceSession, { foreignKey: 'section_id', as: 'sessions' });
```

---

## 📊 İş Mantığı (Business Logic)

### 1. Kapasite Kontrolü
- `enrolled_count` her zaman `capacity`'den küçük veya eşit olmalı
- Enrollment yapılırken `enrolled_count` atomic olarak artırılmalı (transaction)
- Drop yapılırken `enrolled_count` atomic olarak azaltılmalı

### 2. Schedule Conflict Kontrolü
- Bir öğrenci aynı gün ve saatte iki farklı section'a kayıt olamaz
- Enrollment yapılırken mevcut enrollments'ların schedule'ları kontrol edilmeli
- `scheduleConflict.service.js` kullanılmalı

### 3. Section Number Uniqueness
- Aynı `course_id` ve `semester` için `section_number` unique olmalı
- Örnek: CENG101 dersi 2024-FALL döneminde Section 1, Section 2, Section 3 olabilir
- Ama aynı dönemde iki tane Section 1 olamaz

---

## 🎨 Frontend Gereksinimleri

### 1. Section List Page
- [ ] Tüm bölümleri listele
- [ ] Filtreleme (course, semester, instructor)
- [ ] Arama (course code, course name)
- [ ] Kapasite durumu göster (progress bar veya badge)
- [ ] "Enroll" butonu (öğrenci için)

### 2. Section Detail Page
- [ ] Bölüm detayları
- [ ] Schedule gösterimi (takvim formatında)
- [ ] Instructor bilgisi
- [ ] Course bilgisi ve prerequisites
- [ ] Kayıtlı öğrenci sayısı
- [ ] "Enroll" butonu (öğrenci için)

### 3. Section Management (Admin/Faculty)
- [ ] Yeni bölüm oluşturma formu
- [ ] Bölüm güncelleme formu
- [ ] Schedule editor (gün ve saat seçimi)
- [ ] Classroom seçimi (dropdown)

---

## ✅ Mevcut Durum Kontrolü

### Backend
- ✅ Model tanımlı (`models/course_section.js`)
- ✅ Migration yapılmış (`20251213140000-create-part2-academic-tables.js`)
- ✅ Controller'da bazı fonksiyonlar var (`academic.controller.js`):
  - ✅ `getAllSections` - Mevcut ama filtreleme eksik
  - ✅ `assignInstructor` - Mevcut
  - ✅ `getSectionStudents` - Mevcut
- ❌ `getSectionById` - Eksik
- ❌ `createSection` - Eksik
- ❌ `updateSection` - Eksik
- ❌ `deleteSection` - Eksik

### Routes
- ✅ `GET /api/v1/sections` - Mevcut (academic.routes.js)
- ❌ `GET /api/v1/sections/:id` - Eksik
- ❌ `POST /api/v1/sections` - Eksik
- ❌ `PUT /api/v1/sections/:id` - Eksik
- ❌ `DELETE /api/v1/sections/:id` - Eksik

### Frontend
- ❌ Section list page - Eksik
- ❌ Section detail page - Eksik
- ❌ Section management - Eksik

---

## 🚀 Yapılacaklar Özeti

### Backend
1. [ ] `getSectionById` controller fonksiyonu ekle
2. [ ] `createSection` controller fonksiyonu ekle
3. [ ] `updateSection` controller fonksiyonu ekle
4. [ ] `deleteSection` controller fonksiyonu ekle (opsiyonel)
5. [ ] `getAllSections` fonksiyonunu geliştir:
   - [ ] Filtreleme ekle (course_id, semester, instructor_id)
   - [ ] Pagination ekle
   - [ ] Kapasite durumu hesapla (available_spots, is_full)
6. [ ] Route'ları ekle (`academic.routes.js`)
7. [ ] Validasyon ekle (Joi schema)
8. [ ] Test yaz

### Frontend
1. [ ] Section list component oluştur
2. [ ] Section detail component oluştur
3. [ ] Section form component oluştur (create/update)
4. [ ] Schedule editor component oluştur
5. [ ] API service fonksiyonları ekle

---

## 📝 Örnek Kod

### Controller Örneği (createSection)

```javascript
exports.createSection = async (req, res) => {
    try {
        const { course_id, section_number, semester, instructor_id, capacity, schedule } = req.body;
        
        // Validasyon
        if (!course_id || !section_number || !semester || !instructor_id || !capacity) {
            return res.status(400).json({ message: 'Missing required fields' });
        }

        // Course kontrolü
        const course = await Course.findByPk(course_id);
        if (!course) {
            return res.status(404).json({ message: 'Course not found' });
        }

        // Instructor kontrolü
        const instructor = await User.findOne({ 
            where: { id: instructor_id, role: 'faculty' } 
        });
        if (!instructor) {
            return res.status(400).json({ message: 'Invalid instructor' });
        }

        // Duplicate kontrolü
        const existing = await CourseSection.findOne({
            where: { course_id, section_number, semester }
        });
        if (existing) {
            return res.status(409).json({ message: 'Section already exists' });
        }

        // Schedule validasyonu
        if (schedule && !Array.isArray(schedule)) {
            return res.status(400).json({ message: 'Schedule must be an array' });
        }

        // Section oluştur
        const section = await CourseSection.create({
            course_id,
            section_number,
            semester,
            instructor_id,
            capacity,
            enrolled_count: 0,
            schedule: schedule || []
        });

        // Include ile detaylı bilgi döndür
        const sectionWithDetails = await CourseSection.findByPk(section.id, {
            include: [
                { model: Course, as: 'course' },
                { model: User, as: 'instructor' }
            ]
        });

        res.status(201).json({
            message: 'Section created successfully',
            section: sectionWithDetails
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};
```

---

**Son Güncelleme:** 2024-12-13

