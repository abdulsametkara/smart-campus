# Smart Campus Kullanım Kılavuzu (Part 2)

Smart Campus sistemine hoş geldiniz. Bu kılavuz, öğrenci ve fakülte üyelerine yeni Akademik ve Yoklama özelliklerini kullanımda rehberlik eder. Sistemimiz en son veritabanı teknolojileri (Transaction, Trigger, View) ve güvenlik standartları (GPS Doğrulama, SSL) ile güçlendirilmiştir.

## 👥 Roller & Giriş

**Fakülte (Eğitmen):** Ders yönetimi, notlandırma ve yoklama oturumu başlatma erişimi.
**Öğrenci:** Ders kaydı, yoklamaya katılma ve notları görüntüleme erişimi.

admin@smartcampus.edu.tr
ahmet.yildiz@smartcampus.edu.tr
ali.veli@student.smartcampus.edu.tr


Şifreler Aynıdır: Campus123!



---

## 🎓 Öğrenciler İçin

### 1. Ders Kaydı (Enrollment) & İşlem Güvenliği

> **Teknik Özellik:** Ders kayıt işlemi bir **Database Transaction** içinde gerçekleşir. "Kaydol" butonuna bastığınızda kontenjan kontrolü, öğrenci ekleme ve kontenjan düşümü işlemleri atomik olarak yapılır. Arka plandaki **Trigger** mekanizması, kontenjan doluysa işlemi otomatik reddeder.

1. Yan menüden **Akademik > Ders Ekle/Bırak** seçeneğine gidin.
2. Mevcut şubelerin (sections) listesini göreceksiniz.
3. Detayları görmek için turkuaz renkli **"Seç"** butonuna tıklayın.
4. Ders programını inceleyin ve **"Dersi Ekle"** butonuna tıklayın.
   * *Not: Eğer bir ön koşul (Prerequisite) eksikse, Stored Procedure bunu tespit eder ve sistem sizi uyarır.*

![Ekran Görüntüsü: Mazeret bildirim ekranı](D:\ceng\ceng\projeler\smart-campus\screen_shots\ders_kayit.png)

![Ekran Görüntüsü: Mazeret bildirim ekranı](D:\ceng\ceng\projeler\smart-campus\screen_shots\ders_kayit2.png)

![Ekran Görüntüsü: Mazeret bildirim ekranı](D:\ceng\ceng\projeler\smart-campus\screen_shots\ders_onay.png)

![Ekran Görüntüsü: Mazeret bildirim ekranı](D:\ceng\ceng\projeler\smart-campus\screen_shots\ders_onay2.png)

### 2. Yoklamaya Katılma (GPS & QR Güvenliği)

> **Teknik Özellik:** Sistem, coğrafi veri tipleri (PostGIS / Geometry) kullanarak konumunuzu doğrular. **GPS Spoofing (Sahte Konum)** koruması sayesinde, tarayıcınızın gönderdiği konumun tutarlılığı ve sınıf yarıçapı içinde olup olmadığı sunucu tarafında analiz edilir.

1. **Yoklama > Yoklamaya Katıl** menüsüne gidin.
2. Tarayıcınız sorduğunda **Konum İzni'ne (Allow Location Access)** onay verin.
3. Harita mevcut konumunuzu (Mavi nokta) ve sınıf bölgesini (Yeşil daire) gösterecektir.
4. **QR Tarat:** Eğitmen bir QR kod yansıtıyorsa, "QR Tarat" butonuna tıklayın ve kameranızı doğrultun.
5. **Check-In (Katıl):** Doğrulama yapıldığında (Yeşil tik), **"Derse Katıl"** butonuna tıklayın.
   * *Başarılı:* "Yoklama başarılı!" mesajı görünür.
   * *Hata:* "Mesafe çok uzak" veya "Konum reddedildi" mesajı alırsanız güvenlik duvarına takılmışsınız demektir.

![Ekran Görüntüsü: Mazeret bildirim ekranı](D:\ceng\ceng\projeler\smart-campus\screen_shots\yoklama_açma.png)

