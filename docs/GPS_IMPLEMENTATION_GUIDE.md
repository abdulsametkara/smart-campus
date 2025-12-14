# GPS Yoklama Sistemi - Teknik Dokümantasyon

## 1. Genel Bakış

Campy GPS yoklama sistemi, öğrencilerin derse katılımını konum bazlı doğrulama ile takip eder. Sistem, Haversine formülü kullanarak öğrenci ile sınıf arasındaki mesafeyi hesaplar.

---

## 2. Mimari

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   Frontend      │────▶│    Backend      │────▶│   PostgreSQL    │
│   (React)       │     │   (Express)     │     │   (Database)    │
│                 │     │                 │     │                 │
│ - Leaflet Map   │     │ - Haversine     │     │ - Sessions      │
│ - GPS API       │     │ - Spoofing Alg. │     │ - Records       │
└─────────────────┘     └─────────────────┘     └─────────────────┘
```

---

## 3. Haversine Formülü

İki GPS koordinatı arasındaki mesafeyi metre cinsinden hesaplar:

```javascript
calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371e3; // Dünya yarıçapı (metre)
    const φ1 = lat1 * Math.PI / 180;
    const φ2 = lat2 * Math.PI / 180;
    const Δφ = (lat2 - lat1) * Math.PI / 180;
    const Δλ = (lon2 - lon1) * Math.PI / 180;

    const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ/2) * Math.sin(Δλ/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

    return R * c; // Mesafe (metre)
}
```

### Örnek Hesaplama:
- Sınıf: (41.0550, 28.9505)
- Öğrenci: (41.0551, 28.9504)
- Mesafe: ~14.2 metre

---

## 4. GPS Spoofing Algılama

### 4.1 Kontrol Katmanları

| # | Kontrol | Eşik Değer | Eylem |
|---|---------|------------|-------|
| 1 | GPS Accuracy | > 100m | Reddet + flag |
| 2 | Mesafe | > radius + buffer | Reddet + flag |
| 3 | Sınır Bölgesi | %90-100 + düşük accuracy | Flag (uyarı) |
| 4 | Mükerrer Giriş | Aynı oturum | Reddet |

### 4.2 Accuracy Buffer Hesaplama

```javascript
const accuracyBuffer = Math.min(accuracy, 20); // Max 20m buffer
const maxDistance = radius + accuracyBuffer;

if (distance > maxDistance) {
    // REJECT - Too far
}
```

### 4.3 Flag Reasons

| Kod | Açıklama |
|-----|----------|
| `Mesafe aşımı: XXm` | Öğrenci geofence dışında |
| `Düşük GPS doğruluğu` | Accuracy > 100m |
| `Sınır bölgesi + düşük accuracy` | Şüpheli konum verileri |

---

## 5. Geofence Yapısı

```
         ┌────────────────────────┐
         │                        │
         │      GEOFENCE         │
         │    (radius = 15m)      │
         │                        │
         │    ┌──────────┐        │
         │    │ SINIF    │        │
         │    │ (center) │        │
         │    └──────────┘        │
         │                        │
         └────────────────────────┘
              + accuracy buffer
```

- **Varsayılan yarıçap:** 15 metre
- **Accuracy buffer:** 0-20 metre (dinamik)
- **Toplam izin:** radius + min(accuracy, 20)

---

## 6. Veritabanı Şeması

### attendance_sessions
```sql
CREATE TABLE attendance_sessions (
    id SERIAL PRIMARY KEY,
    section_id INTEGER REFERENCES course_sections(id),
    instructor_id INTEGER REFERENCES users(id),
    start_time TIMESTAMP,
    end_time TIMESTAMP,
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    radius INTEGER DEFAULT 15,
    qr_code VARCHAR(255) UNIQUE,
    status VARCHAR(20) DEFAULT 'ACTIVE'
);
```

### attendance_records
```sql
CREATE TABLE attendance_records (
    id SERIAL PRIMARY KEY,
    session_id INTEGER REFERENCES attendance_sessions(id),
    student_id INTEGER REFERENCES users(id),
    check_in_time TIMESTAMP,
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    distance_from_center FLOAT,
    status VARCHAR(20), -- PRESENT, ABSENT, EXCUSED
    is_flagged BOOLEAN DEFAULT FALSE,
    flag_reason VARCHAR(255)
);
```

---

## 7. API Akışı

### Yoklama Verme

```
1. Frontend: navigator.geolocation.getCurrentPosition()
2. Frontend: POST /attendance/checkin { lat, lon, accuracy, qr_code }
3. Backend: Session bulunur (QR ile)
4. Backend: Enrollment kontrolü
5. Backend: Accuracy kontrolü (> 100m?)
6. Backend: Haversine mesafe hesaplaması
7. Backend: Mesafe <= radius + buffer?
8. Backend: Mükerrer kayıt kontrolü
9. Backend: AttendanceRecord oluştur (PRESENT)
10. Frontend: "Yoklama Başarılı!" mesajı
```

---

## 8. Test Senaryoları

### 8.1 Başarılı Yoklama
- Öğrenci sınıf içinde (< 15m)
- GPS accuracy < 100m
- QR kod doğru
- İlk deneme

### 8.2 Mesafe Hatası
- Öğrenci uzakta (> radius + buffer)
- Beklenen: "Sınıfa çok uzaksınız" hatası

### 8.3 Düşük Accuracy
- GPS accuracy > 100m
- Beklenen: "GPS doğruluğu çok düşük" hatası

### 8.4 Mükerrer Giriş
- Aynı oturumda ikinci deneme
- Beklenen: "Zaten yoklama verdiniz" hatası

---

## 9. Bilinen Sınırlamalar

1. **Masaüstü bilgisayarlarda:** GPS sensörü olmadığı için IP tabanlı konum kullanılır (çok hatalı)
2. **Kapalı alanlarda:** GPS sinyali zayıf olabilir
3. **VPN kullanımı:** IP tabanlı spoofing riski
