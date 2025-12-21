# pg_hba.conf dosyasını bulma scripti
Write-Host "pg_hba.conf dosyasi araniyor..." -ForegroundColor Cyan
Write-Host ""

# Olası konumlar
$possiblePaths = @(
    "C:\Program Files\PostgreSQL\17\data\pg_hba.conf",
    "C:\Program Files\PostgreSQL\18\data\pg_hba.conf",
    "C:\Program Files (x86)\PostgreSQL\17\data\pg_hba.conf",
    "C:\Program Files (x86)\PostgreSQL\18\data\pg_hba.conf"
)

$found = $false
foreach ($path in $possiblePaths) {
    if (Test-Path $path) {
        Write-Host "BULUNDU! Dosya konumu:" -ForegroundColor Green
        Write-Host $path -ForegroundColor Yellow
        Write-Host ""
        Write-Host "Dosyayi acmak icin:" -ForegroundColor Cyan
        Write-Host "notepad `"$path`"" -ForegroundColor White
        $found = $true
        break
    }
}

if (-not $found) {
    Write-Host "Standart konumlarda bulunamadi. Tum PostgreSQL data klasorlerini ariyorum..." -ForegroundColor Yellow
    Write-Host ""
    
    # Tüm PostgreSQL klasörlerini ara
    $pgDirs = Get-ChildItem "C:\Program Files" -Directory -ErrorAction SilentlyContinue | Where-Object {$_.Name -like "*PostgreSQL*"}
    $pgDirs += Get-ChildItem "C:\Program Files (x86)" -Directory -ErrorAction SilentlyContinue | Where-Object {$_.Name -like "*PostgreSQL*"}
    
    foreach ($dir in $pgDirs) {
        $dataPath = Join-Path $dir.FullName "data\pg_hba.conf"
        if (Test-Path $dataPath) {
            Write-Host "BULUNDU! Dosya konumu:" -ForegroundColor Green
            Write-Host $dataPath -ForegroundColor Yellow
            Write-Host ""
            Write-Host "Dosyayi acmak icin:" -ForegroundColor Cyan
            Write-Host "notepad `"$dataPath`"" -ForegroundColor White
            $found = $true
        }
    }
}

if (-not $found) {
    Write-Host "HATA: pg_hba.conf dosyasi bulunamadi!" -ForegroundColor Red
    Write-Host ""
    Write-Host "Manuel olarak bulmak icin:" -ForegroundColor Yellow
    Write-Host "1. File Explorer'i acin"
    Write-Host "2. C:\Program Files\PostgreSQL klasorune gidin"
    Write-Host "3. Surum klasorunu bulun (17, 18, vb.)"
    Write-Host "4. data klasorune gidin"
    Write-Host "5. pg_hba.conf dosyasini bulun"
}

