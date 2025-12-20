# Veritabanı Kontrol Scripti
Write-Host "Veritabani kontrol ediliyor..." -ForegroundColor Cyan
Write-Host ""

cd "C:\Program Files\PostgreSQL\17\bin"

Write-Host "1. Veritabani listesi:" -ForegroundColor Yellow
.\psql.exe -U postgres -c "\l" | Select-String "campus_db"

Write-Host ""
Write-Host "2. Tablo sayisi:" -ForegroundColor Yellow
.\psql.exe -U postgres -d campus_db -c "SELECT COUNT(*) as tablo_sayisi FROM information_schema.tables WHERE table_schema = 'public';"

Write-Host ""
Write-Host "3. Tablo listesi:" -ForegroundColor Yellow
.\psql.exe -U postgres -d campus_db -c "\dt"

Write-Host ""
Write-Host "4. Bazı tablolardaki kayit sayilari:" -ForegroundColor Yellow
.\psql.exe -U postgres -d campus_db -c "
SELECT 
    'users' as tablo, COUNT(*) as kayit_sayisi FROM users
UNION ALL
SELECT 'events', COUNT(*) FROM events
UNION ALL
SELECT 'event_registrations', COUNT(*) FROM event_registrations
UNION ALL
SELECT 'courses', COUNT(*) FROM courses
UNION ALL
SELECT 'students', COUNT(*) FROM students;
"

