# Smart Campus Project 🚀
> **Status:** ✅ Fully Dockerized | ✅ CI/CD Active

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

2. **Environment Dosyasını Oluşturun:**
   ```bash
   # Backend için
   cd backend
   cp .env.example .env
   # .env dosyasını düzenleyip gerekli ayarları yapın
   cd ..
   ```

3. **Tüm Servisleri Başlatın:**
   ```bash
   docker-compose up --build
   ```
   *Bu komut 3 servisi başlatır:*
   - PostgreSQL (port 5432)
   - Backend API (port 5000)
   - Frontend (port 3000)

4. **Veritabanı Hazırlığı (İlk Çalıştırma):**
   Yeni bir terminal açıp:
   ```bash
   # Migration (Tabloları oluştur)
   docker exec -it smart_campus_backend npx sequelize-cli db:migrate

   # Seed (Örnek verileri yükle)
   docker exec -it smart_campus_backend npx sequelize-cli db:seed:all
   ```

5. **Uygulamaya Erişin:**
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

## 🌐 Production Deployment

Projeyi canlıya almak için detaylı rehber:

**Hızlı Başlangıç:** [DEPLOYMENT.md](DEPLOYMENT.md)  
**Detaylı Rehber:** [.agent/workflows/deploy-to-gcp.md](.agent/workflows/deploy-to-gcp.md)

### Google Cloud Platform'a Deploy

```bash
# VM'e bağlanın ve projeyi klonlayın
git clone <repo-url>
cd smart-campus

# Environment ayarlarını yapın
cd backend
cp .env.example .env
nano .env  # Gerekli değişiklikleri yapın
cd ..

# .env.production dosyasını düzenleyin
nano .env.production  # API URL'i VM IP ile güncelleyin

# Servisleri başlatın
source .env.production
docker compose build
docker compose up -d
```

### Utility Scripts

Deployment ve yönetim için hazır scriptler:

```bash
# Database backup
./scripts/backup-db.sh

# Database restore
./scripts/restore-db.sh backup_dosyasi.sql

# Sistem monitoring
./scripts/monitor.sh

# Watch mode ile monitoring (her 5 saniyede güncelle)
watch -n 5 ./scripts/monitor.sh
```

**Not:** Linux/macOS'da scriptleri çalıştırmadan önce executable yapın:
```bash
chmod +x scripts/*.sh
```

## 📚 Dokümantasyon

Detaylı proje dokümanlarına aşağıdaki dosyalardan ulaşabilirsiniz:

- [Proje Genel Bakış](PROJECT_OVERVIEW.md)
- [API Dokümantasyonu](API_DOCUMENTATION.md)
- [Veritabanı Şeması](DATABASE_SCHEMA.md)
- [Kullanıcı Kılavuzu](USER_MANUAL_PART1.md)
- [Test Raporu](TEST_REPORT_PART1.md)
- [Deployment Rehberi](DEPLOYMENT.md) 🆕

## ✅ Testleri Çalıştırma

**Backend Testleri:**
```bash
cd backend
npm test
```

## 🔧 Sık Kullanılan Komutlar

### Docker Komutları

```bash
# Servisleri başlat
docker compose up -d

# Servisleri durdur
docker compose down

# Logları izle
docker compose logs -f

# Belirli bir servisin loglarını izle
docker compose logs -f backend

# Container durumlarını kontrol et
docker compose ps

# Container'a gir
docker exec -it smart_campus_backend sh

# Database'e bağlan
docker exec -it smart_campus_postgres psql -U admin -d campus_db
```

### Bakım Komutları

```bash
# Güncelleme yap
git pull
docker compose build
docker compose up -d

# Docker temizliği (kullanılmayan image'ları sil)
docker system prune -a

# Veritabanı backup al
docker exec smart_campus_postgres pg_dump -U admin campus_db > backup.sql

# Veritabanı restore et
cat backup.sql | docker exec -i smart_campus_postgres psql -U admin -d campus_db
```

## 📊 Proje Durumu

- ✅ Part 1 Tamamlandı
  - Authentication & Authorization
  - User Management
  - Profile & Upload
  - Docker Integration
  - Production Ready

- 🏆 **Bonus Özellikler (10/10 Puan) Tamamlandı**
  - [x] İki Aşamalı Doğrulama (2FA) (+3)
  - [x] Kullanıcı Aktivite Logları (+2)
  - [x] Hesap Kilitleme & Güvenlik (+2)
  - [x] E-posta Şablonları (+2)
  - [x] Gelişmiş Validasyon (+1)

👉 **Detaylı bonus raporu için:** [Bonus Özellikler & Puanlar](BONUS_FEATURES.md)

## 🔐 Güvenlik Notları

**Production ortamında mutlaka değiştirin:**
- `backend/.env` dosyasındaki `JWT_SECRET`
- `backend/.env` dosyasındaki `JWT_REFRESH_SECRET`
- `docker-compose.yml` ve `.env` dosyalarındaki `POSTGRES_PASSWORD`
- Email servis credentials

**Güvenli secret oluşturmak için:**
```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

## 🤝 Katkıda Bulunma

1. Fork edin
2. Feature branch oluşturun (`git checkout -b feature/amazing-feature`)
3. Değişikliklerinizi commit edin (`git commit -m 'Add amazing feature'`)
4. Branch'inizi push edin (`git push origin feature/amazing-feature`)
5. Pull Request açın

## 📝 Lisans

Bu proje eğitim amaçlı geliştirilmiştir.


---

**Geliştirme:** 2025  
**Versiyon:** 1.0.0 (Part 1)

