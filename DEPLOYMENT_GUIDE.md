# Google Cloud VM Deployment Rehberi

## 1. Local DB'yi Canlıya Aktarma

### Adım 1: db_backup.sql dosyasını VM'e kopyala
```bash
# Windows'tan GCP VM'e kopyala (PowerShell)
scp -i "YOUR_SSH_KEY" db_backup.sql USERNAME@34.38.237.95:/home/USERNAME/smart-campus/

# Veya Google Cloud CLI ile
gcloud compute scp db_backup.sql INSTANCE_NAME:/home/USERNAME/smart-campus/ --zone=YOUR_ZONE
```

### Adım 2: VM'de veritabanını yükle
```bash
# SSH ile bağlan
ssh -i "YOUR_SSH_KEY" USERNAME@34.38.237.95

# Proje dizinine git
cd smart-campus

# Mevcut veritabanını temizle ve yeni veriyi yükle
docker exec -i smart_campus_postgres psql -U admin campus_db -c "DROP SCHEMA public CASCADE; CREATE SCHEMA public;"
docker exec -i smart_campus_postgres psql -U admin campus_db < db_backup.sql
```

## 2. Hata Düzeltmeleri

### Hata 1: 500 Internal Server Error (users/me, announcements)
Bu genellikle:
- Migration'lar çalıştırılmamış
- Environment değişkenleri eksik

**Çözüm:**
```bash
# VM'de migration'ları çalıştır
docker exec smart_campus_backend npx sequelize-cli db:migrate

# Backend loglarını kontrol et
docker logs smart_campus_backend --tail 100
```

### Hata 2: CORS veya API URL sorunu
Frontend'in REACT_APP_API_URL'i yanlış olabilir.

**Çözüm:**
```bash
# VM'de docker-compose.yml kontrol et
# FRONTEND_API_URL doğru external IP'yi içermeli

# .env dosyasını düzelt
export FRONTEND_API_URL=http://34.38.237.95:5000/api/v1

# Yeniden deploy et
docker-compose down
docker-compose up -d --build
```

### Hata 3: 401 Unauthorized (announcements)
Announcements endpoint authentication gerektiriyor ama login sayfasında çağrılıyor.

**Bu bir bug - düzeltilecek.**

## 3. VM'de Tam Deployment Süreci

```bash
# 1. Git pull (son değişiklikleri çek)
cd smart-campus
git pull origin main

# 2. Environment ayarla
export FRONTEND_API_URL=http://34.38.237.95:5000/api/v1
export DB_HOST=postgres
export DB_NAME=campus_db
export DB_USER=admin
export DB_PASSWORD=campus123

# 3. Docker compose ile deploy
docker-compose down
docker-compose up -d --build

# 4. Migration'ları çalıştır (eğer DB boşsa)
docker exec smart_campus_backend npx sequelize-cli db:migrate

# 5. Seed data'yı yükle (opsiyonel - eğer local dump kullanmıyorsan)
docker exec smart_campus_backend npx sequelize-cli db:seed:all

# 6. Servisleri kontrol et
docker ps
docker logs smart_campus_backend --tail 50
```

## 4. Sık Karşılaşılan Sorunlar

### Port açık değil
```bash
# GCP Firewall kuralı ekle
gcloud compute firewall-rules create allow-smart-campus \
  --allow tcp:3000,tcp:5000 \
  --source-ranges 0.0.0.0/0 \
  --description "Allow Smart Campus ports"
```

### Container başlamıyor
```bash
docker logs smart_campus_backend
docker logs smart_campus_postgres
```

### Disk dolu
```bash
docker system prune -a
```
