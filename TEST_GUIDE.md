# Test Rehberi - Ders Yönetimi ve Kayıt Sistemi

## ✅ ŞU AN TEST EDEBİLECEKLERİNİZ

### 1. Frontend - Sections (Ders Bölümleri) ✅

#### A. Sections Listesi Sayfası
**URL:** `http://localhost:3000/sections`

**Test Senaryoları:**
- ✅ Tüm bölümleri listeleme
- ✅ Filtreleme (Ders, Dönem, Öğretim Üyesi)
- ✅ Pagination (Sayfalama)
- ✅ Kapasite bilgisi görüntüleme
- ✅ Bölüm detayına gitme

**Nasıl Test Edilir:**
1. Giriş yapın (herhangi bir rol)
2. Header'dan "Ders Bölümleri" linkine tıklayın
3. Filtreleri kullanarak arama yapın
4. Bir bölüme tıklayarak detay sayfasına gidin

---

#### B. Section Detail Sayfası
**URL:** `http://localhost:3000/sections/:id`

**Test Senaryoları:**
- ✅ Bölüm detaylarını görüntüleme
- ✅ Program (Schedule) bilgilerini görme
- ✅ Kayıtlı öğrencileri listeleme
- ✅ Yoklama oturumlarını görme
- ✅ Düzenleme butonu (Admin/Faculty)
- ✅ Silme butonu (Admin)

**Nasıl Test Edilir:**
1. Sections listesinden bir bölüme tıklayın
2. Detay bilgilerini kontrol edin
3. Admin/Faculty iseniz "Düzenle" butonunu test edin

---

#### C. Section Form Sayfası
**URL:** `http://localhost:3000/sections/new` (Yeni)
**URL:** `http://localhost:3000/sections/:id/edit` (Düzenle)

**Test Senaryoları:**
- ✅ Yeni bölüm oluşturma (Admin/Faculty)
- ✅ Bölüm düzenleme (Admin/Faculty)
- ✅ Form validasyonları
- ✅ Schedule (Program) ekleme
- ✅ Classroom seçimi

**Nasıl Test Edilir:**
1. Admin veya Faculty rolü ile giriş yapın
2. Sections listesinden "Yeni Bölüm" butonuna tıklayın
3. Formu doldurun ve kaydedin
4. Oluşturduğunuz bölümü düzenleyin

---

### 2. Backend API Endpoint'leri ✅

#### A. Courses (Dersler) API

**1. Tüm Dersleri Listele**
```bash
GET http://localhost:5000/api/v1/academic/courses
GET http://localhost:5000/api/v1/academic/courses?department_id=1
GET http://localhost:5000/api/v1/academic/courses?search=matematik
GET http://localhost:5000/api/v1/academic/courses?page=1&limit=10
```

**2. Ders Detayı**
```bash
GET http://localhost:5000/api/v1/academic/courses/:id
```

**3. Yeni Ders Oluştur (Admin)**
```bash
POST http://localhost:5000/api/v1/academic/courses
Headers: Authorization: Bearer <token>
Body:
{
  "code": "MATH101",
  "name": "Matematik I",
  "description": "Temel matematik dersi",
  "credits": 3,
  "ects": 5,
  "department_id": 1,
  "prerequisites": [2, 3]
}
```

**4. Ders Güncelle (Admin)**
```bash
PUT http://localhost:5000/api/v1/academic/courses/:id
Headers: Authorization: Bearer <token>
Body:
{
  "name": "Güncellenmiş Ders Adı",
  "credits": 4
}
```

**5. Ders Sil (Admin)**
```bash
DELETE http://localhost:5000/api/v1/academic/courses/:id
Headers: Authorization: Bearer <token>
```

---

#### B. Sections (Bölümler) API

**1. Tüm Bölümleri Listele**
```bash
GET http://localhost:5000/api/v1/academic/sections
GET http://localhost:5000/api/v1/academic/sections?course_id=1
GET http://localhost:5000/api/v1/academic/sections?semester=2024-2025-Fall
GET http://localhost:5000/api/v1/academic/sections?instructor_id=5
```

**2. Bölüm Detayı**
```bash
GET http://localhost:5000/api/v1/academic/sections/:id
```

