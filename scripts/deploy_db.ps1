# Deploy Database Dump to Live VM
param(
    [Parameter(Mandatory=$false)]
    [string]$VmIp,
    
    [Parameter(Mandatory=$false)]
    [string]$VmUser = "root"
)

# 0. Configuration
$DumpFile = "..\dump.sql"
$RemotePath = "/tmp/dump.sql"
$ContainerName = "smart_campus_postgres"
$DbUser = "admin"
$DbName = "campus_db"

# 1. Prompt for specific IP if not provided
if ([string]::IsNullOrWhiteSpace($VmIp)) {
    $VmIp = Read-Host "Lütfen VM IP adresini giriniz (Örn: 35.22.11.44)"
}

if ([string]::IsNullOrWhiteSpace($VmIp)) {
    Write-Error "IP adresi gereklidir."
    exit 1
}

Write-Host "🚀 Veritabanı dağıtımı başlatılıyor... Hedef: $VmUser@$VmIp" -ForegroundColor Cyan

# Check if dump file exists
if (-not (Test-Path $DumpFile)) {
    Write-Error "HATA: dump.sql dosyası bulunamadı! Lütfen önce dump oluşturun."
    exit 1
}

# 2. Upload Dump File (SCP)
Write-Host "📦 1/3: Dump dosyası yükleniyor (scp)..." -ForegroundColor Yellow
try {
    scp $DumpFile "${VmUser}@${VmIp}:${RemotePath}"
    if ($LASTEXITCODE -ne 0) { throw "SCP failed" }
    Write-Host "✅ Dosya yüklendi." -ForegroundColor Green
}
catch {
    Write-Error "HATA: Dosya yüklenemedi. SSH bağlantısını kontrol edin."
    exit 1
}

# 3. Restore Database (SSH + Docker Exec)
Write-Host "📥 2/3: Veritabanı restore ediliyor..." -ForegroundColor Yellow
$RestoreCmd = "cat $RemotePath | docker exec -i $ContainerName psql -U $DbUser -d $DbName"

try {
    # We use Invoke-Expression or direct ssh calls. 
    # Note: Using -t might fail with pipes in some shells, but standard usage is fine.
    ssh "${VmUser}@${VmIp}" $RestoreCmd
    if ($LASTEXITCODE -ne 0) { throw "SSH restoration command failed" }
    Write-Host "✅ Veritabanı başarıyla güncellendi." -ForegroundColor Green
}
catch {
    Write-Error "HATA: Restore işlemi sırasında hata oluştu."
    exit 1
}

# 4. Cleanup
Write-Host "🧹 3/3: Geçici dosyalar temizleniyor..." -ForegroundColor Yellow
ssh "${VmUser}@${VmIp}" "rm $RemotePath"

Write-Host "🎉 İŞLEM TAMAMLANDI! Canlı sistem artık güncel." -ForegroundColor Green
