# Smart Campus Ecosystem Management Platform

## 1. Proje Tanımı
Smart Campus Ecosystem Management Platform, üniversite kampüs süreçlerini dijitalleştiren, öğrenci, akademisyen ve idari personel arasındaki etkileşimi optimize eden kapsamlı bir web uygulamasıdır. Bu proje, modern web teknolojileri kullanılarak, ölçeklenebilir, güvenli ve kullanıcı dostu bir kampüs yönetim sistemi sunmayı amaçlamaktadır.

**Part 1 Kapsamı:**
- Kimlik Doğrulama ve Yetkilendirme (JWT, Role-based Access Control)
- Kullanıcı Yönetimi (Profil, Fotoğraf, Şifre işlemleri)
- Temel Veritabanı Yapısı ve Yönetimi

## 2. Teknoloji Stack'i

### Backend
- **Runtime:** Node.js
- **Framework:** Express.js
- **Database:** PostgreSQL 14
- **ORM:** Sequelize
- **Authentication:** JWT (JSON Web Token) & bcrypt
- **Validation:** Joi
- **File Upload:** Multer
- **Email Service:** Nodemailer

### Frontend
- **Library:** React.js 18
- **Routing:** React Router DOM v6
- **State Management:** Context API (AuthContext)
- **Form Handling:** React Hook Form & Yup
- **HTTP Client:** Axios
- **Styling:** Custom CSS (CSS Variables, Flexbox/Grid)

### DevOps & Tools
- **Containerization:** Docker & Docker Compose
- **Version Control:** Git & GitHub
- **API Testing:** Postman / Jest

## 3. Klasör Yapısı

### Backend
```
backend/
├── src/
│   ├── config/         # Veritabanı ve konfigürasyon dosyaları
│   ├── controllers/    # İş mantığı ve request handler'lar
│   ├── middleware/     # Auth, upload ve validation ara katmanları
│   ├── models/         # Sequelize modelleri
│   ├── routes/         # API endpoint tanımları
│   ├── utils/          # Yardımcı fonksiyonlar (email, hash vb.)
│   ├── validators/     # Joi şemaları
│   └── app.js          # Express uygulama girişi
├── seeders/            # Örnek veri seed dosyaları
├── tests/              # Birim ve entegrasyon testleri
└── uploads/            # Yüklenen dosyalar
```

### Frontend
```
frontend/
├── public/
├── src/
│   ├── components/     # Tekrar kullanılabilir bileşenler
│   ├── context/        # Global state (AuthContext)
│   ├── pages/          # Sayfa bileşenleri
│   ├── services/       # API servisleri
│   ├── App.js          # Ana uygulama bileşeni ve routing
│   └── App.css         # Global stiller
```

## 4. Grup Üyeleri
- **[Ad Soyad]** - [Öğrenci No] - [Rol/Görev]
- **[Ad Soyad]** - [Öğrenci No] - [Rol/Görev]
- **[Ad Soyad]** - [Öğrenci No] - [Rol/Görev]
