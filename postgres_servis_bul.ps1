# PostgreSQL Servis Adını Bulma Scripti
Write-Host "PostgreSQL servisleri araniyor..." -ForegroundColor Cyan
Write-Host ""

# Tüm PostgreSQL servislerini bul
$services = Get-Service | Where-Object {$_.Name -like "*postgres*"}

if ($services.Count -eq 0) {
    Write-Host "HATA: PostgreSQL servisi bulunamadi!" -ForegroundColor Red
    Write-Host ""
    Write-Host "Alternatif: Tum servisleri listeleyelim..." -ForegroundColor Yellow
    Get-Service | Where-Object {$_.DisplayName -like "*postgres*" -or $_.DisplayName -like "*PostgreSQL*"}
} else {
    Write-Host "BULUNDU! PostgreSQL servisleri:" -ForegroundColor Green
    Write-Host ""
    foreach ($service in $services) {
        Write-Host "Servis Adi: $($service.Name)" -ForegroundColor Yellow
        Write-Host "Gorunen Ad: $($service.DisplayName)" -ForegroundColor White
        Write-Host "Durum: $($service.Status)" -ForegroundColor $(if ($service.Status -eq 'Running') { 'Green' } else { 'Red' })
        Write-Host "---"
    }
    Write-Host ""
    Write-Host "Kullanmak icin:" -ForegroundColor Cyan
    Write-Host "Stop-Service $($services[0].Name)" -ForegroundColor Yellow
}

