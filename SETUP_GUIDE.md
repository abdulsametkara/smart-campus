# 🚀 Takım İçi Kurulum Rehberi (Smart Campus)

Tüm geliştiri ortamını tek tıkla kurmak için aşağıdaki adımları izleyin.

---

### 🟢 1. Adım: Kodu İndirin
Projeyi kendi bilgisayarınıza çekin (eğer çekmediyseniz):

```bash
git clone <repo-url>
cd smart-campus
```

### 🟡 2. Adım: Kurulumu Başlatın
Proje ana dizinindeki **`setup.bat`** dosyasına **çift tıklayın**.

Siyah bir pencere açılacak ve size şunu soracaktır:
> "Lutfen adinizi girin:"

Adınızı (veya kullanmak istediğiniz branch adını) yazıp **Enter**'a basın.

### 🏁 3. Adım: Arkanıza Yaslanın
Script otomatik olarak şunları yapacaktır:
1. Sizin adınıza bir **Git Branch** oluşturacak.
2. Docker'ı temizleyip sıfırdan kuracak.
3. Veritabanını oluşturup örnek verileri (CENG Bölümü, Öğrenciler, vb.) yükleyecektir.

"KURULUM BAŞARIYLA TAMAMLANDI" yazısını gördüğünüzde işlem bitmiştir!

---

### 🌍 Giriş Bilgileri
Uygulama: **http://localhost:3000**

| Rol | Email | Şifre |
|-----|-------|-------|
| 🎓 **Öğrenci** | student1@example.com | `Password1` |
| 👨‍🏫 **Akademisyen** | faculty1@example.com | `Password1` |
| 🛡️ **Admin** | admin@example.com | `Password1` |

---

#### 🆘 Manuel Kurulum (Sadece setup.bat çalışmazsa)

Eğer script hata verirse şu komutları sırasıyla terminalde çalıştırabilirsiniz:

```bash
# 1. Branch oluştur
git checkout -b <adin>

# 2. Temizle ve Başlat
docker-compose down -v
docker-compose up --build -d

# 3. Veritabanını Kur (Backend hazır olunca)
docker exec smart_campus_backend npx sequelize-cli db:migrate
docker exec smart_campus_backend npx sequelize-cli db:seed:all
```
