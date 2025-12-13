# Ders Bölümleri Nasıl Eklenir?

Ders bölümlerini eklemenin iki yolu vardır:

## 1. Seed Dosyası ile (Test Verileri)

### Adım 1: Seed Dosyasını Çalıştır

```bash
cd backend
npm run db:seed
```

Bu komut `20251213142000-part2-seed.js` dosyasını çalıştırır ve şunları ekler:
- Departments (Bölümler)
- Users (Öğretim üyeleri ve öğrenciler)
- Courses (Dersler)
- Classrooms (Derslikler)
- **Course Sections (Ders Bölümleri)** ✅
- Enrollments (Kayıtlar)
- Attendance Sessions (Yoklama oturumları)

### Seed Dosyası Konumu
`backend/seeders/20251213142000-part2-seed.js`

## 2. Frontend'den Manuel Oluşturma

### Adım 1: Frontend'e Giriş Yap
- Admin veya Faculty rolü ile giriş yapın

### Adım 2: Ders Bölümleri Sayfasına Git
- Navigation menüsünden "Ders Bölümleri" linkine tıklayın
- Veya direkt `/sections` URL'sine gidin

### Adım 3: Yeni Bölüm Oluştur
- "Yeni Bölüm Oluştur" butonuna tıklayın
- Formu doldurun:
  - **Ders**: Dropdown'dan seçin
  - **Şube Numarası**: 1, 2, 3... gibi
  - **Dönem**: Format: `2024-FALL`, `2025-SPRING`, `2025-SUMMER`
  - **Öğretim Üyesi**: Dropdown'dan seçin
  - **Kapasite**: Maksimum öğrenci sayısı
  - **Program**: Ders günleri ve saatleri

### Adım 4: Kaydet
- "Oluştur" butonuna tıklayın
- Başarılı mesajından sonra bölümler listesine yönlendirilirsiniz

## 3. API ile Doğrudan Oluşturma

### POST /api/v1/academic/sections

**Request Body:**
```json
{
  "course_id": 1,
  "section_number": 1,
  "semester": "2024-FALL",
  "instructor_id": 3,
  "capacity": 50,
  "schedule": [
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
}
```

**cURL Örneği:**
```bash
curl -X POST http://localhost:5000/api/v1/academic/sections \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "course_id": 1,
    "section_number": 1,
    "semester": "2024-FALL",
    "instructor_id": 3,
    "capacity": 50,
    "schedule": [
      {
        "day": "Monday",
        "start": "09:00",
        "end": "12:00"
      }
    ]
  }'
```

## Önemli Notlar

1. **Ders (Course) Önce Olmalı**: Section oluşturmadan önce course'ların eklenmiş olması gerekir
2. **Öğretim Üyesi (Instructor) Önce Olmalı**: Instructor'ın `role='faculty'` olması gerekir
3. **Dönem Formatı**: Mutlaka `YYYY-FALL`, `YYYY-SPRING`, veya `YYYY-SUMMER` formatında olmalı
4. **Unique Constraint**: Aynı `course_id`, `section_number`, ve `semester` kombinasyonu tekrar edemez
5. **Schedule Formatı**: 
   - `day`: Monday, Tuesday, Wednesday, Thursday, Friday, Saturday, Sunday
   - `start` ve `end`: HH:MM formatında (24 saat)
   - `room_id`: Opsiyonel, classroom ID'si

## Sorun Giderme

### "Bölümler yüklenirken hata oluştu" Hatası

1. **Backend çalışıyor mu?**
   ```bash
   cd backend
   npm start
   ```

2. **Database bağlantısı var mı?**
   - `.env` dosyasında database bilgileri doğru mu?
   - PostgreSQL çalışıyor mu?

3. **Migration'lar çalıştırıldı mı?**
   ```bash
   cd backend
   npm run db:migrate
   ```

4. **Seed çalıştırıldı mı?**
   ```bash
   cd backend
   npm run db:seed
   ```

5. **API endpoint'i doğru mu?**
   - Frontend'de `REACT_APP_API_URL` doğru mu?
   - Backend port 5000'de çalışıyor mu?

### "Course not found" Hatası

- Önce course'ları ekleyin
- Seed dosyasını çalıştırın veya manuel course oluşturun

### "Invalid instructor" Hatası

- Instructor'ın `role='faculty'` olduğundan emin olun
- Seed dosyası faculty kullanıcıları oluşturur

## Hızlı Başlangıç

En hızlı yol:

```bash
# Backend dizininde
cd backend

# Migration'ları çalıştır
npm run db:migrate

# Seed verilerini ekle (sections dahil)
npm run db:seed

# Backend'i başlat
npm start
```

Sonra frontend'de `/sections` sayfasına gidin - bölümler görünür olmalı!

