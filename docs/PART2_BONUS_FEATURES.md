# Smart Campus - Part 2 Bonus Özellikler Uygulaması (+15 Puan)

Bu belge, Smart Campus projesi için geliştirilen gelişmiş bonus özelliklerin detaylarını içerir.

---

## 🎁 Bonus Özellikler Özeti

| Özellik | Puan | Durum | Uygulama Detayları |
|---------|--------|--------|------------------------|
| **1. Gerçek Zamanlı Yoklama Paneli** | +5 | ✅ Tamamlandı | Anlık yoklama güncellemeleri için WebSocket (Socket.IO) entegrasyonu. |
| **2. QR Kod Alternatifi** | +5 | ✅ Tamamlandı | Kamera tabanlı yoklama için HTML5 QR Tarayıcı. |
| **3. Gelişmiş Spoofing Tespiti** | +3 | ✅ Tamamlandı | GPS Doğruluğu + Hız (İmkansız Seyahat) + Cihaz kontrolleri. |
| **4. Yoklama Analitiği** | +2 | ✅ Tamamlandı | Haftalık trend grafikleri, dağılım şemaları ve tahminler. |

---

## 📡 1. Gerçek Zamanlı Yoklama Paneli (WebSocket)

### Amaç
Eğitmenlere, sayfayı yenilemeye gerek kalmadan öğrenciler sınıfa girdikçe anlık geri bildirim sağlamak.

### Uygulama
*   **Teknoloji:** `Socket.IO` (İstemci & Sunucu)
*   **İş Akışı:**
    1.  Eğitmen bir oturum oluşturur -> `session-{id}` WebSocket odasına katılır.
    2.  Öğrenci API üzerinden başarıyla yoklamaya katılır.
    3.  Backend, ilgili oturum odasına `student-checked-in` olayını (event) gönderir.
    4.  Frontend (Eğitmen Sayfası) bu olayı alır ve öğrenciyi "Canlı Katılım" listesine anında ekler.
    5.  Toast bildirimi (SweetAlert2) görünür: "Ali Yılmaz katıldı!".
*   **Görsel Gösterge:** Canlı bağlantı durumu (● Bağlı / ○ Bağlantı Yok), WebSocket durumunu gösterir.

---

## 📷 2. QR Kod Alternatifi

### Amaç
GPS'in güvenilmez olduğu durumlarda veya daha sıkı kontrol için yedek bir yoklama yöntemi sağlamak.

### Uygulama
*   **Kütüphane:** `html5-qrcode`
*   **İş Akışı:**
    1.  Eğitmen, benzersiz ve dinamik bir QR kod yansıtır (oturum başına üretilir).
    2.  Öğrenci yoklama ekranında "QR Tarat" butonuna tıklar.
    3.  Uygulama içinde kamera verimli bir şekilde açılır.
    4.  Öğrenci yansıtılan kodu tarar.
    5.  Çözülen kod, fiziksel varlığın kanıtı olarak GPS verileriyle birlikte backend'e gönderilir.

---

## 🛡️ 3. Gelişmiş Spoofing (Sahtecilik) Tespiti

### Amaç
Fake GPS uygulamaları veya konum sahteciliği kullanarak yapılan hile girişimlerini önlemek.

### Tespit Mekanizmaları
1.  **GPS Doğruluk Kontrolü:**
    *   Gerçek GPS sinyallerinin bir doğruluk yarıçapı vardır (örn. 10-20m).
    *   Sahte konumlar genellikle mükemmel doğruluk (0m) veya çok kötü doğruluk (>1000m) verir.
    *   **Kural:** Eğer `accuracy > 50 metre` ise, check-in şüpheli olarak işaretlenir.

2.  **İmkansız Seyahat (Hız Kontrolü):**
    *   Son check-in ile mevcut check-in arasındaki zaman ve mesafeyi takip ediyoruz.
    *   **Hesaplama:** `Hız = Mesafe / Zaman Farkı`.
    *   **Kural:** Eğer bir öğrenci > 100 km/s hızla hareket etmişse (örn. Kampüs A'da check-in yapıp 5 dakika sonra 100km uzaktaki Kampüs B'de check-in yaparsa), bu şüpheli olarak işaretlenir.

3.  **Cihaz Parmak İzi:**
    *   Emülatör kullanımını veya script tabanlı saldırıları tespit etmek için `User-Agent` kaydedilir.

---

## 📊 4. Yoklama Analitiği

### Amaç
Fakülteye ders performansı ve öğrenci katılım trendleri hakkında içgörüler sunmak.

### Uygulama
*   **Kütüphane:** `chart.js` ve `react-chartjs-2`
*   **Özellikler:**
    *   **Haftalık Trend Çizgisi:** Haftalar içindeki katılım yüzdesi dalgalanmalarını gösterir.
    *   **Dağılım Halkası (Doughnut):** Katılan, Yok, Mazeretli dağılımının görsel dökümü.
    *   **Tahmin:** Gelecek haftanın beklenen katılımını tahmin etmek için basit doğrusal ekstrapolasyon.
    *   **İstatistik Kartları:** En yüksek katılım, En düşük katılım, Ortalama oranlar.

---

## 🧪 Doğrulama

Tüm bonus özellikler canlı sistemde doğrulanabilir:
1.  **Dashboard:** Bir sekmede `/attendance/instructor` sayfasını açın, diğer sekmede öğrenci olarak check-in yapın. Güncellemenin anında gerçekleştiğini izleyin.
2.  **Analitik:** `/attendance/analytics` adresini ziyaret edin (Fakülte rolü).
3.  **QR:** `/attendance/student` sayfasındaki kamera seçeneğini kullanın.
