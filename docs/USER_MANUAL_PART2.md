# Kullanıcı Kılavuzu - Part 2: Yoklama Sistemi

## 📍 GPS Yoklama Nasıl Çalışır?

Campy, öğrencilerin derse fiziksel olarak katıldığını GPS konum doğrulaması ile kontrol eder.

---

## 👨‍🏫 Öğretim Üyesi İşlemleri

### 1. Yoklama Oturumu Başlatma

1. **Yoklama** menüsüne tıklayın
2. Ders şubesini seçin
3. Süre (dakika) ve yarıçap (metre) ayarlayın
4. **"Sınıf Konumumu Al"** butonuna tıklayın
5. **"Oturumu Başlat"** butonuna tıklayın
6. QR kod ekranda görünecek

> 💡 İpucu: QR kodu projeksiyon ile öğrencilere gösterebilirsiniz.

### 2. Yoklama Takibi

Oturum aktifken:
- Katılan öğrenci sayısını anlık görün
- **"Raporu Göster"** ile detayları inceleyin
- Şüpheli girişler (flagged) işaretlenir

### 3. Oturumu Kapatma

- **"Oturumu Bitir"** butonuna tıklayın
- Katılmayan öğrenciler otomatik "Gelmedi" olarak işaretlenir
- Devamsızlık saatleri güncellenir

### 4. Mazeret Yönetimi

1. **Mazeretler** menüsüne gidin
2. Bekleyen talepleri inceleyin
3. Yüklenen belgeyi görüntüleyin
4. **Onayla** veya **Reddet** seçin
5. Öğrenciye otomatik e-posta gönderilir

---

## 👨‍🎓 Öğrenci İşlemleri

### 1. Yoklama Verme

1. **Yoklama** menüsüne tıklayın
2. **"Konumumu Al"** butonuna tıklayın
3. Tarayıcı konum izni isteğini **kabul edin**
4. Haritada konumunuzu görün
5. Hocanın gösterdiği **QR kodunu** girin
6. **"Yoklamayı Onayla"** butonuna tıklayın

> ⚠️ Uyarı: Sınıfın belirtilen yarıçapı içinde olmalısınız!

### 2. Devamsızlık Durumu

**Devamsızlığım** sayfasında:
- Toplam ders saati
- Kullanılan devamsızlık saati
- Kalan hakkınız
- Durum göstergesi (Güvenli/Uyarı/Kritik)

### 3. Mazeret Bildirme

1. **Mazeret** menüsüne gidin
2. Devamsız olduğunuz dersi seçin
3. Mazeret başlığı ve açıklama yazın
4. Varsa belge yükleyin (Sağlık raporu vb.)
5. **"Gönder"** butonuna tıklayın

---

## 🚨 Sık Karşılaşılan Hatalar

| Hata | Çözüm |
|------|-------|
| "GPS doğruluğu çok düşük" | Açık alanda veya pencere kenarında deneyin |
| "Sınıfa çok uzaksınız" | Sınıfın geofence alanı içine girin |
| "Zaten yoklama verdiniz" | Bu oturumda zaten kaydınız var |
| "Oturum bulunamadı" | QR kodu doğru girdiğinizden emin olun |
| "Yoklama süresi dolmuş" | Hoca oturumu kapamış olabilir |

---

## 📱 Mobil Kullanım

- Uygulama mobil uyumludur
- Telefonda GPS daha doğru çalışır
- Ana ekrana ekleyerek PWA olarak kullanabilirsiniz

---

## 📧 E-posta Bildirimleri

Sistem aşağıdaki durumlarda otomatik e-posta gönderir:
- ✅ Mazeret onaylandığında
- ❌ Mazeret reddedildiğinde
