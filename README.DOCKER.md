# Docker Setup Guide

Bu proje Docker ve Docker Compose kullanılarak containerize edilmiştir.

## Gereksinimler

- Docker (20.10 veya üzeri)
- Docker Compose (2.0 veya üzeri)

## Hızlı Başlangıç

### 1. Environment Dosyası Oluşturma

Backend için `.env` dosyası oluşturun:

```bash
cd backend
cp .env.example .env  # Eğer .env.example varsa
```

Veya manuel olarak `backend/.env` dosyası oluşturun:

```env
NODE_ENV=production
PORT=5000
DB_HOST=postgres
DB_NAME=campus_db
DB_USER=admin
DB_PASSWORD=campus123
JWT_SECRET=your-secret-key-here
JWT_EXPIRES_IN=24h
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password
```

### 2. Docker Compose ile Çalıştırma

Proje kök dizininde:

```bash
# Tüm servisleri başlat
docker-compose up -d

# Logları görüntüle
docker-compose logs -f

# Belirli bir servisin loglarını görüntüle
docker-compose logs -f backend
docker-compose logs -f frontend
docker-compose logs -f postgres
```

### 3. Servisleri Durdurma

```bash
# Servisleri durdur (veriler korunur)
docker-compose down

# Servisleri durdur ve volume'ları sil
docker-compose down -v
```

## Servisler

### Backend
- **Port:** 5000
- **Health Check:** http://localhost:5000/health
- **API:** http://localhost:5000/api/v1

### Frontend
- **Port:** 3000
- **URL:** http://localhost:3000

### PostgreSQL
- **Port:** 5432
- **Database:** campus_db
- **User:** admin
- **Password:** campus123

## Özellikler

### Otomatik Migration
Backend container başlatıldığında otomatik olarak database migration'ları çalıştırılır.

### Volume'lar
- `postgres_data`: PostgreSQL verileri kalıcı olarak saklanır
- `./backend/uploads`: Yüklenen dosyalar host makinede saklanır

### Network
Tüm servisler `campus_network` adlı bir bridge network'te çalışır.

## Geliştirme

### Sadece Backend'i Rebuild Etmek

```bash
docker-compose build backend
docker-compose up -d backend
```

### Sadece Frontend'i Rebuild Etmek

```bash
docker-compose build frontend
docker-compose up -d frontend
```

### Database'e Bağlanmak

```bash
docker-compose exec postgres psql -U admin -d campus_db
```

### Backend Container'ına Girmek

```bash
docker-compose exec backend sh
```

### Migration'ları Manuel Çalıştırmak

```bash
docker-compose exec backend npm run db:migrate
```

## Sorun Giderme

### Port Çakışması
Eğer portlar kullanılıyorsa, `docker-compose.yml` dosyasındaki port numaralarını değiştirebilirsiniz.

### Database Bağlantı Sorunları
- Backend container'ının PostgreSQL'e bağlanabilmesi için `DB_HOST=postgres` olmalıdır
- Container'lar aynı network'te olmalıdır (`campus_network`)

### Migration Hataları
Migration'lar otomatik çalışır. Hata durumunda logları kontrol edin:
```bash
docker-compose logs backend
```

## Production Deployment

Production ortamında:
1. `.env` dosyalarında güvenli şifreler kullanın
2. JWT_SECRET için güçlü bir değer seçin
3. HTTPS kullanın (reverse proxy ile)
4. Database backup stratejisi oluşturun