![Ekran Görüntüsü: Mazeret bildirim ekranı](D:\ceng\ceng\projeler\smart-campus\screen_shots\yoklama_hata.png)

![Ekran Görüntüsü: Mazeret bildirim ekranı](D:\ceng\ceng\projeler\smart-campus\screen_shots\yoklama_basari.png)

### 3. Notlar & Transkript (Raporlama)

> **Teknik Özellik:** Transkript ve not görüntüleme işlemleri, karmaşık SQL sorguları yerine optimize edilmiş **Database Views** üzerinden çalışır. Bu sayede not ortalamalarınız (GPA/CGPA) her zaman güncel ve hızlı görüntülenir.

1. **Notlar > Notlarım** menüsüne gidin.
2. Dönem Ortalamanızı (GPA) ve Genel Ortalamanızı (CGPA) görüntüleyin.
3. Resmi transkriptinizi indirmek için **"PDF Olarak İndir"** butonuna tıklayın.

![Ekran Görüntüsü: Mazeret bildirim ekranı](D:\ceng\ceng\projeler\smart-campus\screen_shots\not1.png)

![Ekran Görüntüsü: Mazeret bildirim ekranı](D:\ceng\ceng\projeler\smart-campus\screen_shots\not2.png)

### 4. Ders Programım

1. Sol menüden **Ders Programı** menüsüne tıklayın.
2. Haftalık programınızı tablo görünümünde görebilir, isterseniz üst kısımdan **Takvim Görünümü (Beta)** seçeneğine geçerek FullCalendar tabanlı haftalık takvim üzerinden derslerinizi inceleyebilirsiniz.
3. **📅 Takvime Ekle (iCal)** butonuna tıklayarak programınızı `.ics` formatında indirip Google Calendar / Outlook gibi kişisel takviminize ekleyebilirsiniz.

### 5. Mazeret Bildirimi

1. **Yoklama > Mazeret Bildir** menüsüne gidin.
2. Dersi ve tarihi seçin.
3. Sağlık raporunuzu veya belgenizi yükleyin (PDF/Resim).
4. **"Gönder"** butonuna tıklayın. Durumu "Mazeretlerim" sayfasından takip edebilirsiniz.

![Ekran Görüntüsü: Mazeret bildirim ekranı](D:\ceng\ceng\projeler\smart-campus\screen_shots\mazeret.png)

![Ekran Görüntüsü: Mazeret bildirim ekranı](D:\ceng\ceng\projeler\smart-campus\screen_shots\mazeret2.png)

---

## 🏫 Fakülte (Eğitmenler) İçin

### 1. Yoklama Oturumu Başlatma

1. **Yoklama > Yoklama Al** menüsüne gidin.
2. Açılır menüden **Ders Şubesini (Section)** seçin.
3. Süreyi (örn. 60 dk) ve yarıçapı (örn. 50 metre) ayarlayın.
4. **"OTURUMU BAŞLAT"** butonuna tıklayın.
5. Ekranda bir **QR Kod** belirecektir. Bunu öğrencilere yansıtın.
6. **Gerçek Zamanlı Panel:** Öğrenciler check-in yaptıkça "Canlı Katılım" listesinin dolduğunu izleyin.

![Ekran Görüntüsü: Mazeret bildirim ekranı](D:\ceng\ceng\projeler\smart-campus\screen_shots\yoklama_açma.png)

### 2. Notlandırma (Grading)

1. **Notlar > Not Girişi** menüsüne gidin.
2. Şubenizi seçin.
3. Bir Sınav Oluşturun (Vize/Final).
4. Öğrenci listesi için puanları girin ve **"Kaydet"** butonuna tıklayın.
   * *Sistem, girilen notları otomatik olarak harf notuna (AA, BA vb.) dönüştürecektir.*
5. Notları öğrencilere görünür yapmak için **"Yayınla"** butonuna tıklayın.

![Ekran Görüntüsü: Mazeret bildirim ekranı](D:\ceng\ceng\projeler\smart-campus\screen_shots\not1.png)

