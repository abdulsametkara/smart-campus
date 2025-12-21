# Backend Durum Kontrolü (Basit)
Write-Host "Backend durumu kontrol ediliyor..." -ForegroundColor Cyan
Write-Host ""

# Port 5000'i kontrol et
$port = Get-NetTCPConnection -LocalPort 5000 -ErrorAction SilentlyContinue

if ($port) {
    Write-Host "✓ Port 5000 dinleniyor" -ForegroundColor Green
} else {
    Write-Host "✗ Port 5000 dinlenmiyor!" -ForegroundColor Red
    Write-Host ""
    Write-Host "Backend çalışmıyor. Başlatmak için:" -ForegroundColor Yellow
    Write-Host "cd C:\Users\fatma\Desktop\smart-campus\backend" -ForegroundColor White
    Write-Host "npm start" -ForegroundColor White
    exit
}

Write-Host ""
Write-Host "HTTP isteği test ediliyor..." -ForegroundColor Cyan
$response = Invoke-WebRequest -Uri "http://localhost:5000/health" -Method GET -TimeoutSec 5 -ErrorAction SilentlyContinue

if ($response) {
    Write-Host "✓ Backend yanıt veriyor!" -ForegroundColor Green
    Write-Host "  Status: $($response.StatusCode)" -ForegroundColor White
} else {
    Write-Host "✗ Backend yanıt vermiyor!" -ForegroundColor Red
    Write-Host ""
    Write-Host "Backend'i yeniden başlatın:" -ForegroundColor Yellow
    Write-Host "cd C:\Users\fatma\Desktop\smart-campus\backend" -ForegroundColor White
    Write-Host "npm start" -ForegroundColor White
}

