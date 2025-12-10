# Smart Campus - API Documentation (Part 1)

Bu döküman, Smart Campus projesinin "Part 1" kapsamında geliştirilen Authentication, User Management ve Admin API endpoint'lerini detaylandırır.

---

## 1. Authentication Endpoints

### Register User

**URL:** `POST /api/v1/auth/register`
**Authentication:** None
**Authorization:** None
**Description:** Yeni bir kullanıcı kaydı oluşturur. Öğrenci veya Akademisyen rolü seçilebilir.

**Request Body:**
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| full_name | String | Yes | Kullanıcının tam adı |
| email | String | Yes | Geçerli e-posta adresi |
| password | String | Yes | En az 8 karakter, 1 büyük harf, 1 rakam |
| role | String | Yes | 'student' veya 'academician' |
| student_number | String | No | Öğrenci ise zorunlu |
| department | String | No | Akademisyen ise zorunlu |

**Example Request:**

```json
{
  "full_name": "Ahmet Yılmaz",
  "email": "ahmet@example.com",
  "password": "Password123!",
  "role": "student",
  "student_number": "2024001"
}
```

**Success Response (201 Created):**

```json
{
  "success": true,
  "message": "Kayıt başarılı. Lütfen emailinizi doğrulayın.",
  "data": { "userId": 15, "email": "ahmet@example.com" }
}
```

---

### Login

**URL:** `POST /api/v1/auth/login`
**Authentication:** None
**Authorization:** None
**Description:** Kullanıcı girişi yapar. 2FA aktifse geçici bir token döner, değilse tam erişim tokenı döner.

**Request Body:**
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| email | String | Yes | Kullanıcı e-postası |
| password | String | Yes | Kullanıcı şifresi |

**Example Request:**

```json
{
  "email": "ahmet@example.com",
  "password": "Password123!"
}
```

**Success Response (200 OK - Standart):**

```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1Ni...",
  "user": { "id": 15, "full_name": "Ahmet Yılmaz", "role": "student" },
  "is2FARequired": false
}
```

**Success Response (200 OK - 2FA Gerekli):**

```json
{
  "success": true,
  "message": "2FA kodu gerekli.",
  "is2FARequired": true,
  "tempToken": "gecici_token_string",
  "userId": 15
}
```

---

### 2FA Verify (Login)

**URL:** `POST /api/v1/auth/2fa/verify-login`
**Authentication:** None (Requires tempToken from login)
**Authorization:** None
**Description:** Giriş aşamasında 2. adım olarak TOTP kodunu doğrular.

**Request Body:**
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| userId | Integer | Yes | Kullanıcı ID |
| token | String | Yes | Google Authenticator kodu (6 hane) |

**Example Request:**

```json
{
  "userId": 15,
  "token": "123456"
}
```

---

### Forgot Password

**URL:** `POST /api/v1/auth/forgot-password`
**Authentication:** None
**Authorization:** None
**Description:** Şifre sıfırlama bağlantısı gönderir.

**Request Body:**
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| email | String | Yes | Kullanıcı e-postası |

---

## 2. User Management Endpoints

### Get Profile

**URL:** `GET /api/v1/users/profile`
**Authentication:** Required (JWT)
**Authorization:** All Roles
**Description:** Oturum açmış kullanıcının bilgilerini getirir.

**Request Headers:**
| Header | Type | Required | Description |
|--------|------|----------|-------------|
| Authorization | String | Yes | Bearer {token} |

**Success Response (200 OK):**

```json
{
  "success": true,
  "data": {
    "id": 15,
    "full_name": "Ahmet Yılmaz",
    "email": "ahmet@example.com",
    "role": "student",
    "is_2fa_enabled": true,
    "avatar_url": "/uploads/profiles/user-15.jpg"
  }
}
```

---

### Upload Avatar

**URL:** `POST /api/v1/users/profile/upload-avatar`
**Authentication:** Required (JWT)
**Authorization:** All Roles
**Description:** Profil fotoğrafı yükler.

**Request Body:**
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| avatar | File | Yes | Resim dosyası (jpg, png) |

---

## 3. Admin Endpoints

### List Users

**URL:** `GET /api/v1/admin/users`
**Authentication:** Required (JWT)
**Authorization:** Admin Only
**Description:** Sistemdeki tüm kullanıcıları listeler.

**Request Headers:**
| Header | Type | Required | Description |
|--------|------|----------|-------------|
| Authorization | String | Yes | Bearer {token} |

---

### System Logs

**URL:** `GET /api/v1/admin/logs`
**Authentication:** Required (JWT)
**Authorization:** Admin Only
**Description:** Sistem aktivite loglarını (Giriş, Çıkış, Hata) sayfalı şekilde listeler.

**Query Parameters:**
| Param | Type | Required | Description |
|-------|------|----------|-------------|
| page | Integer | No | Sayfa numarası (Def: 1) |
| limit | Integer | No | Sayfa başı kayıt (Def: 20) |

**Success Response (200 OK):**

```json
{
  "success": true,
  "data": [
    {
      "id": 101,
      "action": "LOGIN",
      "ip_address": "192.168.1.1",
      "user_agent": "Mozilla/5.0...",
      "createdAt": "2024-12-10T14:30:00Z",
      "user": { "email": "admin@example.com" }
    }
  ],
  "meta": { "page": 1, "total": 50 }
}
```
