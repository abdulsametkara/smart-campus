# Database Schema Documentation

## 1. ER Diagram

Aşağıda Part 1 kapsamındaki tabloların ilişkisel yapısı gösterilmektedir:

```mermaid
erDiagram
    USERS ||--o| STUDENTS : has
    USERS ||--o| FACULTY : has
    USERS ||--o{ EMAIL_VERIFICATIONS : has
    USERS ||--o{ PASSWORD_RESETS : has
    USERS ||--o{ SESSION_TOKENS : has
    DEPARTMENTS ||--o{ STUDENTS : contains
    DEPARTMENTS ||--o{ FACULTY : contains

    USERS {
        int id PK
        string email
        string password_hash
        string full_name
        string phone_number
        string profile_picture_url
        enum role "student, faculty, admin"
        boolean is_email_verified
        datetime created_at
        datetime updated_at
    }

    STUDENTS {
        int user_id FK
        string student_number
        int department_id FK
        float gpa
        float cgpa
    }

    FACULTY {
        int user_id FK
        string employee_number
        string title
        int department_id FK
    }

    DEPARTMENTS {
        int id PK
        string name
        string code
        string faculty
    }

    SESSION_TOKENS {
        int id PK
        int user_id FK
        string token
        string user_agent
        string ip_address
        datetime expires_at
        datetime revoked_at
    }
```

## 2. Tablo Açıklamaları

### 2.1. users

Sistemin ana kullanıcı tablosudur. Tüm roller (öğrenci, akademisyen, idari) bu tabloda tutulur.

- **id:** Benzersiz kullanıcı ID'si (Primary Key).
- **email:** Kullanıcının giriş yapmak için kullandığı benzersiz e-posta adresi.
- **password_hash:** bcrypt ile hash'lenmiş şifre.
- **role:** Kullanıcının rolü (student, faculty, admin).
- **is_email_verified:** Email doğrulama durumu.

### 2.2. students

Öğrencilere özgü bilgileri tutan tablodur. `users` tablosu ile 1-1 ilişkisi vardır.

- **user_id:** `users` tablosuna referans (Foreign Key).
- **student_number:** Benzersiz öğrenci numarası.
- **department_id:** `departments` tablosuna referans.

### 2.3. faculty

Akademik personele özgü bilgileri tutan tablodur. `users` tablosu ile 1-1 ilişkisi vardır.

- **user_id:** `users` tablosuna referans (Foreign Key).
- **employee_number:** Benzersiz personel sicil numarası.
- **title:** Unvan (Prof., Doç. vb.).

### 2.4. departments

Üniversite bölümlerini tutan tablodur.

- **name:** Bölüm adı (Bilgisayar Mühendisliği vb.).
- **code:** Bölüm kodu (CENG vb.).
- **faculty:** Bağlı olduğu fakülte adı.

### 2.5. session_tokens

Kullanıcı oturumlarını yönetmek için refresh token'ları saklar.

- **token:** JWT refresh token.
- **expires_at:** Token'ın geçerlilik süresi.
- **revoked_at:** Token iptal edildiğinde (logout) set edilir.

### 2.6. email_verifications & password_resets

Geçici token'ları saklayan tablolardır.

- Belirli bir süre sonra expire olurlar.
- Kullanıldıklarında `used_at` alanı set edilir.
