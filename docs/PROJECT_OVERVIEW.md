# Smart Campus - Proje Özeti

## 1. Proje Tanımı

**Smart Campus**, üniversite kampüs yaşamını dijitalleştirmeyi hedefleyen kapsamlı bir web platformudur.  
**Part 1 (Tamamlandı):** Güvenli kimlik doğrulama (Authentication), Rol tabanlı kullanıcı yönetimi (RBAC), ve Yönetici (Admin) paneli özelliklerini kapsar. Proje, modern güvenlik standartlarına (JWT, 2FA, Account Lockout) uygun olarak geliştirilmiştir.
**Part 2 (Tamamlandı):** Akademik süreçler (Dersler, Bölümler), GPS ve QR tabanlı Yoklama Sistemi, Not Sistemi, Transkript oluşturma ve Gerçek zamanlı özellikler (WebSocket Dashboard).

### Öne Çıkan Özellikler

#### Temel Özellikler
* **Gelişmiş Kimlik Doğrulama:** JWT tabanlı güvenli oturum yönetimi.
* **Rol Yönetimi:** Admin, Öğrenci, Akademisyen rolleri.
* **Akademik Yönetim:** Ders açma, bölüm yönetimi, ders kayıt (Enrollment) süreçleri.
* **Yoklama Sistemi:** GPS tabanlı konum doğrulama (Geofencing).
* **Not Sistemi:** Sınav oluşturma ve not girişi.
* **Resmi Belgeler:** PDF Transkript oluşturma.

#### Bonus Özellikler (+Part 1 & Part 2)
* **Real-time Dashboard (WebSocket):** Anlık yoklama takibi. (+5 Puan)
* **QR Code Alternative:** Kamera ile QR okuyarak yoklama. (+5 Puan)
* **Advanced Spoofing Detection:** GPS hilesi ve imkansız hız tespiti. (+3 Puan)
* **Attendance Analytics:** Haftalık katılım analizleri ve grafikler. (+2 Puan)
* **İki Aşamalı Doğrulama (2FA):** Google Authenticator entegrasyonu.
* **Güvenlik Modülleri:** Hesabı kilitleme (Account Lockout), Rate Limiting.
* **Aktivite Loglama:** Kullanıcı hareketlerinin kaydedilmesi.

---

## 2. Kullanılan Teknolojiler

### Backend

* **Runtime:** Node.js (v20+)
* **Framework:** Express.js
* **Veritabanı:** PostgreSQL (v16)
* **ORM:** Sequelize
* **Kimlik Doğrulama:** JSON Web Token (JWT), BCrypt, Speakeasy (2FA)

### Frontend

* **Framework:** React (Vite)
* **Stil:** Saf CSS3 (Grid/Flexbox, Custom Variables, Glassmorphism & Card Design)
* **State Yönetimi:** React Context API
* **Form Yönetimi:** React Hook Form + Yup Validation
* **HTTP İstemcisi:** Axios

### DevOps & Altyapı

* **Konteynerleştirme:** Docker & Docker Compose
* **Bulut Sağlayıcı:** Google Cloud Platform (GCP - Compute Engine)
* **Web Sunucusu:** Nginx (Reverse Proxy)

---

## 3. Proje Yapısı

```
smart-campus/
├── backend/                # Node.js API Sunucusu
│   ├── src/
│   │   ├── config/         # Veritabanı ve ortam ayarları
│   │   ├── controllers/    # İş mantığı (Auth, User, Admin)
│   │   ├── middleware/     # Auth, Upload, Validation katmanları
│   │   ├── models/         # Sequelize modelleri (User, Log, 2FA)
│   │   └── routes/         # API Endpoint tanımları
│   ├── migrations/         # Veritabanı şema değişiklikleri
│   └── Dockerfile
├── frontend/               # React Web Uygulaması
│   ├── src/
│   │   ├── components/     # Tekrar kullanılabilir bileşenler
│   │   ├── context/        # Global state (AuthContext)
│   │   ├── pages/          # Sayfa görünümleri (Login, Profile, Admin)
│   │   └── services/       # API iletişimi (Axios instance)
│   └── Dockerfile
├── docs/                   # Proje Dokümantasyonu
└── docker-compose.yml      # Konteyner orkestrasyon dosyası
```

---

## 4. Grup Üyeleri ve Görev Dağılımı

| Öğrenci No | Ad Soyad           | Rol        | Sorumluluklar                                          |
| ---------- | ------------------ | ---------- | ------------------------------------------------------ |
| 211401065  | Abdul Samed Kara   | Full Stack | Backend Mimarisi, Docker Setup, 2FA Entegrasyonu       |
| 211401049  | Fatma Ciran Akbaş  | Frontend   | UI Tasarımı, Form Validasyonları, React Componentleri  |
| 211401064  | Hayrunnisa Kasımay | Backend    | Veritabanı Tasarımı, Loglama Sistemi, API Endpointleri |
| 221401030  | Ömer Şahan Sofu    | Tester/Doc | Test Senaryoları, Dokümantasyon, Bug Raporlama         |

*(Not: Görev dağılımı proje sürecinde dinamik olarak yönetilmiştir.)*

---

## 5. Test Verileri (Seed Data)

Proje veritabanı, testlerin kolay yapılması için aşağıdaki varsayılan kullanıcılarla doldurulmuştur:

| Rol             | Email                                             | Şifre       |
| --------------- | ------------------------------------------------- | ----------- |
| **Öğrenci**     | `student1@example.com` ... `student5@example.com` | `Password1` |
| **Akademisyen** | `faculty1@example.com`, `faculty2@example.com`    | `Password1` |
| **Admin**       | `admin@example.com`                               | `Password1` |
