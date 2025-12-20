# pgAdmin Düzeltme Scripti
Write-Host "pgAdmin düzeltme işlemi başlatılıyor..." -ForegroundColor Cyan
Write-Host ""

# 1. pgAdmin servisini kontrol et
Write-Host "1. pgAdmin servisleri kontrol ediliyor..." -ForegroundColor Yellow
$pgAdminServices = Get-Service | Where-Object {$_.Name -like "*pgadmin*"}
if ($pgAdminServices) {
    Write-Host "   Bulunan servisler:" -ForegroundColor Green
    $pgAdminServices | ForEach-Object { Write-Host "   - $($_.Name): $($_.Status)" }
} else {
    Write-Host "   pgAdmin servisi bulunamadı (normal, desktop app)" -ForegroundColor Yellow
}

# 2. Python path kontrolü
Write-Host ""
Write-Host "2. Python path kontrol ediliyor..." -ForegroundColor Yellow
$pythonPath = "C:\Program Files\PostgreSQL\18\pgAdmin 4\python\python.exe"
if (Test-Path $pythonPath) {
    Write-Host "   Python bulundu: $pythonPath" -ForegroundColor Green
} else {
    Write-Host "   HATA: Python bulunamadı!" -ForegroundColor Red
}

# 3. Config dosyası kontrolü
Write-Host ""
Write-Host "3. Config dosyası kontrol ediliyor..." -ForegroundColor Yellow
$configPath = "$env:APPDATA\pgadmin4\config.json"
if (Test-Path $configPath) {
    Write-Host "   Config bulundu: $configPath" -ForegroundColor Green
    Write-Host "   Config dosyasını silmeyi deneyebilirsiniz (yeniden oluşturulacak)" -ForegroundColor Yellow
} else {
    Write-Host "   Config dosyası yok (normal, ilk çalıştırmada oluşturulur)" -ForegroundColor Yellow
}

# 4. Çözüm önerileri
Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "ÇÖZÜM ÖNERİLERİ:" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Yöntem 1: pgAdmin'i yeniden başlatın" -ForegroundColor Yellow
Write-Host "   - Tüm pgAdmin pencerelerini kapatın"
Write-Host "   - Görev Yöneticisi'nde pgAdmin process'lerini sonlandırın"
Write-Host "   - pgAdmin'i tekrar açın"
Write-Host ""
Write-Host "Yöntem 2: Config dosyasını sıfırlayın" -ForegroundColor Yellow
Write-Host "   Remove-Item `"$env:APPDATA\pgadmin4\config.json`" -ErrorAction SilentlyContinue"
Write-Host "   (pgAdmin tekrar açıldığında yeniden oluşturulacak)"
Write-Host ""
Write-Host "Yöntem 3: pgAdmin'i yeniden kurun" -ForegroundColor Yellow
Write-Host "   - Control Panel > Programs > PostgreSQL 18 > Uninstall"
Write-Host "   - Sadece pgAdmin 4'ü kaldırın (PostgreSQL sunucusunu değil!)"
Write-Host "   - PostgreSQL 18 kurulumunu tekrar çalıştırın ve sadece pgAdmin 4'ü kurun"
Write-Host ""
Write-Host "Yöntem 4: PowerShell ile dump yükleyin (pgAdmin olmadan)" -ForegroundColor Yellow
Write-Host "   cd `"C:\Program Files\PostgreSQL\17\bin`""
Write-Host "   .\psql.exe -U postgres -d campus_db -f `"C:\Users\fatma\Desktop\dump2.sql`""
Write-Host ""

