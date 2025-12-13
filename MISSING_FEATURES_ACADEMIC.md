# Ders Yönetimi ve Kayıt Sistemi - Eksik Özellikler

## ❌ EKSİK OLAN ÖZELLİKLER

### 1. Courses (Dersler) - TAMAMEN EKSİK ❌

#### Backend Endpoint'leri:
- ❌ `GET /api/v1/academic/courses` - Tüm dersleri listele
- ❌ `GET /api/v1/academic/courses/:id` - Ders detayı
- ❌ `POST /api/v1/academic/courses` - Yeni ders oluştur (Admin)
- ❌ `PUT /api/v1/academic/courses/:id` - Ders güncelle (Admin)
- ❌ `DELETE /api/v1/academic/courses/:id` - Ders sil (Soft delete)

#### Frontend Sayfaları:
- ❌ Course listesi sayfası
- ❌ Course detay sayfası
- ❌ Course oluşturma/düzenleme formu

### 2. Enrollments (Kayıtlar) - TAMAMEN EKSİK ❌

#### Backend Endpoint'leri:
- ❌ `POST /api/v1/academic/enrollments` - Derse kayıt ol (Öğrenci)
  - ❌ Prerequisite kontrolü (Recursive BFS/DFS)
  - ❌ Schedule conflict kontrolü
  - ❌ Capacity kontrolü (Atomic increment)
  - ❌ Duplicate enrollment kontrolü
  - ❌ Transaction kullanımı

- ❌ `GET /api/v1/academic/enrollments/my-enrollments` - Öğrencinin kayıtları
- ❌ `DELETE /api/v1/academic/enrollments/:id` - Dersi bırak

#### Frontend Sayfaları:
- ❌ Enrollment sayfası (section seçimi, kayıt)
- ❌ My Enrollments sayfası (kayıtlı derslerim)
- ❌ Drop course butonu

### 3. Services - EKSİK İMPLEMENTASYON ❌

#### Prerequisite Service:
- ❌ `checkPrerequisites()` fonksiyonu sadece `return true` yapıyor
- ❌ Recursive BFS/DFS algoritması implement edilmemiş
- ❌ Completed courses kontrolü yok

#### Schedule Conflict Service:
- ❌ `checkConflict()` fonksiyonu sadece `return false` yapıyor
- ❌ Time overlap detection algoritması implement edilmemiş
- ❌ Schedule JSON parsing ve karşılaştırma yok

### 4. Grades (Notlar) - TAMAMEN EKSİK ❌

- ❌ `POST /api/v1/academic/grades` - Not girişi (Faculty)
- ❌ `GET /api/v1/academic/grades/transcript` - Transkript (Öğrenci)
- ❌ `GET /api/v1/academic/grades/section/:sectionId` - Bölüm notları (Faculty)
- ❌ Letter grade hesaplama
- ❌ GPA hesaplama

---

## ✅ MEVCUT OLAN ÖZELLİKLER

### Sections (Ders Bölümleri) - TAMAMLANDI ✅
- ✅ GET /api/v1/academic/sections
- ✅ GET /api/v1/academic/sections/:id
- ✅ POST /api/v1/academic/sections
- ✅ PUT /api/v1/academic/sections/:id
- ✅ DELETE /api/v1/academic/sections/:id
- ✅ Frontend sayfaları (list, detail, form)

### Admin Manuel İşlemler - MEVCUT ✅
- ✅ POST /api/v1/academic/sections/:sectionId/enroll (Admin için)
- ✅ GET /api/v1/academic/sections/:sectionId/students

---

## 🎯 ÖNCELİK SIRASI

### Yüksek Öncelik (Kritik):
1. **Enrollments** - Öğrencilerin derse kayıt olabilmesi için
2. **Prerequisite Service** - Önkoşul kontrolü
3. **Schedule Conflict Service** - Zaman çakışması kontrolü

### Orta Öncelik:
4. **Courses CRUD** - Ders yönetimi
5. **My Enrollments** - Öğrencinin kayıtlarını görme

### Düşük Öncelik:
6. **Grades** - Not sistemi (Part 2'nin son kısmı)

---

## 📝 DETAYLI EKSİKLER

### Enrollment İşlemi İçin Gerekenler:

1. **Prerequisite Kontrolü:**
   ```javascript
   // Recursive BFS/DFS ile tüm önkoşulları kontrol et
   // Öğrencinin tamamladığı dersleri kontrol et
   // Letter grade >= DD olmalı
   ```

2. **Schedule Conflict Kontrolü:**
   ```javascript
   // Öğrencinin mevcut enrollments'larını al
   // Her enrollment'ın section schedule'ını al
   // Yeni section schedule ile karşılaştır
   // Aynı gün ve saatte çakışma var mı?
   ```

3. **Capacity Kontrolü:**
   ```javascript
   // Atomic increment kullan
   // Transaction içinde:
   // UPDATE course_sections SET enrolled_count = enrolled_count + 1 
   // WHERE id = ? AND enrolled_count < capacity
   // Affected rows = 0 ise kapasite dolu
   ```

4. **Duplicate Kontrolü:**
   ```javascript
   // Aynı student_id + section_id zaten var mı?
   // Status = 'ACTIVE' ise hata ver
   ```

---

**Son Güncelleme:** 2024-12-13

