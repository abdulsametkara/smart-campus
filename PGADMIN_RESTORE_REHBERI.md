# pgAdmin ile Veritabanı Restore Rehberi

## Adım Adım Talimatlar

### 1. pgAdmin'i Açın
- Windows Başlat menüsünden "pgAdmin 4" uygulamasını açın
- Şifrenizi girerek giriş yapın

### 2. Mevcut Veritabanını Silin (Varsa)
- Sol menüde **Servers** > **PostgreSQL 18** > **Databases** altında
- **campus_db** veritabanına sağ tıklayın
- **Delete/Drop** seçeneğine tıklayın
- Onaylayın

### 3. Yeni Veritabanı Oluşturun
- **Databases** klasörüne sağ tıklayın
- **Create** > **Database** seçeneğine tıklayın
- **General** sekmesinde:
  - **Database**: `campus_db`
- **Save** butonuna tıklayın

### 4. Dump Dosyasını Yükleyin
- Oluşturduğunuz **campus_db** veritabanına sağ tıklayın
- **Restore...** seçeneğine tıklayın
- **Filename** kısmına tıklayın ve dosya seçiciyi açın
- `C:\Users\fatma\Desktop\dump2.sql` dosyasını seçin
- **Restore** butonuna tıklayın
- İşlem tamamlanana kadar bekleyin (birkaç dakika sürebilir)

### 5. Kontrol Edin
- **campus_db** veritabanını genişletin
- **Schemas** > **public** > **Tables** altında tabloları görebilmelisiniz

## Notlar
- Eğer restore sırasında hata alırsanız, PostgreSQL 18.1 ile PostgreSQL 14.20 dump'ı arasında uyumsuzluk olabilir
- Bu durumda dump dosyasını düzenleyip uyumlu hale getirmek gerekebilir

