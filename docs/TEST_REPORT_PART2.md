# Smart Campus Test Raporu (Part 2)

Bu belge, Smart Campus Part 2 uygulaması için test stratejisi, kapsamı ve sonuçlarını özetlemektedir.

## 🧪 Test Stratejisi
Karmaşık backend mantığı için spesifik **Unit Testler** (Birim Testleri) ve frontend-backend akışları için **Manuel Entegrasyon Testleri** karması kullandık.

---

## ✅ Unit Testler (Backend)

Bağımsız servisleri test etmek için **Jest** framework'ü kullanıldı.

### 1. Attendance (Yoklama) Servisi (`attendance.service.test.js`)
*   **Amaç:** Haversine mesafe hesaplama ve sahtecilik önleme (spoofing detection) mantığını doğrulamak.
*   **Kapsanan Senaryolar:**
    *   ✅ İki koordinat arasındaki mesafeyi doğru hesapla.
    *   ✅ Mesafe > Yarıçap ise check-in reddet.
    *   ✅ Mesafe <= Yarıçap ise check-in kabul et.
    *   ✅ Hız > 100 km/s ise spoofing olarak işaretle (Çok kısa sürede birbirinden çok uzak check-in'ler).
    *   ✅ Düşük GPS doğruluğunu (>50m) tespit et.

### 2. Prerequisite (Ön Koşul) Servisi (`prerequisite.service.test.js`)
*   **Amaç:** Ders kayıt kurallarının sıkı bir şekilde uygulandığından emin olmak.
*   **Kapsanan Senaryolar:**
    *   ✅ Ön koşul yoksa kayda izin ver.
    *   ✅ Ön koşullar geçilmişse kayda izin ver.
    *   ✅ Ön koşul başarısızsa veya alınmamışsa kaydı reddet.
    *   ✅ Özyinelemeli (Recursive) zincirleri yönet (Ders C için B, B için A gerekli).

### 3. Schedule Conflict (Zaman Çakışması) Servisi (`scheduleConflict.service.test.js`)
*   **Amaç:** Öğrenci programında zaman çakışmasını önlemek.
*   **Kapsanan Senaryolar:**
    *   ✅ Günler farklıysa izin ver.
    *   ✅ Zamanlar çakışmıyorsa izin ver.
    *   ✅ **Reddet:** Eğer yeni ders, mevcut kayıtlı bir dersle kısmen veya tamamen çakışıyorsa.

---

## 🏗️ Entegrasyon & Fonksiyonel Testler

### Akademik Özellikler
| Özellik | Test Durumu | Sonuç | Notlar |
|---------|-----------|--------|-------|
| Kayıt (Enrollment) | Öğrenci ders ekler (çakışma yok) | ✅ Geçti | Başarılı mesajı gösterildi |
| Kayıt (Enrollment) | Öğrenci ders ekler (çakışma var) | ✅ Geçti | "Çakışma var" hatası gösterildi |
| Transkript | PDF Oluştur | ✅ Geçti | PDF indirildi, format doğru |
| Takvim | 2025-2026 verisini görüntüle | ✅ Geçti | Güz/Bahar sekmeleri çalışıyor |

### Yoklama Özellikleri
| Özellik | Test Durumu | Sonuç | Notlar |
|---------|-----------|--------|-------|
| Geofencing | Yarıçap dışından check-in | ✅ Geçti | Doğru şekilde reddedildi |
| Geofencing | Yarıçap içinden check-in | ✅ Geçti | "Başarılı" işaretlendi |
| Gerçek Zamanlı | Eğitmen ekranında WebSocket güncellemeleri | ✅ Geçti | Anlık satır ekleme doğrulandı |
| QR Kod | Kamera ile QR tara | ✅ Geçti | Kod ayrıştırıldı ve doğru şekilde gönderildi |

---

## 🐛 Bilinen Sorunlar & Sınırlamalar

1.  **GPS Sapması (Drift):** Bazı mobil cihazlarda, iç mekanlarda GPS doğruluğu dalgalanabilir, bu da sınırda olan öğrenciler için nadiren yanlış negatiflere (reddedilme) neden olabilir. *Çözüm: Önerilen yarıçap 20m yerine 50m olarak ayarlandı.*
2.  **Tarayıcı İzinleri:** Kullanıcılar Konum erişimine açıkça izin vermelidir. Reddedilirse, sayfa manuel tekrar deneme ister.
3.  **PDF Fontları:** Özel Türkçe karakterler (ğ, ş, ı) `pdfkit` içinde özel font gömme gerektirir, bu uygulandı ancak standart fontlara dayanıyor.

## 📈 Sonuç
Sistem, Part 2 gereksinimleri için tüm kritik test senaryolarını geçti. Temel iş mantığı birim testleri (unit tests) ile koruma altına alındı ve kullanıcı akışları manuel olarak doğrulandı.