### 3. Mazeret Onaylama

1. **Yoklama > Mazeret Yönetimi** menüsüne gidin.
2. Bekleyen istekleri ve ekli belgeleri inceleyin.
3. **"Onayla"** veya **"Reddet"** butonuna tıklayın.

![Ekran Görüntüsü: Mazeret bildirim ekranı](D:\ceng\ceng\projeler\smart-campus\screen_shots\mazeret2.png)

### 4. Program Oluşturma (Yönetici / Akademik)

1. Yönetici olarak giriş yaptıktan sonra sol menüden **Yönetim > Program Oluşturma** sayfasına gidin.
2. İlgili dönem kodunu (örn. `2025-SPRING`) girin.
3. **⚡ Programı Oluştur** düğmesine tıklayarak arka plandaki CSP tabanlı algoritmanın dersleri sınıflara ve zaman aralıklarına atamasını başlatın.
4. İşlem bittiğinde ekranda son çalıştırmanın özeti görüntülenir; dilerseniz **📅 iCal Olarak Dışa Aktar** butonu ile üretilmiş programı iCal dosyası olarak indirebilirsiniz.

---

## 🔒 Güvenlik Notları

* **SSL/HTTPS:** Tüm veri trafiği şifreli bağlantı ile korunmaktadır.
* **Şifreleme:** Kullanıcı şifreleri veritabanında açık metin olarak değil, güçlü hash algoritmaları (Argon2/Bcrypt) ile saklanır.
* **Yetkilendirme:** API uç noktaları, kullanıcı rollerine (Öğrenci/Fakülte/Admin) göre sıkı erişim kontrolleriyle korunur.

---

## 📅 Ders Programı Görüntüleme (Developer 4)

### Haftalık Ders Programı

**Erişim:** Sidebar > Akademik > Ders Programı

**Özellikler:**
1. **Tablo Görünümü:**
   - Haftalık ders programını tablo formatında görüntüleyin
   - Her ders kartında: Ders kodu, ders adı, öğretim üyesi, sınıf bilgisi
   - Ders kartlarına tıklayarak detay sayfasına gidebilirsiniz

2. **Takvim Görünümü:**
   - FullCalendar entegrasyonu ile modern takvim görünümü
   - Haftalık ve günlük görünüm seçenekleri
   - Dersler renkli bloklar olarak gösterilir

3. **iCal Export:**
   - "📥 İndir" butonuna tıklayarak ders programınızı `.ics` formatında indirin
   - Google Calendar, Outlook, Apple Calendar gibi uygulamalara ekleyebilirsiniz

**Çakışma Uyarıları:**
- Sistem, ders programınızdaki çakışmaları otomatik tespit eder
- Çakışan dersler uyarı mesajı ile gösterilir

---

## 🏫 Sınıf Rezervasyon Sistemi (Developer 4)

### Rezervasyon Oluşturma (Öğrenci/Faculty)

**Erişim:** Sidebar > Akademik > Sınıf Rezervasyonları

