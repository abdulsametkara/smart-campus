# PostgreSQL Veritabanı Yükleme Rehberi

## 🎯 Seçenek 1: pgAdmin ile (ÖNERİLEN - En Kolay)

### Adım 1: pgAdmin'i Açın
- Windows Başlat menüsünden **pgAdmin 4** uygulamasını açın
- PostgreSQL şifrenizi girerek giriş yapın

### Adım 2: Mevcut Veritabanını Silin (Varsa)
1. Sol menüde **Servers** > **PostgreSQL 18** (veya sürümünüz) > **Databases** klasörünü genişletin
2. **campus_db** veritabanına sağ tıklayın
3. **Delete/Drop** seçeneğine tıklayın
4. Onay penceresinde **Yes** butonuna tıklayın

### Adım 3: Yeni Veritabanı Oluşturun
1. **Databases** klasörüne sağ tıklayın
2. **Create** > **Database** seçeneğine tıklayın
3. **General** sekmesinde:
   - **Database**: `campus_db` yazın
4. **Save** butonuna tıklayın

### Adım 4: Dump Dosyasını Yükleyin
1. Oluşturduğunuz **campus_db** veritabanına sağ tıklayın
2. **Restore...** seçeneğine tıklayın
3. **Filename** kısmına tıklayın (üç nokta butonu)
4. Dosya seçici penceresinde:
   - `C:\Users\fatma\Desktop\dump2.sql` dosyasını seçin
   - **Select** butonuna tıklayın
5. **Restore** butonuna tıklayın
6. İşlem tamamlanana kadar bekleyin (birkaç dakika sürebilir)
7. Başarılı mesajını görünce **Close** butonuna tıklayın

### Adım 5: Kontrol Edin
1. **campus_db** veritabanını genişletin
2. **Schemas** > **public** > **Tables** altında tabloları görebilmelisiniz
3. Tablolardan birine sağ tıklayıp **View/Edit Data** > **First 100 Rows** ile verileri kontrol edebilirsiniz

---

## 💻 Seçenek 2: Komut Satırı ile (Terminal/PowerShell)

### ÖNEMLİ: Şifre Sorunu Çözümü

PostgreSQL şifrenizi bilmiyorsanız veya şifre soruyorsa:

#### Windows'ta Şifre Sorununu Çözmek:

1. **pgAdmin'den şifrenizi kontrol edin** veya
2. **PostgreSQL servisini durdurup şifresiz başlatın** (sadece test için)

### Adım 1: PowerShell'i Yönetici Olarak Açın
- Windows tuşuna basın
- "PowerShell" yazın
- **Windows PowerShell**'e sağ tıklayın
- **Run as administrator** seçin

### Adım 2: PostgreSQL Bin Klasörüne Gidin
```powershell
cd "C:\Program Files\PostgreSQL\18\bin"
```

### Adım 3: Veritabanını Silin (Varsa)
```powershell
.\dropdb.exe -U postgres campus_db
```
Şifre isterse PostgreSQL şifrenizi girin.

### Adım 4: Yeni Veritabanı Oluşturun
```powershell
.\createdb.exe -U postgres campus_db
```

### Adım 5: Dump Dosyasını Yükleyin
```powershell
.\psql.exe -U postgres -d campus_db -f "C:\Users\fatma\Desktop\dump2.sql"
```

**Not:** Şifre sorarsa, PostgreSQL kurulum sırasında belirlediğiniz şifreyi girin.

---

## 🔧 Alternatif: Şifre Sorununu Çözmek İçin

Eğer sürekli şifre soruyorsa, şifreyi environment variable olarak ayarlayabilirsiniz:

### PowerShell'de:
```powershell
$env:PGPASSWORD='postgres_sifreniz_buraya'
.\psql.exe -U postgres -d campus_db -f "C:\Users\fatma\Desktop\dump2.sql"
```

---

## ⚠️ Hata Durumları ve Çözümleri

### Hata: "password authentication failed"
**Çözüm:** PostgreSQL şifrenizi kontrol edin veya pgAdmin kullanın.

### Hata: "database does not exist"
**Çözüm:** Önce `createdb` komutuyla veritabanını oluşturun.

### Hata: "permission denied"
**Çözüm:** PowerShell'i yönetici olarak çalıştırın.

### Hata: "connection refused"
**Çözüm:** PostgreSQL servisinin çalıştığından emin olun:
```powershell
Get-Service postgresql*
```

---

## ✅ Başarı Kontrolü

Veritabanının başarıyla yüklendiğini kontrol etmek için:

```powershell
.\psql.exe -U postgres -d campus_db -c "\dt"
```

Bu komut tüm tabloları listeler. Tablolar görünüyorsa başarılı!

---

## 📝 Özet: En Kolay Yol

1. **pgAdmin'i açın**
2. **campus_db'yi silin** (varsa)
3. **campus_db'yi oluşturun**
4. **Restore Tool'u açın**
5. **dump2.sql dosyasını seçin**
6. **Restore'a tıklayın**
7. **Bekleyin ve tamamlanınca kontrol edin**

**pgAdmin kullanmak en kolay ve en güvenli yöntemdir!** 🎉

