# Smart Campus Project 🚀
> **Status:** ✅ Fully Dockerized | ✅ CI/CD Active | ✅ Production Ready

Web ve Mobil Programlama Dersi Final Projesi - Part 1

## 🚀 Proje Hakkında
Bu proje, üniversite kampüs süreçlerini yöneten kapsamlı bir web platformudur.  
**Part 1** kapsamında; güvenli kimlik doğrulama (2FA, Lockout), rol tabanlı kullanıcı yönetimi ve yönetim paneli özellikleri **Docker** konteyner mimarisi üzerinde tamamlanmıştır.

---

## 📚 Dokümantasyon
Tüm detaylı proje dokümanlarına `docs/` klasöründen ulaşabilirsiniz:

- 📖 **[Proje Genel Bakış ve Mimari](docs/PROJECT_OVERVIEW.md)**
- 🔌 **[API Dokümantasyonu (Endpoints)](docs/API_DOCUMENTATION.md)**
- 🗄️ **[Veritabanı Şeması (ER Diyagramı)](docs/DATABASE_SCHEMA.md)**
- 👤 **[Kullanıcı Kılavuzu](docs/USER_MANUAL_PART1.md)**
- 🧪 **[Test Raporu](docs/TEST_REPORT_PART1.md)**

---

## 🏆 Öne Çıkan Özellikler & Bonuslar
Projede temel gereksinimlerin ötesinde aşağıdaki **Bonus** özellikler geliştirilmiştir:
- ✅ **İki Aşamalı Doğrulama (2FA):** Google Authenticator ile güvenli giriş.
- ✅ **Hesap Güvenliği:** 5 hatalı girişte hesap kilitleme (Account Lockout).
- ✅ **Aktivite Logları:** Kullanıcı hareketlerinin (Login, Logout, Update) izlenmesi.
- ✅ **Rate Limiting:** Brute-force saldırılarına karşı koruma.
- ✅ **Admin Paneli:** Logları ve kullanıcıları detaylı yönetme imkanı.
- ✅ **Modern UI:** Tailwind benzeri custom CSS utility sınıfları ve şık kart tasarımları.

---

## 🛠️ Hızlı Başlangıç (Docker)

### 1. Projeyi İndirin
```bash
git clone <repo-url>
cd smart-campus
```

### 2. Ayarları Yapın
Backend dizinindeki `.env.example` dosyasını `.env` olarak kopyalayın.
```bash
cd backend
cp .env.example .env
# .env içindeki ayarları (Veritabanı şifresi vb.) düzenleyin
cd ..
```

### 3. Başlatın
Docker Compose ile tüm sistemi (Frontend + Backend + DB) ayağa kaldırın.
```bash
docker compose up -d --build
```

### 4. Veritabanını Hazırlayın
Tabloları oluşturmak için backend konteynerinde migrasyon çalıştırın:
```bash
docker compose exec backend npm run db:migrate
```

### 5. Erişim
- **Web Arayüzü:** [http://34.38.237.95:3000](http://34.38.237.95:3000)
- **API:** [http://34.38.237.95:5000](http://34.38.237.95:5000)

---

## 🧪 Varsayılan Kullanıcılar (Seed Data)

| Rol | Email | Şifre |
|-----|-------|-------|
| **Öğrenci** | `student1@example.com` | `Password1` |
| **Akademisyen** | `faculty1@example.com` | `Password1` |
| **Admin** | `admin@example.com` | `Password1` |

---

## 🤝 Lisans & İletişim
Bu proje eğitim amaçlı geliştirilmiştir.
**Grup Üyeleri:** (Bkz: [docs/PROJECT_OVERVIEW.md](docs/PROJECT_OVERVIEW.md))
