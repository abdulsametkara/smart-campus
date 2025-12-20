# PostgreSQL Şifre Sıfırlama Rehberi

## 🔐 Sorun: Şifre Doğrulaması Başarısız

pgAdmin'de "postgres" kullanıcısı için şifre hatası alıyorsunuz. İşte çözüm yolları:

---

## ✅ Çözüm 1: Şifreyi Sıfırlama (ÖNERİLEN)

### Adım 1: PostgreSQL Servisini Durdurun

**PowerShell'i Yönetici Olarak Açın:**
1. Windows tuşuna basın
2. "PowerShell" yazın
3. **Windows PowerShell**'e sağ tıklayın
4. **Run as administrator** seçin

**Servisi Durdurun:**
```powershell
Stop-Service postgresql-x64-18
```
(18 yerine sürümünüz neyse onu yazın: 17, 16, vb.)

### Adım 2: Şifre Dosyasını Oluşturun/Düzenleyin

**pg_hba.conf dosyasını bulun:**
```powershell
# Genellikle bu konumda:
cd "C:\Program Files\PostgreSQL\18\data"
```

**pg_hba.conf dosyasını düzenleyin:**
1. Dosyaya sağ tıklayın → **Properties** → **Security** → **Advanced**
2. **Owner**'ı değiştirin (kendiniz olun)
3. **Full control** verin
4. Notepad++ veya Notepad ile açın (yönetici olarak)

**Şu satırı bulun:**
```
host    all             all             127.0.0.1/32            scram-sha-256
```

**Şununla değiştirin (geçici olarak):**
```
host    all             all             127.0.0.1/32            trust
```

**Kaydedin ve kapatın.**

### Adım 3: PostgreSQL Servisini Başlatın

```powershell
Start-Service postgresql-x64-18
```

### Adım 4: Şifreyi Sıfırlayın

```powershell
cd "C:\Program Files\PostgreSQL\18\bin"
.\psql.exe -U postgres -d postgres
```

**Şifre sormayacak. Şimdi şifreyi değiştirin:**
```sql
ALTER USER postgres WITH PASSWORD 'yeni_sifreniz_buraya';
\q
```

### Adım 5: Güvenliği Geri Yükleyin

**pg_hba.conf dosyasını tekrar açın ve:**
```
host    all             all             127.0.0.1/32            trust
```
**Şununla değiştirin:**
```
host    all             all             127.0.0.1/32            scram-sha-256
```

**Servisi yeniden başlatın:**
```powershell
Restart-Service postgresql-x64-18
```

---

## ✅ Çözüm 2: Windows Servis Kullanıcısı ile Bağlanma

PostgreSQL Windows servis kullanıcısı olarak çalışıyorsa, o kullanıcı ile bağlanabilirsiniz:

```powershell
cd "C:\Program Files\PostgreSQL\18\bin"
.\psql.exe -U postgres -d postgres
```

Eğer şifre sorarsa, Windows kullanıcı şifrenizi deneyin.

---

## ✅ Çözüm 3: pgAdmin'de Yeni Bağlantı Oluşturma

1. pgAdmin'de **Servers**'a sağ tıklayın
2. **Create** > **Server** seçin
3. **General** sekmesinde:
   - **Name**: `PostgreSQL 18 (New)` (veya istediğiniz isim)
4. **Connection** sekmesinde:
   - **Host**: `localhost`
   - **Port**: `5432`
   - **Maintenance database**: `postgres`
   - **Username**: `postgres`
   - **Password**: (Boş bırakın veya yeni şifreyi girin)
5. **Save** butonuna tıklayın

---

## ✅ Çözüm 4: Şifreyi Unuttuysanız - En Hızlı Yol

### Tek Komutla Şifre Sıfırlama (Windows Servis Kullanıcısı ile):

```powershell
# PowerShell'i Yönetici olarak açın
cd "C:\Program Files\PostgreSQL\18\bin"

# Servisi durdurun
Stop-Service postgresql-x64-18

# Şifre dosyasını geçici olarak trust yapın (yukarıdaki adımları takip edin)
# Sonra servisi başlatın
Start-Service postgresql-x64-18

# Şifreyi sıfırlayın
.\psql.exe -U postgres -c "ALTER USER postgres WITH PASSWORD 'yeni_sifre_123';"
```

---

## 🎯 Hızlı Çözüm: pgAdmin'de Şifreyi Kaydetme

Eğer şifreyi biliyorsanız ama sürekli soruyorsa:

1. pgAdmin'de bağlantıya sağ tıklayın
2. **Properties** seçin
3. **Connection** sekmesine gidin
4. Şifreyi girin
5. **Save Password** kutusunu işaretleyin
6. **Save** butonuna tıklayın

---

## ⚠️ Önemli Notlar

1. **Güvenlik**: `trust` modunu sadece şifre sıfırlama için kullanın, sonra geri alın!
2. **Yedek**: Şifre sıfırlamadan önce önemli verileriniz varsa yedek alın
3. **Servis Adı**: `postgresql-x64-18` yerine kendi servis adınızı bulun:
   ```powershell
   Get-Service | Where-Object {$_.Name -like "*postgres*"}
   ```

---

## 🔍 Servis Adını Bulma

Hangi PostgreSQL servisinin çalıştığını bulmak için:

```powershell
Get-Service | Where-Object {$_.Name -like "*postgres*"}
```

Çıktıya göre servis adını kullanın (örn: `postgresql-x64-17`, `postgresql-x64-18`)

---

## 📝 Özet: En Hızlı Yol

1. **PowerShell'i Yönetici olarak açın**
2. **PostgreSQL servisini durdurun**
3. **pg_hba.conf'u trust moduna alın**
4. **Servisi başlatın**
5. **Şifreyi sıfırlayın**
6. **pg_hba.conf'u geri alın**
7. **Servisi yeniden başlatın**
8. **pgAdmin'de yeni şifre ile bağlanın**

Başarılar! 🚀

