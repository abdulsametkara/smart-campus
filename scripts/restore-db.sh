#!/bin/bash

# Smart Campus Database Restore Script
# Bu script PostgreSQL veritabanını backup'tan geri yükler

# Renk kodları
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${GREEN}================================${NC}"
echo -e "${GREEN}Smart Campus Database Restore${NC}"
echo -e "${GREEN}================================${NC}"
echo ""

# Backup dosyasını parametre olarak al
if [ -z "$1" ]; then
    echo -e "${YELLOW}Kullanım: $0 <backup_dosyası.sql>${NC}"
    echo ""
    echo -e "${YELLOW}Mevcut backup dosyaları:${NC}"
    ls -lh ~/smart-campus-backups/campus_db_*.sql 2>/dev/null
    exit 1
fi

BACKUP_FILE="$1"
CONTAINER_NAME=smart_campus_postgres
DB_NAME=campus_db
DB_USER=admin

# Backup dosyasının varlığını kontrol et
if [ ! -f "$BACKUP_FILE" ]; then
    echo -e "${RED}HATA: Backup dosyası bulunamadı: $BACKUP_FILE${NC}"
    exit 1
fi

# Container'ın çalışıp çalışmadığını kontrol et
if ! docker ps | grep -q $CONTAINER_NAME; then
    echo -e "${RED}HATA: $CONTAINER_NAME container'ı çalışmıyor!${NC}"
    exit 1
fi

# Kullanıcıdan onay al
echo -e "${RED}UYARI: Bu işlem mevcut veritabanını silinecek!${NC}"
echo -e "${YELLOW}Restore edilecek dosya: $BACKUP_FILE${NC}"
echo ""
read -p "Devam etmek istiyor musunuz? (yes/no): " CONFIRM

if [ "$CONFIRM" != "yes" ]; then
    echo -e "${YELLOW}İşlem iptal edildi.${NC}"
    exit 0
fi

# Önce veritabanını temizle
echo ""
echo -e "${YELLOW}Mevcut veritabanı temizleniyor...${NC}"
docker exec $CONTAINER_NAME psql -U $DB_USER -d $DB_NAME -c "DROP SCHEMA public CASCADE;"
docker exec $CONTAINER_NAME psql -U $DB_USER -d $DB_NAME -c "CREATE SCHEMA public;"

# Restore et
echo -e "${YELLOW}Veritabanı restore ediliyor...${NC}"
if cat "$BACKUP_FILE" | docker exec -i $CONTAINER_NAME psql -U $DB_USER -d $DB_NAME; then
    echo -e "${GREEN}✓ Restore başarılı!${NC}"
else
    echo -e "${RED}✗ Restore başarısız!${NC}"
    exit 1
fi

echo ""
echo -e "${GREEN}================================${NC}"
echo -e "${GREEN}Restore tamamlandı!${NC}"
echo -e "${GREEN}================================${NC}"