**3. Yeni Bölüm Oluştur (Admin/Faculty)**
```bash
POST http://localhost:5000/api/v1/academic/sections
Headers: Authorization: Bearer <token>
Body:
{
  "course_id": 1,
  "section_number": "A",
  "semester": "2024-2025-Fall",
  "capacity": 30,
  "instructor_id": 5,
  "schedule": [
    {
      "day": "Monday",
      "start": "09:00",
      "end": "11:00",
      "room_id": 1
    },
    {
      "day": "Wednesday",
      "start": "09:00",
      "end": "11:00",
      "room_id": 1
    }
  ]
}
```

**4. Bölüm Güncelle (Admin/Faculty)**
```bash
PUT http://localhost:5000/api/v1/academic/sections/:id
Headers: Authorization: Bearer <token>
Body:
{
  "capacity": 35,
  "instructor_id": 6
}
```

**5. Bölüm Sil (Admin)**
```bash
DELETE http://localhost:5000/api/v1/academic/sections/:id
Headers: Authorization: Bearer <token>
```

---

#### C. Enrollments (Kayıtlar) API

**1. Derse Kayıt Ol (Student)**
```bash
POST http://localhost:5000/api/v1/academic/enrollments
Headers: Authorization: Bearer <student_token>
Body:
{
  "section_id": 1
}
```

**Test Senaryoları:**
- ✅ Normal kayıt (başarılı)
- ✅ Prerequisite eksik (hata mesajı)
- ✅ Schedule conflict (hata mesajı)
- ✅ Kapasite dolu (hata mesajı)
- ✅ Zaten kayıtlı (duplicate hata)

**2. Kayıtlı Derslerim (Student)**
```bash
GET http://localhost:5000/api/v1/academic/enrollments/my-enrollments
Headers: Authorization: Bearer <student_token>
```

**Response:**
```json
{
  "enrollments": [
    {
      "id": 1,
      "section_id": 1,
      "enrollment_date": "2024-01-15",
      "status": "ACTIVE",
      "letter_grade": null,
      "section": {
        "id": 1,
        "section_number": "A",
        "course": {
          "code": "MATH101",
          "name": "Matematik I"
        }
      },
      "attendance_stats": {
        "total_sessions": 10,
        "present_count": 8,
        "absent_count": 1,
        "excused_count": 1,
        "attendance_rate": 80
      }
    }
  ]
}
```

**3. Dersi Bırak (Student)**
```bash
DELETE http://localhost:5000/api/v1/academic/enrollments/:id
Headers: Authorization: Bearer <student_token>
```

---

### 3. Prerequisite Service Test ✅

**Test Senaryosu:**
1. Bir ders oluşturun (örn: MATH201)
2. Önkoşul olarak MATH101 ekleyin
3. Öğrenci MATH101'i tamamlamadan MATH201'e kayıt olmaya çalışın
4. Hata mesajı almalı: "Prerequisites not met"

**API Test:**
```bash
# Öğrenci MATH101'i tamamlamadan MATH201'e kayıt olmaya çalış
POST http://localhost:5000/api/v1/academic/enrollments
Headers: Authorization: Bearer <student_token>
Body: { "section_id": <MATH201_section_id> }
```

**Beklenen Hata:**
```json
{
  "message": "Prerequisites not met",
  "missing_prerequisites": [
    {
      "course_id": 1,
      "course_code": "MATH101",
      "course_name": "Matematik I"
    }
  ]
}
```

---

### 4. Schedule Conflict Service Test ✅

**Test Senaryosu:**
1. Öğrenci Pazartesi 09:00-11:00 saatlerinde bir derse kayıtlı olsun
2. Aynı saatte başka bir derse kayıt olmaya çalışsın
3. Hata mesajı almalı: "Schedule conflict detected"

**API Test:**
```bash
# Çakışan bir derse kayıt olmaya çalış
POST http://localhost:5000/api/v1/academic/enrollments
Headers: Authorization: Bearer <student_token>
Body: { "section_id": <conflicting_section_id> }
```

