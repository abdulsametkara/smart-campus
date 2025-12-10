@echo off
cd /d "%~dp0"
setlocal

echo ===================================================
echo   SMART CAMPUS - TAKIM ARKADASI BASLANGIC SCRIPTI
echo ===================================================
echo.

:: 0. GIT BRANCH AYARLARI
echo [1/5] Calisma ortami (Branch) hazirlaniyor...
set /p USER_NAME="Lutfen adinizi girin (Github Branch ismi olacak, ornek: ahmet): "

if "%USER_NAME%"=="" (
    echo Isim girmediniz! 'dev' branch'i varsayilan olarak kullanilacak.
    set USER_NAME=dev
)

echo.
echo '%USER_NAME%' branch'i icin kontroller yapiliyor...
:: Once main'i guncelle
git checkout main >nul 2>&1
git pull origin main >nul 2>&1

:: Yeni branch olusturmayi dene, hata verirse (zaten varsa) sadece gecis yap
git checkout -b %USER_NAME% 2>nul
if %errorlevel% neq 0 (
    echo Branch zaten mevcut, '%USER_NAME%' dalina geciliyor...
    git checkout %USER_NAME%
)

echo.
echo BASARILI: Su an '%USER_NAME%' branch'indesiniz.
echo ---------------------------------------------------

:: 1. BACKEND ENV DOSYASINI OLUSTUR (E-Posta Ayarlari Dahil)
echo [2/5] Backend ayarlari yapiliyor (.env olusturuluyor)...
(
echo PORT=5000
echo NODE_ENV=development
echo.
echo # Database ^(Local Docker^)
echo DB_HOST=postgres
echo DB_USER=admin
echo DB_PASSWORD=campus123
echo DB_NAME=campus_db
echo.
echo # JWT Secrets ^(Local Development^)
echo JWT_ACCESS_TOKEN_SECRET=dev-access-secret-123
echo JWT_REFRESH_TOKEN_SECRET=dev-refresh-secret-123
echo JWT_EMAIL_VERIFICATION_SECRET=dev-email-secret
echo JWT_PASSWORD_RESET_SECRET=dev-reset-secret
echo.
echo # Email Configuration ^(Otomatik Ayarlandi^)
echo EMAIL_HOST=smtp.gmail.com
echo EMAIL_PORT=587
echo EMAIL_USER=abdulsamedkara7@gmail.com
echo EMAIL_PASS=mhwojrposeprpoqz
echo EMAIL_FROM=abdulsamedkara7@gmail.com
echo.
echo # Frontend URL
echo FRONTEND_URL=http://localhost:3000
) > backend\.env

:: 2. FRONTEND ENV DOSYASINI OLUSTUR
echo [3/5] Frontend ayarlari yapiliyor...
(
echo REACT_APP_API_URL=http://localhost:5000/api/v1
) > frontend\.env

:: 3. DOCKER ISLEMLERI
echo [4/5] Docker servisleri baslatiliyor (Biraz zaman alabilir)...
echo Eski servisler durduruluyor...
docker-compose down

echo Yeni servisler insa ediliyor...
docker-compose up -d --build

:: 4. VERITABANI KURULUMU
echo [5/5] Veritabani hazirlaniyor (Migrate & Seed)...
echo Veritabaninin acilmasi icin 15 saniye bekleniyor...
timeout /t 15 /nobreak >nul

echo Tablolar olusturuluyor (Migration)...
docker-compose exec -T backend npx sequelize-cli db:migrate

echo Ornek veriler ekleniyor (Seed)...
docker-compose exec -T backend npx sequelize-cli db:seed:all

echo.
echo ===================================================
echo   KURULUM TAMAMLANDI!
echo ===================================================
echo.
echo UI Adresi : http://localhost:3000
echo API Adresi: http://localhost:5000
echo.
echo Varsayilan Giris Bilgileri:
echo Admin    : admin@example.com / Password1
echo Ogrenci  : student1@example.com / Password1
echo.
pause
