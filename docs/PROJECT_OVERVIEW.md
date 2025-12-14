# Smart Campus - Project Overview

## 1. Proje Tanımı

**Smart Campus**, üniversite kampüs yaşamını dijitalleştirmeyi hedefleyen kapsamlı bir web platformudur.  
**Part 1 (Mevcut Aşama):** Güvenli kimlik doğrulama (Authentication), Rol tabanlı kullanıcı yönetimi (RBAC), ve Yönetici (Admin) paneli özelliklerini kapsar. Proje, modern güvenlik standartlarına (JWT, 2FA, Account Lockout) uygun olarak geliştirilmiştir.

### Öne Çıkan Özellikler (Part 1 & Bonuslar)

* **Gelişmiş Kimlik Doğrulama:** JWT tabanlı güvenli oturum yönetimi.
* **İki Aşamalı Doğrulama (2FA):** Google Authenticator entegrasyonu (TOTP). (Bonus)
* **Güvenlik Modülleri:** Hesabı kilitleme (Account Lockout), Rate Limiting. (Bonus)
* **Aktivite Loglama:** Kullanıcı hareketlerinin ve sistem hatalarının veritabanına kaydedilmesi. (Bonus)
* **Rol Yönetimi:** Admin, Öğrenci, Akademisyen rolleri.
* **Modern UI:** Responsive, kullanıcı dostu ve erişilebilir arayüz.

---

## 2. Teknoloji Stack'i

### Backend

* **Runtime:** Node.js (v20+)
* **Framework:** Express.js
* **Database:** PostgreSQL (v16)
* **ORM:** Sequelize
* **Authentication:** JSON Web Token (JWT), BCrypt, Speakeasy (2FA)

### Frontend

* **Framework:** React (Vite)
* **Styling:** Saf CSS3 (Grid/Flexbox, Custom Variables, Glassmorphism & Card Design)
* **State Management:** React Context API
* **Form Handling:** React Hook Form + Yup Validation
* **HTTP Client:** Axios

### DevOps & Infrastructure

* **Containerization:** Docker & Docker Compose
* **Cloud Provider:** Google Cloud Platform (GCP - Compute Engine)
* **Web Server:** Nginx (Reverse Proxy)

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

| Rol | Email | Şifre |
|---|---|---|
| **Öğrenci** | `student1@example.com` ... `student5@example.com` | `Password1` |
| **Akademisyen** | `faculty1@example.com`, `faculty2@example.com` | `Password1` |
| **Admin** | `admin@example.com` | `Password1` |

