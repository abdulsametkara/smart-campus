# Smart Campus API Dokümantasyonu (Part 2)

Bu belge, Akademik Yönetim, Yoklama Sistemi (GPS & QR) ve Öğrenci Notlandırma süreçlerine odaklanan Part 2 gereksinimleri için uygulanan API uç noktalarını (endpoints) detaylandırır.

**Temel URL**: `/api/v1`
**Kimlik Doğrulama**: Tüm korumalı uç noktalar için Bearer Token gereklidir.

---

## 📚 1. Akademik Yönetim Uç Noktaları

### Dersler (Courses)
| Metot | Uç Nokta | Açıklama | Rol |
|-------|----------|----------|-----|
| `GET` | `/courses` | Tüm dersleri listele (sayfalama & filtreleme ile) | Herkes |
| `GET` | `/courses/:id` | Detaylı ders bilgisini al (ön koşullar dahil) | Herkes |
| `POST` | `/courses` | Yeni ders oluştur | Admin |
| `PUT` | `/courses/:id` | Ders detaylarını güncelle | Admin |
| `DELETE` | `/courses/:id` | Dersi sil (Soft delete) | Admin |

**Örnek Yanıt (GET /courses/:id):**
```json
{
  "id": 1,
  "code": "CENG301",
  "name": "Database Management Systems",
  "department_id": 1,
  "prerequisites": [
    { "id": 5, "code": "CENG102", "name": "Data Structures" }
  ]
}
```

### Şubeler (Sections)
| Metot | Uç Nokta | Açıklama | Rol |
|-------|----------|----------|-----|
| `GET` | `/sections` | Aktif ders şubelerini listele | Herkes |
| `GET` | `/sections/:id` | Şube detaylarını al (program, eğitmen) | Herkes |
| `POST` | `/sections` | Ders için yeni şube oluştur | Admin |
| `GET` | `/sections/my` | Mevcut eğitmenin verdiği dersleri getir | Fakülte |

### Ders Kayıt (Enrollments)
| Metot | Uç Nokta | Açıklama | Rol |
|-------|----------|----------|-----|
| `POST` | `/enrollments` | Bir şubeye kayıt ol | Öğrenci |
| `DELETE` | `/enrollments/:id` | Dersi bırak (aktif dönemde) | Öğrenci |
| `GET` | `/enrollments/my-enrollments` | Öğrencinin kayıtlı şubelerini listele | Öğrenci |
| `GET` | `/enrollments/my-schedule` | Haftalık ders programını getir | Öğrenci |

**Kayıt Mantığı:**
1.  **Ön Koşul Kontrolü:** Öğrencinin tüm ön koşul derslerini geçip geçmediğini doğrular (`PrerequisiteService` kullanarak).
2.  **Çakışma Kontrolü:** Mevcut derslerle zaman çakışması olup olmadığını kontrol eder (`ScheduleConflictService` kullanarak).
3.  **Kapasite Kontrolü:** Şube kapasite sınırını doğrular.

---

## 📍 2. Yoklama Sistemi Uç Noktaları (+GPS & QR)

### Oturumlar (Sessions)
| Metot | Uç Nokta | Açıklama | Rol |
|-------|----------|----------|-----|
| `POST` | `/attendance/sessions` | Yeni yoklama oturumu başlat | Fakülte |
| `GET` | `/attendance/sessions/active` | Bir şube için aktif oturumu getir | Öğrenci |
| `POST` | `/attendance/sessions/:id/end` | Aktif oturumu sonlandır | Fakülte |

**Oturum Oluşturma Verisi:**
```json
{
  "sectionId": 101,
  "durationMinutes": 45,
  "latitude": 41.0082,
  "longitude": 28.9784,
  "radius": 50
}
```

### Check-in Mantığı
**Uç Nokta**: `POST /attendance/check-in`
**Rol**: Öğrenci

**Algoritma:**
1.  **Mesafe Hesaplama:** Öğrencinin GPS (`lat`, `lng`) verisi ile oturum merkezi arasındaki mesafeyi hesaplamak için **Haversine Formülü** kullanır.
2.  **Spoofing (Sahtecilik) Tespiti:**
    *   **Hız Kontrolü:** Son bilinen konum ile mevcut konum arasındaki seyahat hızını hesaplar. > 100km/s ise (imkansız seyahat), reddeder.
    *   **Doğruluk Kontrolü:** GPS doğruluğu > 50m ise reddeder.
3.  **QR Doğrulama:** QR modu etkinse, benzersiz dinamik QR kod dizesini doğrular.

**Haversine Formülü Uygulaması:**
```javascript
const R = 6371e3; // Metre cinsinden Dünya yarıçapı
const φ1 = lat1 * Math.PI/180;
const φ2 = lat2 * Math.PI/180;
const Δφ = (lat2-lat1) * Math.PI/180;
const Δλ = (lon2-lon1) * Math.PI/180;
const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
          Math.cos(φ1) * Math.cos(φ1) *
          Math.sin(Δλ/2) * Math.sin(Δλ/2);
const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
const distance = R * c; // Sonuç metre cinsinden
```

### Yoklama Raporlama & İstatistikler
| Metot | Uç Nokta | Açıklama | Rol |
|-------|----------|----------|-----|
| `GET` | `/attendance/my-stats` | Öğrencinin yoklama istatistikleri | Öğrenci |
| `GET` | `/attendance/sections/:id/report` | Bir şube için tam yoklama raporu | Fakülte |
| `GET` | `/attendance/analytics/:sectionId` | Haftalık trend analizi (Bonus) | Fakülte |

---

## 🚑 3. Mazeret Yönetimi

| Metot | Uç Nokta | Açıklama | Rol |
|-------|----------|----------|-----|
| `POST` | `/attendance/excuses` | Dosya eki ile mazeret bildir | Öğrenci |
| `GET` | `/attendance/excuses/pending` | Bekleyen istekleri listele | Fakülte |
| `PATCH` | `/attendance/excuses/:id/approve` | Mazeret isteğini onayla | Fakülte |
| `PATCH` | `/attendance/excuses/:id/reject` | Mazeret isteğini reddet | Fakülte |

---

## 🎓 4. Notlandırma Sistemi

| Metot | Uç Nokta | Açıklama | Rol |
|-------|----------|----------|-----|
| `POST` | `/exams` | Sınav oluştur (Vize/Final) | Fakülte |
| `POST` | `/grades` | Öğrenci listesi için not gir | Fakülte |
| `GET` | `/grading/my-grades` | Transkript ve GPA görüntüle | Öğrenci |
| `GET` | `/grading/transcript/pdf` | Resmi PDF transkripti indir | Öğrenci |

**GPA Hesaplama:**
- **Dönem Ortalaması (Semester GPA):** (Toplam (Not Puanı * Kredi)) / Dönem Toplam Kredi.
- **Genel Ortalama (Cumulative GPA):** Toplam Not Puanı / Toplam Kredi.
