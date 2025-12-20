# PostgreSQL Servisini Başlatma Scripti
Write-Host "PostgreSQL servisi kontrol ediliyor..." -ForegroundColor Cyan
Write-Host ""

# Servis adını bul
$service = Get-Service | Where-Object {$_.Name -like "*postgres*"} | Select-Object -First 1

if ($service) {
    Write-Host "Bulunan servis: $($service.Name)" -ForegroundColor Green
    Write-Host "Mevcut durum: $($service.Status)" -ForegroundColor $(if ($service.Status -eq 'Running') { 'Green' } else { 'Yellow' })
    Write-Host ""
    
    if ($service.Status -ne 'Running') {
        Write-Host "Servis başlatılıyor..." -ForegroundColor Yellow
        try {
            Start-Service $service.Name
            Write-Host "✓ Servis başarıyla başlatıldı!" -ForegroundColor Green
            Write-Host ""
            Write-Host "Şimdi psql komutlarını çalıştırabilirsiniz:" -ForegroundColor Cyan
            Write-Host "cd `"C:\Program Files\PostgreSQL\17\bin`"" -ForegroundColor White
            Write-Host ".\psql.exe -U postgres -c `"CREATE DATABASE campus_db;`"" -ForegroundColor White
        } catch {
            Write-Host "✗ HATA: Servis başlatılamadı!" -ForegroundColor Red
            Write-Host "Hata: $($_.Exception.Message)" -ForegroundColor Red
            Write-Host ""
            Write-Host "Yönetici olarak çalıştırmayı deneyin:" -ForegroundColor Yellow
            Write-Host "1. PowerShell'i kapatın"
            Write-Host "2. PowerShell'e sağ tıklayın"
            Write-Host "3. 'Run as administrator' seçin"
            Write-Host "4. Bu scripti tekrar çalıştırın"
        }
    } else {
        Write-Host "✓ Servis zaten çalışıyor!" -ForegroundColor Green
        Write-Host ""
        Write-Host "Bağlantı sorunu başka bir nedenden kaynaklanıyor olabilir." -ForegroundColor Yellow
        Write-Host "Port kontrolü yapılıyor..." -ForegroundColor Cyan
        
        # Port kontrolü
        $port = Get-NetTCPConnection -LocalPort 5432 -ErrorAction SilentlyContinue
        if ($port) {
            Write-Host "✓ Port 5432 dinleniyor" -ForegroundColor Green
        } else {
            Write-Host "✗ Port 5432 dinlenmiyor" -ForegroundColor Red
        }
    }
} else {
    Write-Host "✗ PostgreSQL servisi bulunamadı!" -ForegroundColor Red
    Write-Host ""
    Write-Host "Tüm servisler listeleniyor..." -ForegroundColor Yellow
    Get-Service | Where-Object {$_.DisplayName -like "*postgres*" -or $_.DisplayName -like "*PostgreSQL*"}
}

