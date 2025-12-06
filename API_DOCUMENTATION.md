# API Documentation - Part 1: Authentication & User Management

## Base URL

`http://localhost:5000/api/v1`

## 1. Authentication Endpoints

### 1.1. Register

Yeni kullanıcı kaydı oluşturur.

- **Endpoint:** `POST /auth/register`
- **Access:** Public

**Request Body:**

```json
{
  "email": "student@example.com",
  "password": "Password123",
  "role": "student", // student, faculty, admin
  "full_name": "Ali Veli", // Opsiyonel
  "student_number": "2023001", // Eğer rol student ise zorunlu
  "department_id": 1
}
```

**Response (201 Created):**

```json
{
  "id": 1,
  "email": "student@example.com",
  "role": "student"
}
```

---

### 1.2. Login

Kullanıcı girişi yapar ve token döner.

- **Endpoint:** `POST /auth/login`
- **Access:** Public

**Request Body:**

```json
{
  "email": "student@example.com",
  "password": "Password123"
}
```

**Response (200 OK):**

```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIs...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIs...",
  "user": {
    "id": 1,
    "email": "student@example.com",
    "role": "student"
  }
}
```

---

### 1.3. Refresh Token

Access token süresi dolduğunda yeni token alır.

- **Endpoint:** `POST /auth/refresh`
- **Access:** Public

**Request Body:**

```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIs..."
}
```

**Response (200 OK):**

```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIs..."
}
```

---

### 1.4. Logout

Oturumu sonlandırır ve refresh token'ı geçersiz kılar.

- **Endpoint:** `POST /auth/logout`
- **Access:** Authenticated

**Request Body:**

```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIs..."
}
```

**Response (204 No Content):**
*(Empty body)*

---

### 1.5. Verify Email

Email doğrulama işlemini gerçekleştirir.

- **Endpoint:** `POST /auth/verify-email`
- **Access:** Public

**Request Body:**

```json
{
  "token": "verification-token-uuid"
}
```

**Response (200 OK):**

```json
{
  "message": "Email verified successfully"
}
```

---

### 1.6. Forgot Password

Şifre sıfırlama maili gönderir.

- **Endpoint:** `POST /auth/forgot-password`
- **Access:** Public

**Request Body:**

```json
{
  "email": "student@example.com"
}
```

**Response (200 OK):**

```json
{
  "message": "If that email exists, a reset link has been sent"
}
```

---

### 1.7. Reset Password

Token ile yeni şifre belirler.

- **Endpoint:** `POST /auth/reset-password`
- **Access:** Public

**Request Body:**

```json
{
  "token": "reset-token-uuid",
  "password": "NewPassword123"
}
```

**Response (200 OK):**

```json
{
  "message": "Password has been reset successfully"
}
```

## 2. User Management Endpoints

### 2.1. Get Profile (Me)

Giriş yapmış kullanıcının bilgilerini getirir.

- **Endpoint:** `GET /users/me`
- **Access:** Authenticated

**Response (200 OK):**

```json
{
  "id": 1,
  "email": "student@example.com",
  "full_name": "Ali Veli",
  "phone_number": "+905551234567",
  "role": "student",
  "profile_picture_url": "/uploads/profile-1.jpg",
  "student": {
    "student_number": "2023001",
    "department_id": 1,
    "gpa": 3.5
  }
}
```

---

### 2.2. Update Profile

Kullanıcı profil bilgilerini günceller.

- **Endpoint:** `PUT /users/me`
- **Access:** Authenticated

**Request Body:**

```json
{
  "full_name": "Ali Can Veli",
  "phone_number": "+905559876543"
}
```

**Response (200 OK):**
User objesi döner (Get Profile ile aynı yapıda).

---

### 2.3. Change Password

Kullanıcı şifresini değiştirir.

- **Endpoint:** `PUT /users/me/password`
- **Access:** Authenticated

**Request Body:**

```json
{
  "current_password": "OldPassword123",
  "new_password": "NewPassword123"
}
```

**Response (200 OK):**

```json
{
  "message": "Şifre başarıyla güncellendi"
}
```

---

### 2.4. Upload Profile Picture

Profil fotoğrafı yükler.

- **Endpoint:** `POST /users/me/profile-picture`
- **Access:** Authenticated
- **Content-Type:** multipart/form-data

**Request Body:**

- `profilePicture`: (File)

**Response (200 OK):**

```json
{
  "profile_picture_url": "/uploads/filename.jpg"
}
```

---

### 2.5. List Users (Admin)

Sistemdeki kullanıcıları listeler.

- **Endpoint:** `GET /users`
- **Access:** Admin Only

**Query Parameters:**

- `page`: Sayfa numarası (default: 1)
- `limit`: Sayfa başına kayıt (default: 10)
- `role`: Rol filtresi (student, faculty, admin)
- `search`: İsim veya email araması

**Response (200 OK):**

```json
{
  "data": [ ...user objects... ],
  "meta": {
    "page": 1,
    "limit": 10,
    "total": 50,
    "totalPages": 5
  }
}
```

## 3. Hata Kodları

| Status Code | Açıklama              | Örnek                           |
| ----------- | --------------------- | ------------------------------- |
| 400         | Bad Request           | Geçersiz input, eksik parametre |
| 401         | Unauthorized          | Token yok veya geçersiz         |
| 403         | Forbidden             | Yetkisiz erişim (Role mismatch) |
| 404         | Not Found             | Kaynak bulunamadı               |
| 409         | Conflict              | Email zaten kullanımda          |
| 500         | Internal Server Error | Sunucu hatası                   |
