@echo off
setlocal
chcp 65001 >nul
title Smart Campus Kurulum Sihirbazi

echo ========================================================
echo      🚀 SMART CAMPUS - OTOMATİK KURULUM SİHİRBAZI
echo ========================================================
echo.
echo Bu script projenizi takim calismasina uygun hale getirecek,
echo veritabanini sifirlayacak ve gerekli verileri yukleyecektir.
echo.

:ASK_NAME
set /p "DEV_NAME=Lutfen adinizi girin (kucuk harflerle, ornek: ahmet): "
if "%DEV_NAME%"=="" goto ASK_NAME

echo.
echo --------------------------------------------------------
echo [1/7] Git Branch Ayarlaniyor: '%DEV_NAME%'
echo --------------------------------------------------------
REM Branch varsa gec, yoksa olusturup gec
git checkout %DEV_NAME% 2>nul || git checkout -b %DEV_NAME%
if %errorlevel% neq 0 (
    echo [HATA] Git islemi basarisiz oldu. Lutfen git'in kurulu oldugundan emin olun.
    pause
    exit /b 1
)

echo.
echo --------------------------------------------------------
echo [2/7] Docker Kontrol Ediliyor...
echo --------------------------------------------------------
docker --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [HATA] Docker bulunamadi veya calismiyor!
    echo Lutfen Docker Desktop'i acip tekrar deneyin.
    pause
    exit /b 1
)
echo Docker aktif.

echo.
echo --------------------------------------------------------
echo [3/7] Eski Kurulum Temizleniyor...
echo --------------------------------------------------------
echo Veritabani ve container'lar siliniyor...
docker-compose down -v

echo.
echo --------------------------------------------------------
echo [4/7] Servisler Kuruluyor (Bu islem biraz surebilir)...
echo --------------------------------------------------------
docker-compose up --build -d
if %errorlevel% neq 0 (
    echo [HATA] Docker build islemi basarisiz oldu.
    pause
    exit /b 1
)

echo.
echo --------------------------------------------------------
echo [5/7] Backend Servisinin Acilmasi Bekleniyor...
echo --------------------------------------------------------
echo Backend hazirlaniyor, lutfen bekleyin (30 saniye)...
timeout /t 30 /nobreak >nul

echo.
echo --------------------------------------------------------
echo [6/7] Veritabani Hazirlaniyor...
echo --------------------------------------------------------

echo 1. Tablolar olusturuluyor (Migration)...
call docker exec smart_campus_backend npx sequelize-cli db:migrate
if %errorlevel% neq 0 (
    echo [HATA] Migration islemi basarisiz oldu!
    echo Lutfen backend loglarini kontrol edin: docker logs smart_campus_backend
    pause
    exit /b 1
)

echo.
echo 2. Ornek veriler yukleniyor (Seeding)...
call docker exec smart_campus_backend npx sequelize-cli db:seed:all
if %errorlevel% neq 0 (
    echo [HATA] Seed islemi basarisiz oldu!
    pause
    exit /b 1
)

echo.
echo ========================================================
echo              ✅ KURULUM BASARIYLA TAMAMLANDI!
echo ========================================================
echo.
echo Uygulamaniz su an calisiyor:
echo 🌍 Frontend: http://localhost:3000
echo ⚙️ Backend:  http://localhost:5000/api/v1
echo.
echo Giris Bilgileri:
echo Admin:     admin@example.com    / Password1
echo Ogrenci:   student1@example.com / Password1
echo Akademisyen: faculty1@example.com / Password1
echo.
echo Pencereyi kapatabilirsiniz.
pause
