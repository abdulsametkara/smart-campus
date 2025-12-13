# Part 2: Başlangıç Öncesi Hazırlık Kontrol Listesi

> **Teslim Tarihi:** 15 Aralık 2025 (Pazar), 23:59  
> **Süre:** 7 gün  
> **Ağırlık:** %25

Bu doküman, Part 2'ye başlamadan önce yapılması gereken hazırlıkları ve Part 2 süresince tamamlanması gereken görevleri içermektedir.

---

## 📋 BAŞLAMADAN ÖNCE YAPILMASI GEREKENLER

### 1. ✅ Proje Durumu Kontrolü

#### Backend Kontrolleri
- [ ] **Migration'lar çalıştırıldı mı?**
  ```bash
  cd backend
  npm run db:migrate
  ```
  - `20251213140000-create-part2-academic-tables.js` ✅ (Mevcut)
  - `20251213140500-create-part2-attendance-tables.js` ✅ (Mevcut)

- [ ] **Modeller doğru tanımlanmış mı?**
  - [ ] `models/course.js` ✅ (Kontrol et)
  - [ ] `models/course_section.js` ✅ (Kontrol et)
  - [ ] `models/enrollment.js` ✅ (Kontrol et)
  - [ ] `models/classroom.js` ✅ (Kontrol et)
  - [ ] `models/attendance_session.js` ✅ (Kontrol et)
  - [ ] `models/attendance_record.js` ✅ (Kontrol et)
  - [ ] `models/excuse_request.js` ✅ (Kontrol et)

- [ ] **Model ilişkileri (associations) tanımlı mı?**
  - [ ] `models/index.js` dosyasında tüm ilişkiler tanımlı mı?

#### Frontend Kontrolleri
- [ ] **Gerekli sayfalar mevcut mu?**
  - [ ] `pages/attendance/` klasörü var mı? ✅ (Mevcut)
  - [ ] Academic sayfaları var mı?

