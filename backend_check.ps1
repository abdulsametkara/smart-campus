# Backend Durum Kontrolü
Write-Host "Backend durumu kontrol ediliyor..." -ForegroundColor Cyan
Write-Host ""

# Port 5000'i kontrol et
$port = Get-NetTCPConnection -LocalPort 5000 -ErrorAction SilentlyContinue

if ($port) {
    Write-Host "✓ Port 5000 dinleniyor" -ForegroundColor Green
    Write-Host "  State: $($port.State)" -ForegroundColor White
    Write-Host "  Process: $($port.OwningProcess)" -ForegroundColor White
} else {
    Write-Host "✗ Port 5000 dinlenmiyor!" -ForegroundColor Red
    Write-Host ""
    Write-Host "Backend çalışmıyor. Başlatmak için:" -ForegroundColor Yellow
    Write-Host "cd C:\Users\fatma\Desktop\smart-campus\backend" -ForegroundColor White
    Write-Host "npm start" -ForegroundColor White
}

Write-Host ""
Write-Host "HTTP isteği test ediliyor..." -ForegroundColor Cyan
try {
    $response = Invoke-WebRequest -Uri "http://localhost:5000/health" -Method GET -TimeoutSec 5 -ErrorAction Stop
    Write-Host "✓ Backend yanıt veriyor!" -ForegroundColor Green
    Write-Host "  Status: $($response.StatusCode)" -ForegroundColor White
    Write-Host "  Content: $($response.Content)" -ForegroundColor White
}
catch {
    Write-Host "✗ Backend yanıt vermiyor!" -ForegroundColor Red
    Write-Host "  Hata: $($_.Exception.Message)" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Backend'i başlatın:" -ForegroundColor Yellow
    Write-Host "cd C:\Users\fatma\Desktop\smart-campus\backend" -ForegroundColor White
    Write-Host "npm start" -ForegroundColor White
}

