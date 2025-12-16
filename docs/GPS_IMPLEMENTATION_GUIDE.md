# Smart Campus GPS Yoklama Uygulama Rehberi

Bu rehber, GPS tabanlı yoklama sisteminin teknik uygulamasını, mesafe hesaplama algoritmasını, konum doğrulama ve sahtecilik önleme (spoofing detection) önlemlerini detaylandırır.

## 📡 Genel Bakış
Sistem, eğitmenlerin konum tabanlı bir yoklama oturumu başlatmasına izin verir. Öğrencilerin başarılı bir şekilde check-in yapabilmeleri için fiziksel olarak belirtilen yarıçap (örneğin 50 metre) içinde bulunmaları gerekir.

**Temel Özellikler:**
- Gerçek zamanlı GPS koordinat yakalama.
- Haversine formülü kullanılarak coğrafi sınırlama (Geofencing).
- Sahtecilik önleme mekanizmaları (Hız ve Doğruluk kontrolleri).

---

## 🧮 Haversine Formülü Uygulaması

Konum doğrulamanın çekirdeği, bir küre (Dünya) üzerindeki iki nokta arasındaki büyük daire mesafesini hesaplamak için Haversine formülünü kullanır.

**Dosya:** `backend/utils/validation.js`

```javascript
const R = 6371e3; // Metre cinsinden Dünya yarıçapı

function calculateDistance(lat1, lon1, lat2, lon2) {
    const φ1 = lat1 * Math.PI / 180;
    const φ2 = lat2 * Math.PI / 180;
    const Δφ = (lat2 - lat1) * Math.PI / 180;
    const Δλ = (lon2 - lon1) * Math.PI / 180;

    const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
              Math.cos(φ1) * Math.cos(φ1) *
              Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    
    // Sonuç metre cinsindendir
    return R * c; 
}
```

---

## 🛡️ Spoofing (Sahtecilik) Tespit Mekanizmaları

Öğrencilerin sahte konum (GPS spoofing) kullanarak konumlarını taklit etmelerini önlemek için `AttendanceService.js` içinde çeşitli kontroller uyguladık.

### 1. Doğruluk (Accuracy) Kontrolü
Çoğu meşru GPS sinyalinin bir doğruluk yarıçapı vardır. Sahte metin tabanlı geçersiz kılmalar genellikle mükemmel (0m) veya çok kötü (>1000m) doğruluğa sahiptir.
- **Kural:** Eğer `accuracy > 50 metre` ise, check-in işaretlenir veya reddedilir.

### 2. İmkansız Seyahat Hızı (Hız Kontrolü)
Öğrencinin bilinen son check-in konumunu ve zamanını saklıyoruz.
- **Mantık:** `last_checkin` ile `current_checkin` arasındaki mesafeyi hesapla.
- **Hesaplama:** `Hız = Mesafe / ZamanFarkı`.
- **Kural:** Eğer `Hız > 100 km/s` ise (yaklaşık 27 m/s) ve süre çok kısaysa, bu imkansız seyahat (ışınlanma) anlamına gelir ve spoofing belirtisidir.

### 3. Cihaz Parmak İzi (Temel)
Otomatik script'leri veya emülatör uyumsuzluklarını tespit etmek için `User-Agent` ve cihaz platform bilgisini `device_info` alanında saklıyoruz.

---

## 🧪 Test Senaryoları

### Senaryo A: Başarılı Check-in
1.  Eğitmen `41.0082, 28.9784` konumunda ve `50m` yarıçapla oturum açar.
2.  Öğrenci `41.0082, 28.9785` konumundadır (~10m mesafe).
3.  **Sonuç:** ✅ PRESENT (VAR)

### Senaryo B: Menzil Dışı (Out of Range)
1.  Eğitmen Kampüste (`41.0082, 28.9784`).
2.  Öğrenci Evde (`41.1000, 28.9500`) > 10km uzakta.
3.  **Sonuç:** ❌ REJECTED (REDDEDİLDİ) - "Mesafe: 12500m > 50m"

### Senaryo C: Spoofing Girişimi (Işınlanma)
1.  Öğrenci Kampüs A'da check-in yapar (09:00).
2.  Öğrenci Kampüs B'de (1000km uzakta) check-in yapar (09:05).
3.  Hız > 10000 km/s.
4.  **Sonuç:** ❌ REJECTED / FLAGGED (Şüpheli aktivite tespit edildi)

---

## 📱 Frontend Uygulaması
**Dosya:** `frontend/src/pages/attendance/StudentAttendancePage.js`

Tarayıcının Geolocation API'sini kullanır:
```javascript
navigator.geolocation.getCurrentPosition(
    (position) => {
        const { latitude, longitude, accuracy } = position.coords;
        // Backend'e gönder...
    },
    (error) => {
        // İzin reddedildi durumlarını ele al...
    },
    { enableHighAccuracy: true }
);
```
**Leaflet Haritası**, öğrencinin sınıf geofence dairesine göre konumunu görsel olarak göstermek için kullanılır.
