#!/bin/bash

# Smart Campus System Monitor
# Sistem ve Docker container durumlarını gösterir

# Renk kodları
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

clear
echo -e "${BLUE}╔════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║     Smart Campus - System Monitor                 ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════╝${NC}"
echo ""

# 1. Sistem Kaynakları
echo -e "${GREEN}📊 Sistem Kaynakları${NC}"
echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

# CPU ve Memory
echo -e "${BLUE}CPU ve Memory:${NC}"
top -bn1 | grep "Cpu(s)" | sed "s/.*, *\([0-9.]*\)%* id.*/\1/" | awk '{print "CPU Kullanımı: " 100 - $1 "%"}'
free -h | awk 'NR==2{printf "Memory Kullanımı: %s / %s (%.2f%%)\n", $3,$2,$3*100/$2 }'

# Disk
echo ""
echo -e "${BLUE}Disk Kullanımı:${NC}"
df -h / | awk 'NR==2{printf "%s / %s (%.2f%%)\n", $3,$2,$5}'

echo ""

# 2. Docker Container Durumları
echo -e "${GREEN}🐳 Docker Container Durumları${NC}"
echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

# Container'ları listele
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}" 2>/dev/null || echo -e "${RED}Docker çalışmıyor!${NC}"

echo ""

# 3. Container Kaynakları
echo -e "${GREEN}💻 Container Kaynak Kullanımı${NC}"
echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
docker stats --no-stream --format "table {{.Name}}\t{{.CPUPerc}}\t{{.MemUsage}}\t{{.NetIO}}" 2>/dev/null

echo ""

# 4. Log Özeti (Son 10 satır, hata varsa)
echo -e "${GREEN}📋 Son Loglar (Hatalar)${NC}"
echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

# Backend hataları
BACKEND_ERRORS=$(docker logs --since 1h smart_campus_backend 2>&1 | grep -i "error" | tail -3)
if [ ! -z "$BACKEND_ERRORS" ]; then
    echo -e "${RED}Backend Hataları:${NC}"
    echo "$BACKEND_ERRORS"
else
    echo -e "${GREEN}✓ Backend'de son 1 saatte hata yok${NC}"
fi

# Frontend hataları
FRONTEND_ERRORS=$(docker logs --since 1h smart_campus_frontend 2>&1 | grep -i "error" | tail -3)
if [ ! -z "$FRONTEND_ERRORS" ]; then
    echo -e "${RED}Frontend Hataları:${NC}"
    echo "$FRONTEND_ERRORS"
fi

echo ""

# 5. Network Durumu
echo -e "${GREEN}🌐 Servis Durumları${NC}"
echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

# Backend health check
BACKEND_STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:5000/health 2>/dev/null)
if [ "$BACKEND_STATUS" = "200" ]; then
    echo -e "${GREEN}✓ Backend API: Çalışıyor (http://localhost:5000)${NC}"
else
    echo -e "${RED}✗ Backend API: Yanıt vermiyor${NC}"
fi

# Frontend check
FRONTEND_STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000 2>/dev/null)
if [ "$FRONTEND_STATUS" = "200" ]; then
    echo -e "${GREEN}✓ Frontend: Çalışıyor (http://localhost:3000)${NC}"
else
    echo -e "${RED}✗ Frontend: Yanıt vermiyor${NC}"
fi

# Database check
DB_STATUS=$(docker exec smart_campus_postgres pg_isready -U admin 2>/dev/null)
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ PostgreSQL: Çalışıyor${NC}"
else
    echo -e "${RED}✗ PostgreSQL: Yanıt vermiyor${NC}"
fi

echo ""

# 6. Son Backup Bilgisi
echo -e "${GREEN}💾 Backup Durumu${NC}"
echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

BACKUP_DIR=~/smart-campus-backups
if [ -d "$BACKUP_DIR" ]; then
    LAST_BACKUP=$(ls -t $BACKUP_DIR/campus_db_*.sql 2>/dev/null | head -1)
    if [ ! -z "$LAST_BACKUP" ]; then
        BACKUP_DATE=$(stat -c %y "$LAST_BACKUP" 2>/dev/null || stat -f %Sm "$LAST_BACKUP" 2>/dev/null)
        BACKUP_SIZE=$(du -h "$LAST_BACKUP" | cut -f1)
        echo -e "${GREEN}Son Backup: $(basename $LAST_BACKUP)${NC}"
        echo -e "Tarih: $BACKUP_DATE"
        echo -e "Boyut: $BACKUP_SIZE"
    else
        echo -e "${YELLOW}Henüz backup alınmamış${NC}"
    fi
else
    echo -e "${YELLOW}Backup dizini bulunamadı${NC}"
fi

echo ""
echo -e "${BLUE}╔════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║  Güncelleme için: watch -n 5 ./scripts/monitor.sh  ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════╝${NC}"
