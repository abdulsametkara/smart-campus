#!/bin/bash

# Smart Campus Database Backup Script
# Bu script PostgreSQL veritabanının backup'ını alır

# Konfigürasyon
BACKUP_DIR=~/smart-campus-backups
CONTAINER_NAME=smart_campus_postgres
DB_NAME=campus_db
DB_USER=admin
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="$BACKUP_DIR/campus_db_$DATE.sql"

# Renk kodları
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${GREEN}================================${NC}"
echo -e "${GREEN}Smart Campus Database Backup${NC}"
echo -e "${GREEN}================================${NC}"
echo ""

# Backup dizini yoksa oluştur
if [ ! -d "$BACKUP_DIR" ]; then
    echo -e "${YELLOW}Backup dizini oluşturuluyor: $BACKUP_DIR${NC}"
    mkdir -p "$BACKUP_DIR"
fi

# Container'ın çalışıp çalışmadığını kontrol et
if ! docker ps | grep -q $CONTAINER_NAME; then
    echo -e "${RED}HATA: $CONTAINER_NAME container'ı çalışmıyor!${NC}"
    exit 1
fi

# Backup al
echo -e "${YELLOW}Backup alınıyor...${NC}"
if docker exec $CONTAINER_NAME pg_dump -U $DB_USER $DB_NAME > "$BACKUP_FILE"; then
    # Backup boyutunu hesapla
    BACKUP_SIZE=$(du -h "$BACKUP_FILE" | cut -f1)
    echo -e "${GREEN}✓ Backup başarılı!${NC}"
    echo -e "Dosya: $BACKUP_FILE"
    echo -e "Boyut: $BACKUP_SIZE"
else
    echo -e "${RED}✗ Backup başarısız!${NC}"
    exit 1
fi

# 7 günden eski backup'ları sil
echo ""
echo -e "${YELLOW}Eski backup'lar temizleniyor (7 günden eski)...${NC}"
DELETED_COUNT=$(find $BACKUP_DIR -name "campus_db_*.sql" -mtime +7 -delete -print | wc -l)
echo -e "${GREEN}✓ $DELETED_COUNT eski backup silindi${NC}"

# Backup listesini göster
echo ""
echo -e "${GREEN}Mevcut Backup'lar:${NC}"
ls -lh $BACKUP_DIR/campus_db_*.sql 2>/dev/null | tail -5

echo ""
echo -e "${GREEN}================================${NC}"
echo -e "${GREEN}Backup tamamlandı!${NC}"
echo -e "${GREEN}================================${NC}"
