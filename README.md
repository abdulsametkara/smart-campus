# Smart Campus Ecosystem Management Platform

Web ve Mobil Programlama Dersi Final Projesi - Part 1

## 🚀 Proje Hakkında
Bu proje, üniversite kampüs süreçlerini yöneten kapsamlı bir web platformudur. Part 1 kapsamında kimlik doğrulama, kullanıcı yönetimi ve temel altyapı tamamlanmıştır.

## 🛠️ Teknoloji Stack'i
- **Backend:** Node.js, Express, PostgreSQL, Sequelize, Docker
- **Frontend:** React, Context API, CSS Variables
- **DevOps:** Docker Compose

## 📦 Kurulum ve Çalıştırma

### Ön Gereksinimler
- Docker ve Docker Compose yüklü olmalıdır.
- Node.js (lokal geliştirme için opsiyonel)

### Adım Adım Çalıştırma

#### Opsiyon 1: Docker ile Tam Kurulum (Önerilen) 🐳

1. **Projeyi Klonlayın:**
   ```bash
   git clone <repo-url>
   cd smart-campus
   ```

2. **Tüm Servisleri Başlatın:**
   ```bash
   docker-compose up --build
   ```
   *Bu komut 3 servisi başlatır:*
   - PostgreSQL (port 5432)
   - Backend API (port 5000)
   - Frontend (port 3000)

3. **Veritabanı Hazırlığı (İlk Çalıştırma):**
   Yeni bir terminal açıp:
   ```bash
   # Migration (Tabloları oluştur)
   docker exec -it smart_campus_backend npx sequelize-cli db:migrate

   # Seed (Örnek verileri yükle)
   docker exec -it smart_campus_backend npx sequelize-cli db:seed:all
   ```

4. **Uygulamaya Erişin:**
   - **Frontend:** http://localhost:3000
   - **Backend API:** http://localhost:5000/api/v1
   - **PostgreSQL:** localhost:5432

#### Opsiyon 2: Lokal Geliştirme

**Backend:**
```bash
cd backend
npm install
npm run dev
```

**Frontend:**
```bash
cd frontend
npm install
npm start
```

## 🧪 Test Kullanıcıları (Seed Data)

| Rol | Email | Şifre |
|-----|-------|-------|
| **Öğrenci** | student1@example.com | Password1 |
| **Akademisyen** | faculty1@example.com | Password1 |
| **Admin** | admin@example.com | Password1 |

## 📚 Dokümantasyon
Detaylı proje dokümanlarına aşağıdaki dosyalardan ulaşabilirsiniz:

- [Proje Genel Bakış](PROJECT_OVERVIEW.md)
- [API Dokümantasyonu](API_DOCUMENTATION.md)
- [Veritabanı Şeması](DATABASE_SCHEMA.md)
- [Kullanıcı Kılavuzu](USER_MANUAL_PART1.md) (**Ekran görüntüleri buraya eklenecek**)
- [Test Raporu](TEST_REPORT_PART1.md)

## ✅ Testleri Çalıştırma

**Backend Testleri:**
```bash
cd backend
npm test
```
