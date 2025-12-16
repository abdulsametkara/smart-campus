# Smart Campus Kullanım Kılavuzu (Part 2)

Smart Campus sistemine hoş geldiniz. Bu kılavuz, öğrenci ve fakülte üyelerine yeni Akademik ve Yoklama özelliklerini kullanımda rehberlik eder. Sistemimiz en son veritabanı teknolojileri (Transaction, Trigger, View) ve güvenlik standartları (GPS Doğrulama, SSL) ile güçlendirilmiştir.

## 👥 Roller & Giriş

**Fakülte (Eğitmen):** Ders yönetimi, notlandırma ve yoklama oturumu başlatma erişimi.
**Öğrenci:** Ders kaydı, yoklamaya katılma ve notları görüntüleme erişimi.

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

### 4. Mazeret Bildirimi

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

---

## 🔒 Güvenlik Notları

* **SSL/HTTPS:** Tüm veri trafiği şifreli bağlantı ile korunmaktadır.
* **Şifreleme:** Kullanıcı şifreleri veritabanında açık metin olarak değil, güçlü hash algoritmaları (Argon2/Bcrypt) ile saklanır.
* **Yetkilendirme:** API uç noktaları, kullanıcı rollerine (Öğrenci/Fakülte/Admin) göre sıkı erişim kontrolleriyle korunur.

---
