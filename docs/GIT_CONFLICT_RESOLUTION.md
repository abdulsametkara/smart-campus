# Git Merge Conflict Çözüm Rehberi

## 🔍 Mevcut Durum

**Unmerged Paths (Conflict'ler):**

### 1. "added by them" - Dokümantasyon Dosyaları
Bu dosyalar başka bir branch'te eklenmiş, sizin branch'inizde yok:
- `BACKEND_ACADEMIC_REVIEW.md`
- `COMPLETION_STATUS_ACADEMIC.md`
- `COURSE_SECTIONS_REQUIREMENTS.md`
- `DATABASE_CHANGES_SUMMARY.md`
- `HOW_TO_ADD_SECTIONS.md`
- `MIGRATION_SUMMARY.md`
- `MISSING_FEATURES_ACADEMIC.md`
- `PART2_PREPARATION_CHECKLIST.md`
- `SCHEDULE_CONFLICT_STATUS.md`
- `TEST_GUIDE.md`

**Çözüm:** Bu dosyaları kabul edin (keep them)

### 2. "deleted by us" - Backend Dosyaları
Bu dosyalar sizin branch'inizde silinmiş ama başka branch'te var:
- `backend/seeders/20251213142000-part2-seed.js`
- `backend/src/controllers/academic.controller.js`
- `backend/src/routes/academic.routes.js`
- `backend/src/services/prerequisite.service.js`
- `backend/src/services/scheduleConflict.service.js`

**Çözüm:** Bu dosyaları geri getirin (keep them)

### 3. "both modified" - Her İki Branch'te Değiştirilmiş
- `frontend/package-lock.json`
- `frontend/src/App.js`
- `frontend/src/pages/DashboardPage.jsx`

**Çözüm:** Manuel olarak merge edin veya bir versiyonu seçin

---

## ✅ ÇÖZÜM ADIMLARI

### Adım 1: "added by them" Dosyalarını Kabul Et

```bash
git add BACKEND_ACADEMIC_REVIEW.md
git add COMPLETION_STATUS_ACADEMIC.md
git add COURSE_SECTIONS_REQUIREMENTS.md
git add DATABASE_CHANGES_SUMMARY.md
git add HOW_TO_ADD_SECTIONS.md
git add MIGRATION_SUMMARY.md
git add MISSING_FEATURES_ACADEMIC.md
git add PART2_PREPARATION_CHECKLIST.md
git add SCHEDULE_CONFLICT_STATUS.md
git add TEST_GUIDE.md
```

**VEYA hepsini birden:**
```bash
git add BACKEND_ACADEMIC_REVIEW.md COMPLETION_STATUS_ACADEMIC.md COURSE_SECTIONS_REQUIREMENTS.md DATABASE_CHANGES_SUMMARY.md HOW_TO_ADD_SECTIONS.md MIGRATION_SUMMARY.md MISSING_FEATURES_ACADEMIC.md PART2_PREPARATION_CHECKLIST.md SCHEDULE_CONFLICT_STATUS.md TEST_GUIDE.md
```

### Adım 2: "deleted by us" Dosyalarını Geri Getir

```bash
git add backend/seeders/20251213142000-part2-seed.js
git add backend/src/controllers/academic.controller.js
git add backend/src/routes/academic.routes.js
git add backend/src/services/prerequisite.service.js
git add backend/src/services/scheduleConflict.service.js
```

**VEYA hepsini birden:**
```bash
git add backend/seeders/20251213142000-part2-seed.js backend/src/controllers/academic.controller.js backend/src/routes/academic.routes.js backend/src/services/prerequisite.service.js backend/src/services/scheduleConflict.service.js
```

### Adım 3: "both modified" Dosyalarını Çöz

#### 3a. package-lock.json
```bash
# Genellikle theirs (başka branch) versiyonunu almak daha güvenli
git checkout --theirs frontend/package-lock.json
git add frontend/package-lock.json
```

#### 3b. App.js ve DashboardPage.jsx
Bu dosyaları manuel olarak kontrol edip merge etmeniz gerekebilir:

```bash
# Önce mevcut versiyonunuzu görün
git show :2:frontend/src/App.js > App.js.ours
git show :3:frontend/src/App.js > App.js.theirs

# Sonra dosyayı açıp manuel olarak merge edin
# Veya theirs versiyonunu alın:
git checkout --theirs frontend/src/App.js
git add frontend/src/App.js

git checkout --theirs frontend/src/pages/DashboardPage.jsx
git add frontend/src/pages/DashboardPage.jsx
```

### Adım 4: Merge'i Tamamla

```bash
git commit -m "Merge: Academic management features and documentation"
```

---

## 🚀 HIZLI ÇÖZÜM (Tüm Conflict'leri Otomatik Çöz)

**DİKKAT:** Bu komutlar tüm conflict'leri otomatik çözer. Önce yedek alın!

```bash
# 1. "added by them" dosyalarını kabul et
git add BACKEND_ACADEMIC_REVIEW.md COMPLETION_STATUS_ACADEMIC.md COURSE_SECTIONS_REQUIREMENTS.md DATABASE_CHANGES_SUMMARY.md HOW_TO_ADD_SECTIONS.md MIGRATION_SUMMARY.md MISSING_FEATURES_ACADEMIC.md PART2_PREPARATION_CHECKLIST.md SCHEDULE_CONFLICT_STATUS.md TEST_GUIDE.md

# 2. "deleted by us" dosyalarını geri getir
git add backend/seeders/20251213142000-part2-seed.js backend/src/controllers/academic.controller.js backend/src/routes/academic.routes.js backend/src/services/prerequisite.service.js backend/src/services/scheduleConflict.service.js

# 3. "both modified" dosyalar için theirs versiyonunu al
git checkout --theirs frontend/package-lock.json frontend/src/App.js frontend/src/pages/DashboardPage.jsx
git add frontend/package-lock.json frontend/src/App.js frontend/src/pages/DashboardPage.jsx

# 4. Merge'i tamamla
git commit -m "Merge: Resolve conflicts - keep all academic features and documentation"
```

---

## ⚠️ ÖNEMLİ NOTLAR

1. **Yedek Alın:** Önce bir yedek branch oluşturun:
   ```bash
   git branch backup-before-merge
   ```

2. **Manuel Kontrol:** `App.js` ve `DashboardPage.jsx` dosyalarını manuel olarak kontrol edin, çünkü her iki branch'te de değişiklik var.

3. **Test Edin:** Merge'den sonra uygulamayı test edin:
   ```bash
   npm install
   npm run dev
   ```

---

## 🔄 ALTERNATİF: Merge'i İptal Et

Eğer merge'i iptal etmek isterseniz:

```bash
git merge --abort
```

Bu komut merge'i iptal eder ve önceki duruma döner.