**Beklenen Hata:**
```json
{
  "message": "Schedule conflict detected",
  "conflicting_sections": [
    {
      "section_id": 1,
      "course_code": "MATH101",
      "conflict_time": "Monday 09:00-11:00"
    }
  ]
}
```

---

## ❌ HENÜZ TEST EDİLEMEYENLER

### Frontend Sayfaları (Eksik)
- ❌ Courses Listesi Sayfası
- ❌ Course Detay Sayfası
- ❌ Course Form Sayfası (Admin)
- ❌ Enrollment Sayfası (Derse kayıt olma)
- ❌ My Enrollments Sayfası (Kayıtlı derslerim)

### Route'lar (Eksik)
- ❌ `/courses` - Ders listesi
- ❌ `/courses/:id` - Ders detayı
- ❌ `/courses/new` - Yeni ders oluştur
- ❌ `/courses/:id/edit` - Ders düzenle
- ❌ `/enrollments` - Derse kayıt ol
- ❌ `/enrollments/my-enrollments` - Kayıtlı derslerim

---

## 🧪 HIZLI TEST ADIMLARI

### 1. Frontend Test (Sections)
```bash
# 1. Uygulamayı başlat
cd frontend
npm start

# 2. Tarayıcıda aç
http://localhost:3000

# 3. Giriş yap
# 4. "Ders Bölümleri" linkine tıkla
# 5. Bölümleri görüntüle, filtrele, detay sayfasına git
```

### 2. Backend API Test (Postman/curl)

**Postman Collection Oluştur:**
```json
{
  "info": {
    "name": "Smart Campus Academic API",
    "schema": "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"
  },
  "item": [
    {
      "name": "Get All Courses",
      "request": {
        "method": "GET",
        "header": [],
        "url": {
          "raw": "http://localhost:5000/api/v1/academic/courses",
          "protocol": "http",
          "host": ["localhost"],
          "port": "5000",
          "path": ["api", "v1", "academic", "courses"]
        }
      }
    }
  ]
}
```

**curl Örnekleri:**
```bash
# Login yap ve token al
TOKEN=$(curl -X POST http://localhost:5000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"student@example.com","password":"password"}' \
  | jq -r '.token')

# Tüm dersleri listele
curl http://localhost:5000/api/v1/academic/courses

# Derse kayıt ol
curl -X POST http://localhost:5000/api/v1/academic/enrollments \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"section_id": 1}'

# Kayıtlı derslerim
curl http://localhost:5000/api/v1/academic/enrollments/my-enrollments \
  -H "Authorization: Bearer $TOKEN"
```

---

## 📊 TEST CHECKLIST

### Backend API Testleri
- [ ] Courses CRUD (GET, POST, PUT, DELETE)
- [ ] Sections CRUD (GET, POST, PUT, DELETE)
- [ ] Enrollments (POST, GET my-enrollments, DELETE)
- [ ] Prerequisite kontrolü
- [ ] Schedule conflict kontrolü
- [ ] Capacity kontrolü
- [ ] Duplicate enrollment kontrolü

### Frontend Testleri
- [x] Sections Listesi
- [x] Section Detayı
- [x] Section Form (Create/Edit)
- [ ] Courses Listesi
- [ ] Course Detayı
- [ ] Course Form
- [ ] Enrollment Sayfası
- [ ] My Enrollments Sayfası

---

## 🔍 DEBUG İPUÇLARI

### Backend Hataları
```bash
# Backend loglarını kontrol et
docker-compose logs backend

# Database bağlantısını kontrol et
docker-compose exec backend psql -h postgres -U postgres -d smart_campus
```

### Frontend Hataları
```bash
# Browser console'u aç (F12)
# Network tab'inde API isteklerini kontrol et
# Response'ları incele
```

### Database Kontrolü
```bash
# Enrollments tablosunu kontrol et
SELECT * FROM enrollments;

# Course sections tablosunu kontrol et
SELECT * FROM course_sections;

# Courses tablosunu kontrol et
SELECT * FROM courses;
```

---

## 📝 NOTLAR

- Backend endpoint'leri %100 hazır
- Frontend'de sadece Sections sayfaları var
- Courses ve Enrollments frontend sayfaları eksik
- API Service'ler güncellendi (coursesService, enrollmentsService)

