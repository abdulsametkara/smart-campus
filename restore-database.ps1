# PostgreSQL Veritabanı Restore Scripti
# Kullanım: .\restore-database.ps1

Write-Host "=== PostgreSQL Veritabanı Restore ===" -ForegroundColor Cyan
Write-Host ""

# PostgreSQL kullanıcı adı ve şifresini al
$pgUser = Read-Host "PostgreSQL kullanici adi (varsayilan: postgres)"
if ([string]::IsNullOrWhiteSpace($pgUser)) {
    $pgUser = "postgres"
}

$pgPassword = Read-Host "PostgreSQL sifresi" -AsSecureString
$BSTR = [System.Runtime.InteropServices.Marshal]::SecureStringToBSTR($pgPassword)
$plainPassword = [System.Runtime.InteropServices.Marshal]::PtrToStringAuto($BSTR)

# Dump dosyası yolunu al
$dumpFile = Read-Host "Dump dosyasi yolu (varsayilan: C:\Users\fatma\Desktop\dump2.sql)"
if ([string]::IsNullOrWhiteSpace($dumpFile)) {
    $dumpFile = "C:\Users\fatma\Desktop\dump2.sql"
}

# Dosyanın varlığını kontrol et
if (-not (Test-Path $dumpFile)) {
    Write-Host "HATA: Dump dosyasi bulunamadi: $dumpFile" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "Veritabani siliniyor (varsa)..." -ForegroundColor Yellow
$env:PGPASSWORD = $plainPassword
dropdb -U $pgUser campus_db 2>&1 | Out-Null

Write-Host "Yeni veritabani olusturuluyor..." -ForegroundColor Yellow
createdb -U $pgUser campus_db
if ($LASTEXITCODE -ne 0) {
    Write-Host "HATA: Veritabani olusturulamadi!" -ForegroundColor Red
    exit 1
}

Write-Host "Dump dosyasi yukleniyor (bu islem biraz zaman alabilir)..." -ForegroundColor Yellow
psql -U $pgUser -d campus_db -f $dumpFile

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "Veritabani basariyla yuklendi!" -ForegroundColor Green
} else {
    Write-Host ""
    Write-Host "HATA: Dump yuklenirken bir sorun olustu!" -ForegroundColor Red
}

# Sifreyi temizle
$env:PGPASSWORD = $null