**Adımlar:**
1. Sınıf seçin (dropdown'dan)
2. Tarih seçin (takvimden)
3. Başlangıç ve bitiş saatlerini girin
4. Amaç/Açıklama yazın
5. "Rezervasyon Talebi Oluştur" butonuna tıklayın

**Önemli Notlar:**
- Rezervasyon talebi oluşturulduğunda durum "Beklemede" olur
- Bekleyen rezervasyonunuzu sadece siz görebilirsiniz
- Admin onayladıktan sonra rezervasyon herkese görünür hale gelir
- Sadece onaylanmış rezervasyonlar sınıfı doldurur

### Rezervasyon Onaylama (Admin)

**Erişim:** Sidebar > Yönetim > Rezervasyon Yönetimi

**Özellikler:**
1. **Filtreler:**
   - Beklemede: Onay bekleyen rezervasyonlar
   - Onaylandı: Onaylanmış rezervasyonlar
   - Reddedildi: Reddedilmiş rezervasyonlar
   - Tümü: Tüm rezervasyonlar

2. **İşlemler:**
   - "✅ Onayla" butonu: Rezervasyonu onaylar
   - "❌ Reddet" butonu: Rezervasyonu reddeder
   - Çakışma kontrolü: Onaylarken otomatik çakışma kontrolü yapılır

---

## 🍽️ Yemek Menüsü ve Rezervasyon (Developer 4)

### Menü Görüntüleme

**Erişim:** Sidebar > Yemekhane > Menü

**Özellikler:**
1. **Haftalık Görünüm:**
   - Hafta navigasyonu (← →) ile haftalar arasında geçiş yapın
   - Her gün için tab seçimi
   - Öğle/Akşam yemeği toggle butonları

2. **Menü Detayları:**
   - Menü öğeleri (çorba, ana yemek, vb.)
   - Besin değerleri (kalori, protein, karbonhidrat)
   - Fiyat bilgisi

3. **Rezervasyon:**
   - "Hemen Rezerve Et" butonuna tıklayın
   - Onay dialog'unda fiyat bilgisini kontrol edin
   - Onayladıktan sonra cüzdan bakiyenizden düşülür
   - QR kod otomatik oluşturulur

### Rezervasyonlarım

**Erişim:** Sidebar > Yemekhane > Yemek Rezervasyonlarım

**Özellikler:**
1. **Aktif Biletler:**
   - Gelecek tarihli ve kullanılmamış rezervasyonlar
   - QR kod görüntüleme
   - "Taramayı Simüle Et" butonu (test için)

2. **Geçmiş/Kullanılan:**
   - Kullanılmış veya geçmiş tarihli rezervasyonlar

**QR Kod Kullanımı:**
- Rezervasyon kartına tıklayarak QR kodu görüntüleyin
- Yemekhane turnikesinde QR kodu okutun
- Sadece menü tarihinde kullanılabilir

### Menü Yönetimi (Admin)

**Erişim:** Sidebar > Yönetim > Yemek Menüsü Yönetimi

**Özellikler:**
1. **Menü Oluşturma:**
   - Yemekhane ID, Tarih, Öğün Tipi (Öğle/Akşam)
   - Menü öğeleri ekleme
   - Besin değerleri girişi
   - Fiyat belirleme
   - Hemen yayınlama seçeneği

2. **Menü Düzenleme:**
   - Mevcut menüleri düzenleme
   - Yayınlama durumunu değiştirme
   - Menü silme (aktif rezervasyon varsa silinemez)

**Önemli Notlar:**
- Sadece yayınlanmış (`is_published: true`) menüler kullanıcılara görünür
- Aynı güne hem öğle hem akşam yemeği eklenebilir
- Menü fiyatı rezervasyon sırasında cüzdan bakiyesinden düşülür

---

## 💳 Cüzdan ve Ödeme (Developer 4)

### Cüzdan Yükleme

**Erişim:** Sidebar > Yemekhane > Cüzdanım

**Adımlar:**
1. "Bakiye Yükle" butonuna tıklayın
2. Tutar seçin (25, 50, 100, 200, 500 TL) veya özel tutar girin
3. Kayıtlı kartınız varsa seçin, yoksa yeni kart ekleyin
4. Kart bilgilerini girin
5. "Bu kartı sonraki ödemeler için kaydet" seçeneğini işaretleyebilirsiniz
6. Ödemeyi tamamlayın

**Özellikler:**
- Kayıtlı kartlarınızı görüntüleme
- Varsayılan kart belirleme
- İşlem geçmişi görüntüleme

---

## 🔒 Güvenlik Notları

* **SSL/HTTPS:** Tüm veri trafiği şifreli bağlantı ile korunmaktadır.
* **Şifreleme:** Kullanıcı şifreleri veritabanında açık metin olarak değil, güçlü hash algoritmaları (Argon2/Bcrypt) ile saklanır.
* **Yetkilendirme:** API uç noktaları, kullanıcı rollerine (Öğrenci/Fakülte/Admin) göre sıkı erişim kontrolleriyle korunur.

---
