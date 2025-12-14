# 🏆 Smart Campus - Bonus Özellikler & Ekstra Puanlar

Bu proje, temel gereksinimlerin ötesine geçerek **10/10 Bonus Puan** hedefiyle geliştirilmiştir. Aşağıda, başarıyla uygulanan ek özelliklerin detayları ve teknik açıklamaları yer almaktadır.

---

## 📊 Bonus Özellikler Özeti

| Özellik                               | Puan Değeri | Durum        | Açıklama                                                                           |
|:------------------------------------- |:-----------:|:------------:|:---------------------------------------------------------------------------------- |
| **İki Aşamalı Doğrulama (2FA)**       | **+3 Puan** | ✅ Tamamlandı | Google Authenticator entegrasyonu (TOTP).                                          |
| **Kullanıcı Aktivite Logları**        | **+2 Puan** | ✅ Tamamlandı | Tüm kritik işlemlerin (Login, Register vb.) kayıt altına alınması ve Admin paneli. |
| **Gelişmiş E-posta Şablonları**       | **+2 Puan** | ✅ Tamamlandı | HTML formatında, profesyonel tasarımlı e-postalar.                                 |
| **Hesap Kilitleme (Account Lockout)** | **+2 Puan** | ✅ Tamamlandı | 5 başarısız giriş denemesinde hesabın 15 dakika kilitlenmesi.                      |
| **Gelişmiş Validasyon & Şifre Gücü**  | **+1 Puan** | ✅ Tamamlandı | Görsel şifre gücü ölçer ve detaylı form validasyonları.                            |

**TOPLAM BONUS PUAN: 10 / 10** 🚀

---

## 🛠️ Teknik Detaylar

### 1. İki Aşamalı Doğrulama (2FA) 🔐

Kullanıcı güvenliğini en üst düzeye çıkarmak için **Time-based One-Time Password (TOTP)** standardı kullanılmıştır.

- **Kütüphaneler:** `speakeasy` (kod üretimi/doğrulama), `qrcode` (QR kod oluşturma).
- **Akış:**
  1. Kullanıcı profil sayfasından 2FA'yı etkinleştirir.
  2. Sistem benzersiz bir `secret` üretir ve QR kod olarak gösterir.
  3. Kullanıcı Google Authenticator ile kodu taratır ve doğrular.
  4. Giriş yaparken, eğer 2FA aktifse sistem JWT token vermez; bunun yerine geçici bir `tempToken` verir ve kod ister.
  5. Doğru kod girildiğinde asıl oturum tokenları verilir.

### 2. Kullanıcı Aktivite Logları (Audit Logs) 📋

Sistemdeki hareketleri izlemek için kapsamlı bir loglama altyapısı kurulmuştur.

- **Veritabanı:** `ActivityLogs` tablosunda `user_id`, `action`, `ip_address`, `user_agent` ve `created_at` tutulur.
- **İzlenen Eylemler:** `LOGIN`, `REGISTER`, `LOGOUT`, `ENABLE_2FA`, `DISABLE_2FA`, `LOGIN_2FA`.
- **Admin Paneli:** Sadece Admin yetkisine sahip kullanıcılar `/admin/logs` sayfasından renkli etiketlerle ve sayfalandırma (pagination) ile logları inceleyebilir.

### 3. Hesap Kilitleme (Brute-Force Koruması) 🛡️

Kaba kuvvet saldırılarına karşı `users` tablosunda sayaç mekanizması kurulmuştur.

- **Mantık:** 
  - Her başarısız girişte `failed_login_attempts` artırılır.
  - 5. hatada `account_locked_until` o anın 15 dakika sonrasına ayarlanır.
  - Süre dolmadan giriş yapılamaz ve kullanıcıya kalan süre (dakika) gösterilir.
  - Başarılı girişte sayaçlar sıfırlanır.

### 4. Gelişmiş E-posta Şablonları 📧

Kullanıcı deneyimini artırmak için düz metin yerine HTML e-postalar tasarlanmıştır.

- **Teknoloji:** `nodemailer` ile HTML gövdesi gönderimi.
- **Kullanım:** Kayıt doğrulama (Verification) ve Şifre sıfırlama (Forgot Password) mailleri, markalı ve CTA butonlu şablonlar kullanır.

### 5. Şifre Gücü ve Validasyon ✅

- **Frontend:** Kullanıcı şifre girerken anlık olarak şifre gücünü (Zayıf, Orta, Güçlü) görsel bir bar ile görür.
- **Backend:** Şifrenin en az 8 karakter, büyük harf ve rakam içermesi zorunluluğu `yup` şemaları ve manuel kontrollerle sağlanır.

---

## 📂 Dosya Yapısı (İlgili Değişiklikler)

Bu özellikleri sağlamak için yapılan temel dosya değişiklikleri:

- `backend/migrations/`: Veritabanı şema güncellemeleri (2FA alanları, Log tablosu).
- `backend/src/controllers/auth.controller.js`: Login, 2FA ve Lockout mantığının kalbi.
- `backend/src/controllers/admin.controller.js`: Logları listeleme API'si.
- `frontend/src/pages/ProfilePage.jsx`: 2FA arayüzü ve kurulumu.
- `frontend/src/pages/AdminLogsPage.jsx`: Log görüntüleme tablosu.
- `frontend/src/context/AuthContext.jsx`: 2FA Login akış yönetimi.

---

*Smart Campus Projesi - 2025*
