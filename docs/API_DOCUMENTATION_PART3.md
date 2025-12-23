# API Documentation - Part 3 (Service Integrations)

## Base URL
`GET http://localhost:5000/api/v1`

## 1. Meal Service

### Menus
- **GET** `/meals/menus`
    - Query: `date` (YYYY-MM-DD), `cafeteria_id`
    - Response: List of menus.
- **POST** `/meals/menus` (Admin/Staff)
    - Body: `{ cafeteria_id, date, meal_type, items_json: { soup, main, side, dessert }, nutrition_json }`
- **DELETE** `/meals/menus/:id` (Admin/Staff)

### Reservations
- **GET** `/meals/reservations/my-reservations`
    - Returns: User's upcoming and past meal reservations.
- **POST** `/meals/reservations`
    - Body: `{ menu_id, cafeteria_id, date, meal_type }`
    - Logic: Checks scholarship quota or wallet balance.
- **DELETE** `/meals/reservations/:id`
    - Logic: Refunds wallet if paid and >2 hours remain.

### Staff Operations
- **POST** `/meals/reservations/:id/use`
    - Body: `{ qr_code }` available for double validation.
    - Logic: Marks reservation as `used`.

## 2. Event Management

### Events
- **GET** `/events`
    - Query: `category`, `search`, `page`
- **GET** `/events/:id`
    - Details: Includes remaining capacity and registration status.
- **POST** `/events` (Admin)
    - Body: `{ title, date, start_time, end_time, location, capacity, price, is_paid }`

### Registrations
- **POST** `/events/:id/register`
    - Logic: Checks capacity, deducts wallet (if paid), generates QR.
- **DELETE** `/events/:eventId/registrations/:regId`
    - Logic: Cancels registration, refunds if applicable.
- **GET** `/events/my-events`
    - Returns: User's registered events with QR codes.

### Check-in
- **POST** `/events/:eventId/check-in` (Staff)
    - Body: `{ qr_code }`
    - Logic: Validates QR, prevents double entry.

## 3. Course Scheduling

### Admin
- **POST** `/scheduling/generate`
    - Body: `{ semester: "2025-SPRING", preferredTimeSlot: "morning" }`
    - Response: `{ success: true, assignmentCount: 45 }`

### Student/Instructor
- **GET** `/scheduling/my-schedule`
    - Returns: JSON list of assigned sections.
- **GET** `/scheduling/my-schedule/download`
    - Returns: `.ics` calendar file download.

## 4. Classroom Reservations

- **POST** `/reservations`
    - Body: `{ classroom_id, date, start_time, end_time, purpose }`
- **GET** `/reservations`
    - Query: `status` (pending, approved, rejected)
- **PUT** `/reservations/:id/status` (Admin)
    - Body: `{ status: "approved" }`
    - Logic: Checks for conflicts before approving.

## 5. Wallet Service

- **GET** `/wallet`
    - Returns: `{ balance, currency, transactions: [...] }`
- **POST** `/wallet/topup`
    - Body: `{ amount }`
    - Returns: Updated wallet balance.
- **POST** `/wallet/topup/webhook`
    - Description: Handles callback from payment gateway (Simulated).
    - Body: `{ paymentId, status: "success", signature }`
    - Logic: Verifies signature, credits wallet transaction securely.
