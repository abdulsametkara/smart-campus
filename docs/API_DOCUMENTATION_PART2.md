# Part 2 API Dokümantasyonu - Yoklama Sistemi

## Base URL
```
http://localhost:5000/api/v1
```

---

## 🔐 Authentication
Tüm endpoint'ler JWT token gerektirir:
```
Authorization: Bearer <access_token>
```

---

## 📍 Attendance Endpoints

### Oturum Yönetimi (Hoca)

#### POST /attendance/sessions
Yeni yoklama oturumu başlat.

**Request:**
```json
{
  "section_id": 1,
  "duration_minutes": 60,
  "radius": 15,
  "latitude": 41.0550,
  "longitude": 28.9505
}
```

**Response (201):**
```json
{
  "message": "Attendance session started",
  "session_id": 5,
  "qr_code": "abc123xyz789",
  "expires_at": "2024-12-13T20:00:00Z"
}
```

---

#### GET /attendance/sessions/active
Aktif oturumu getir.

**Response:**
```json
{
  "session": {
    "id": 5,
    "section_id": 1,
    "qr_code": "abc123xyz789",
    "status": "ACTIVE",
    "start_time": "2024-12-13T19:00:00Z",
    "end_time": "2024-12-13T20:00:00Z"
  }
}
```

---

#### GET /attendance/sessions/:sessionId
Oturum detayları.

**Response:**
```json
{
  "session": {
    "id": 5,
    "course_code": "CENG101",
    "course_name": "Introduction to Programming",
    "latitude": 41.0550,
    "longitude": 28.9505,
    "radius": 15,
    "status": "ACTIVE"
  },
  "stats": {
    "total": 30,
    "present": 25,
    "absent": 3,
    "excused": 2,
    "flagged": 1
  },
  "records": [...]
}
```

---

#### POST /attendance/sessions/:sessionId/end
Oturumu bitir ve devamsızları işaretle.

**Response:**
```json
{
  "message": "Session closed. 5 students marked absent."
}
```

---

#### GET /attendance/sessions/my
Hocanın tüm oturum geçmişi.

**Response:**
```json
[
  {
    "id": 5,
    "course_code": "CENG101",
    "date": "2024-12-13T19:00:00Z",
    "status": "CLOSED",
    "present_count": 25,
    "total_students": 30,
    "attendance_rate": 83
  }
]
```

---

### Yoklama Verme (Öğrenci)

#### POST /attendance/checkin
GPS ile yoklama ver.

**Request:**
```json
{
  "qr_code": "abc123xyz789",
  "latitude": 41.0551,
  "longitude": 28.9504,
  "accuracy": 10
}
```

**Response (200):**
```json
{
  "message": "Check-in successful"
}
```

**Error Responses:**
| Code | Message |
|------|---------|
| 400 | Sınıfa çok uzaksınız (XXm > XXm) |
| 400 | GPS doğruluğu çok düşük |
| 400 | Bu oturumda zaten yoklama verdiniz |
| 400 | Yoklama oturumu kapalı |
| 404 | Oturum bulunamadı |

---

#### GET /attendance/my-attendance
Öğrencinin devamsızlık istatistikleri.

**Response:**
```json
[
  {
    "course_code": "CENG101",
    "course_name": "Introduction to Programming",
    "total_hours": 42,
    "used_hours": 4,
    "remaining_hours": 8,
    "limit_hours": 12,
    "status": "safe"
  }
]
```

---

#### GET /attendance/my-history
Öğrencinin yoklama geçmişi.

**Response:**
```json
[
  {
    "id": 10,
    "course_code": "CENG101",
    "date": "2024-12-13",
    "status": "PRESENT",
    "check_in_time": "19:05:30"
  }
]
```

---

## 📝 Excuse Endpoints

#### POST /excuses
Mazeret gönder (dosya yüklemeli).

**Request (multipart/form-data):**
```
title: "Sağlık Raporu"
description: "Hastaneye gittim"
session_id: 5
document: <file>
```

**Response (201):**
```json
{
  "message": "Excuse request created",
  "excuse_id": 3
}
```

---

#### GET /excuses/my
Öğrencinin mazeretleri.

---

#### GET /excuses/pending
Bekleyen mazeretler (Hoca).

---

#### PUT /excuses/:excuseId/approve
Mazereti onayla → E-posta gönderilir.

---

#### PUT /excuses/:excuseId/reject
Mazereti reddet → E-posta gönderilir.

---

## 📊 Report Endpoints

#### GET /attendance/sections/my
Hocanın şubeleri.

#### GET /attendance/sections/:sectionId/summary
Şube özet raporu.

#### GET /attendance/sections/:sectionId/history
Şube oturum geçmişi.

---

## 🧮 Haversine Formula

```javascript
function calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371e3; // Earth radius (meters)
    const φ1 = lat1 * Math.PI / 180;
    const φ2 = lat2 * Math.PI / 180;
    const Δφ = (lat2 - lat1) * Math.PI / 180;
    const Δλ = (lon2 - lon1) * Math.PI / 180;

    const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ/2) * Math.sin(Δλ/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

    return R * c; // Distance in meters
}
```