- [ ] **Gerekli paketler yüklü mü?**
  - [ ] `leaflet` (Harita için) ✅ (package.json'da var)
  - [ ] `react-leaflet` ✅ (package.json'da var)
  - [ ] `qrcode.react` (QR kod için) ✅ (package.json'da var)

#### Docker Kontrolleri
- [ ] **Docker container'lar çalışıyor mu?**
  ```bash
  docker-compose up -d
  docker-compose ps
  ```

- [ ] **Database bağlantısı çalışıyor mu?**
  ```bash
  docker-compose exec backend npm run db:migrate
  ```

---

## 🎯 PART 2 - YAPILACAKLAR LİSTESİ

### 2. Backend Görevleri

#### 2.1 Academic Management (Akademik Yönetim)

##### Courses (Dersler)
- [ ] **GET /api/v1/courses** - Tüm dersleri listele
  - [ ] Filtreleme (department, semester)
  - [ ] Arama (code, name)
  - [ ] Sayfalama (pagination)
  - [ ] Soft delete kontrolü

- [ ] **GET /api/v1/courses/:id** - Ders detayı
  - [ ] Prerequisites bilgisi dahil
  - [ ] Sections listesi
  - [ ] Department bilgisi

- [ ] **POST /api/v1/courses** - Yeni ders oluştur (Admin)
  - [ ] Validasyon (code unique, department_id geçerli)
  - [ ] Soft delete desteği

- [ ] **PUT /api/v1/courses/:id** - Ders güncelle (Admin)
- [ ] **DELETE /api/v1/courses/:id** - Ders sil (Soft delete)

##### Sections (Ders Bölümleri)
- [ ] **GET /api/v1/sections** - Tüm bölümleri listele
  - [ ] Course ve instructor bilgisi dahil
  - [ ] Filtreleme (course_id, semester, instructor_id)
  - [ ] Kapasite durumu göster

- [ ] **GET /api/v1/sections/:id** - Bölüm detayı
  - [ ] Enrolled students listesi
  - [ ] Schedule bilgisi
  - [ ] Attendance sessions

- [ ] **POST /api/v1/sections** - Yeni bölüm oluştur (Admin/Faculty)
  - [ ] Validasyon (capacity, instructor role check)
  - [ ] Schedule JSON format kontrolü

##### Enrollments (Kayıtlar)
- [ ] **POST /api/v1/enrollments** - Derse kayıt ol
  - [ ] **Prerequisite kontrolü** (Recursive BFS/DFS)
  - [ ] **Schedule conflict kontrolü** (Zaman çakışması)
  - [ ] **Capacity kontrolü** (Atomic increment)
  - [ ] **Duplicate enrollment kontrolü**
  - [ ] Transaction kullanımı

- [ ] **GET /api/v1/enrollments/my-enrollments** - Öğrencinin kayıtları
  - [ ] Course ve section bilgisi
  - [ ] Grade bilgisi
  - [ ] Attendance istatistikleri

- [ ] **DELETE /api/v1/enrollments/:id** - Dersi bırak
  - [ ] Capacity decrement
  - [ ] Transaction kullanımı

##### Grades (Notlar)
- [ ] **POST /api/v1/grades** - Not girişi (Faculty)
  - [ ] Midterm ve final grade
  - [ ] Otomatik letter grade hesaplama (AA, BA, BB, CB, CC, DC, DD, FF)
  - [ ] GPA point hesaplama (4.0 scale)
  - [ ] Validasyon (0-100 arası)

- [ ] **GET /api/v1/grades/transcript** - Transkript (Öğrenci)
  - [ ] Tüm dersler ve notlar
  - [ ] GPA hesaplama
  - [ ] PDF export (Bonus: PDFKit veya Puppeteer)

- [ ] **GET /api/v1/grades/section/:sectionId** - Bölüm notları (Faculty)
  - [ ] Tüm öğrencilerin notları
  - [ ] Excel export (Bonus)

##### Services (İş Mantığı)
- [ ] **Prerequisite Service** (`services/prerequisite.service.js`)
  - [ ] Recursive prerequisite checking (BFS/DFS)
  - [ ] Circular dependency detection
  - [ ] Completed courses kontrolü

- [ ] **Schedule Conflict Service** (`services/scheduleConflict.service.js`)
  - [ ] Time overlap detection
  - [ ] JSON schedule parsing
  - [ ] Day ve time karşılaştırma

- [ ] **Grade Calculation Service**
  - [ ] Letter grade mapping (0-100 → AA-FF)
  - [ ] GPA calculation (4.0 scale)
  - [ ] Weighted average (midterm %40, final %60)

#### 2.2 GPS Attendance (GPS Yoklama)

##### Attendance Sessions
- [ ] **POST /api/v1/attendance/sessions** - Yoklama oturumu başlat (Faculty)
  - [ ] Section kontrolü (instructor yetkisi)
  - [ ] QR code generation (crypto.randomBytes)
  - [ ] GPS koordinatları (classroom'dan veya manual)
  - [ ] Radius ayarı (default 15m)
  - [ ] End time hesaplama

- [ ] **GET /api/v1/attendance/sessions/my-sessions** - Oturumlarım (Faculty)
  - [ ] Aktif ve kapalı oturumlar
  - [ ] Attendance istatistikleri

- [ ] **GET /api/v1/attendance/sessions/:id** - Oturum detayı
  - [ ] Tüm check-in'ler
  - [ ] İstatistikler

- [ ] **PUT /api/v1/attendance/sessions/:id/close** - Oturumu kapat

##### Check-in
- [ ] **POST /api/v1/attendance/checkin** - Yoklama ver (Öğrenci)
  - [ ] **Haversine distance calculation** (15m radius kontrolü)
  - [ ] **GPS spoofing detection:**
    - [ ] Accuracy kontrolü (high accuracy mode)
    - [ ] Speed kontrolü (çok hızlı hareket tespiti)
    - [ ] Multiple location check (zaman içinde tutarlılık)
    - [ ] Flagging mekanizması
  - [ ] QR code doğrulama (alternatif yöntem)
  - [ ] Enrollment kontrolü (öğrenci bu section'a kayıtlı mı?)
  - [ ] Session aktif mi kontrolü
  - [ ] Duplicate check-in önleme

##### Attendance Records
- [ ] **GET /api/v1/attendance/records/my-records** - Yoklama kayıtlarım (Öğrenci)
  - [ ] Tüm dersler için yoklama durumu
  - [ ] İstatistikler (total, present, absent, excused)
  - [ ] Yüzde hesaplama

- [ ] **GET /api/v1/attendance/records/section/:sectionId** - Bölüm yoklama raporu (Faculty)
  - [ ] Tüm öğrencilerin yoklama durumu
  - [ ] Flagged students listesi
  - [ ] Excel export (Bonus)

##### Excuse Requests (Mazeretler)
- [ ] **POST /api/v1/excuses** - Mazeret bildir (Öğrenci)
  - [ ] File upload (document)
  - [ ] Session-specific veya genel mazeret
  - [ ] Validasyon

- [ ] **GET /api/v1/excuses/my-excuses** - Mazeretlerim (Öğrenci)
- [ ] **GET /api/v1/excuses/pending** - Bekleyen mazeretler (Faculty)
- [ ] **PUT /api/v1/excuses/:id/approve** - Mazeret onayla (Faculty)
- [ ] **PUT /api/v1/excuses/:id/reject** - Mazeret reddet (Faculty)

##### Services
- [ ] **Attendance Service** (`services/attendance.service.js`)
  - [ ] Haversine formula implementation
  - [ ] Distance calculation
  - [ ] Spoofing detection logic
  - [ ] Statistics calculation

##### Utilities
- [ ] **GPS Utils** (`utils/gps.js`)
  - [ ] Haversine function
  - [ ] Distance validation
  - [ ] Coordinate validation

#### 2.3 Classrooms (Derslikler)
- [ ] **GET /api/v1/classrooms** - Tüm derslikleri listele
- [ ] **GET /api/v1/classrooms/:id** - Derslik detayı
- [ ] **POST /api/v1/classrooms** - Yeni derslik oluştur (Admin)
  - [ ] GPS koordinatları zorunlu
  - [ ] Building ve room number

---

### 3. Frontend Görevleri

#### 3.1 Academic Management Pages

##### Course Management
- [ ] **Course Catalog Page** (`/courses`)
  - [ ] Ders listesi (card layout)
  - [ ] Filtreleme (department, semester)
  - [ ] Arama (code, name)
  - [ ] Ders detay modalı
  - [ ] Prerequisites gösterimi

- [ ] **Course Detail Page** (`/courses/:id`)
  - [ ] Ders bilgileri
  - [ ] Sections listesi
  - [ ] Kayıt butonu (öğrenci için)

- [ ] **My Courses Page** (`/my-courses`) - Öğrenci
  - [ ] Kayıtlı dersler listesi
  - [ ] Notlar
  - [ ] Attendance istatistikleri
  - [ ] Drop course butonu

##### Enrollment
- [ ] **Enrollment Page** (`/enroll`)
  - [ ] Section seçimi
  - [ ] Prerequisite uyarıları
  - [ ] Schedule conflict uyarıları
  - [ ] Capacity durumu
  - [ ] Başarılı/başarısız mesajları

##### Grades
- [ ] **My Transcript Page** (`/transcript`) - Öğrenci
  - [ ] Tüm dersler ve notlar
  - [ ] GPA gösterimi
  - [ ] PDF indirme butonu (Bonus)

- [ ] **Grade Entry Page** (`/grades/:sectionId`) - Faculty
  - [ ] Öğrenci listesi
  - [ ] Midterm ve final grade input
  - [ ] Otomatik letter grade hesaplama
  - [ ] Toplu not girişi (Bonus)

#### 3.2 Attendance Pages

##### Student Attendance
- [ ] **Student Attendance Page** (`/attendance/checkin`)
  - [ ] **GPS Integration:**
    - [ ] Permission request
    - [ ] Current location gösterimi
    - [ ] Map component (Leaflet)
    - [ ] Distance gösterimi
    - [ ] Accuracy indicator
  - [ ] **QR Code Alternative:**
    - [ ] QR scanner (Bonus)
    - [ ] QR code display (Faculty için)
  - [ ] Check-in butonu
  - [ ] Success/error mesajları

- [ ] **My Attendance Page** (`/my-attendance`)
  - [ ] Ders bazında yoklama istatistikleri
  - [ ] Attendance chart (line chart)
  - [ ] Status badges (OK/Warning/Critical)
  - [ ] Excuse request butonu

##### Faculty Attendance
- [ ] **Instructor Attendance Page** (`/attendance/instructor`)
  - [ ] Section seçimi
  - [ ] Start session butonu
  - [ ] QR code display (5 saniyede bir yenileme)
  - [ ] Active sessions listesi
  - [ ] Close session butonu

- [ ] **Attendance Report Page** (`/attendance/report/:sectionId`)
  - [ ] Öğrenci listesi
  - [ ] Attendance yüzdeleri
  - [ ] Flagged students (GPS spoofing)
  - [ ] Excel export butonu
  - [ ] Date range filter

##### Excuse Management
- [ ] **Excuse Request Page** (`/excuses/request`)
  - [ ] Session seçimi (opsiyonel)
  - [ ] Title ve description
  - [ ] File upload (document)
  - [ ] Submit butonu

- [ ] **Excuse Management Page** (`/excuses/manage`) - Faculty
  - [ ] Pending requests listesi
  - [ ] Student bilgisi
  - [ ] Document görüntüleme
  - [ ] Approve/Reject butonları
  - [ ] Notes ekleme

#### 3.3 Components

##### GPS & Maps
- [ ] **GPSPermissionHandler** component
  - [ ] Permission request
  - [ ] Error handling
  - [ ] Location accuracy check

- [ ] **MapComponent** (Leaflet)
  - [ ] Current location marker
  - [ ] Classroom/session location marker
  - [ ] Radius circle (15m)
  - [ ] Distance line

- [ ] **LocationAccuracyIndicator**
  - [ ] Accuracy gösterimi
  - [ ] Color coding (green/yellow/red)

##### Charts
- [ ] **AttendanceChart** component
  - [ ] Line chart (Chart.js)
  - [ ] Time series data

- [ ] **GradeDistributionChart**
  - [ ] Bar chart
  - [ ] Grade distribution

##### QR Code
- [ ] **QRCodeDisplay** component
  - [ ] QR code generation
  - [ ] Auto-refresh (5 saniye)
  - [ ] Copy to clipboard

- [ ] **QRCodeScanner** component (Bonus)
  - [ ] Camera access
  - [ ] QR code scanning
  - [ ] Check-in integration

---

### 4. Testing

#### 4.1 Backend Tests
- [ ] **Academic Tests**
  - [ ] Course CRUD tests
  - [ ] Enrollment tests (prerequisite, conflict, capacity)
  - [ ] Grade calculation tests
  - [ ] Prerequisite service tests (BFS/DFS)

- [ ] **Attendance Tests**
  - [ ] Session creation tests
  - [ ] Check-in tests (Haversine, distance validation)
  - [ ] Spoofing detection tests
  - [ ] Excuse request tests

#### 4.2 Frontend Tests
- [ ] **Component Tests**
  - [ ] Course list component
  - [ ] Enrollment form
  - [ ] GPS handler
  - [ ] Map component

- [ ] **Integration Tests**
  - [ ] Enrollment flow
  - [ ] Attendance check-in flow

---

### 5. Dokümantasyon

- [ ] **API_DOCUMENTATION_PART2.md** ✅ (Mevcut, güncelle)
  - [ ] Tüm endpoint'ler dokümante edildi
  - [ ] Request/response örnekleri
  - [ ] Error codes ve mesajları
  - [ ] Algorithm açıklamaları (Haversine, prerequisite)

- [ ] **DATABASE_SCHEMA_UPDATE.md** ✅ (Mevcut, güncelle)
  - [ ] Yeni tablolar açıklandı
  - [ ] ER diagram güncellendi
  - [ ] İlişkiler gösterildi

- [ ] **GPS_IMPLEMENTATION_GUIDE.md** (Yeni oluştur)
  - [ ] GPS API kullanımı
  - [ ] Haversine formula açıklaması
  - [ ] Spoofing detection yöntemleri
  - [ ] Test senaryoları

- [ ] **USER_MANUAL_PART2.md** (Yeni oluştur)
  - [ ] Derse kayıt adımları
  - [ ] GPS ile yoklama verme
  - [ ] Mazeret bildirme
  - [ ] Ekran görüntüleri (en az 10 adet)

- [ ] **TEST_REPORT_PART2.md** (Yeni oluştur)
  - [ ] Test coverage
  - [ ] Test sonuçları
  - [ ] Known issues

---

### 6. Bonus Özellikler (+15 puan)

- [ ] **QR Code Alternative** (+5)
  - [ ] QR code scanning
  - [ ] 5 saniyede bir yenileme
  - [ ] Location verification ile backup

- [ ] **Real-time Attendance Dashboard** (+5)
  - [ ] WebSocket integration
  - [ ] Real-time check-in updates
  - [ ] Live statistics

- [ ] **Advanced Spoofing Detection** (+3)
  - [ ] Device sensors (accelerometer, gyroscope)
  - [ ] Network location vs GPS location
  - [ ] Historical location patterns

- [ ] **Attendance Analytics** (+2)
  - [ ] Trend analysis
  - [ ] Predictions
  - [ ] Anomaly detection

---

## 🚀 BAŞLANGIÇ ADIMLARI

### Adım 1: Environment Kontrolü
```bash
# Backend
cd backend
npm install
npm run db:migrate

# Frontend
cd frontend
npm install

# Docker
docker-compose up -d
```

### Adım 2: Database Seed (Test Verileri)
```bash
cd backend
npm run db:seed
```

### Adım 3: Mevcut Kod İncelemesi
- [ ] Controllers'ı incele
- [ ] Models'ı incele
- [ ] Routes'ları incele
- [ ] Services'leri incele

### Adım 4: Eksikleri Belirle
- [ ] Yukarıdaki checklist'i kullanarak eksikleri işaretle
- [ ] Öncelik sırası belirle
- [ ] Görev dağılımı yap (eğer grup çalışmasıysa)

### Adım 5: İlk Görev: Prerequisite Service
- [ ] `services/prerequisite.service.js` dosyasını oluştur
- [ ] BFS/DFS algoritmasını implement et
- [ ] Test yaz

---

## 📝 NOTLAR

1. **Transaction Kullanımı:** Enrollment ve drop işlemlerinde mutlaka transaction kullanın (atomic operations).

2. **Error Handling:** Tüm endpoint'lerde uygun error handling ve status code'lar kullanın.

3. **Validation:** Hem backend hem frontend'de validasyon yapın.

4. **Security:** GPS spoofing detection kritik, multiple checks yapın.

5. **Performance:** Prerequisite checking recursive olabilir, caching düşünün.

6. **Documentation:** Her yeni feature için kod içi yorumlar ekleyin.

---

## ✅ TAMAMLAMA KONTROLÜ

Part 2'yi tamamladığınızda:

- [ ] Tüm backend endpoint'ler çalışıyor
- [ ] Tüm frontend sayfalar çalışıyor
- [ ] Testler geçiyor
- [ ] Dokümantasyon tamamlandı
- [ ] Demo video hazırlandı (10-15 dakika)
- [ ] GitHub'a push edildi
- [ ] Commit history düzenli

---

**İyi çalışmalar! 🚀**

