# Payment Integration Guide

## Overview
The Smart Campus payment system utilizes an internal **Wallet** architecture. Users pre-load funds (top-up) into their digital wallet, which are then used for internal services (Meal Reservations, Paid Events) via atomic transactions. This approach minimizes external API calls for small daily purchases and improves system speed.

## Architecture

### Database Schema
1.  **Wallet**: Stores the current balance for each user.
    - `id`, `user_id`, `balance` (DECIMAL), `currency`
2.  **Transaction**: Immutable record of every balance change.
    - `id`, `wallet_id`, `type` (credit/debit), `amount`, `reference_id` (Event/Meal ID), `status`, `description`

### Service Layer (`WalletService`)
The service layer handles all financial logic within database transactions to ensure data integrity (ACID properties).

- **Top-up (Credit)**: Increases balance.
- **Payment (Debit)**: Decreases balance (throws error if insufficient funds).
- **History**: Retrieves transaction logs.

## Payment Flow (Top-up)

Currently, the system uses a **Simulated Gateway** for demonstration purposes. In a production environment, this would be replaced by Stripe or PayTR integration.

1.  **User Request**: User requests to load 100 TRY.
2.  **Gateway Handshake**: Backend creates a "Payment Intent" (Mocked).
    - *Production:* Call Stripe API -> Get `client_secret`.
3.  **Frontend Confirmation**: User enters card details (Mocked).
4.  **Webhook/Callback**:
    - The gateway confirms successful payment to the backend.
    - Backend calls `WalletService.topUp(userId, 100)`.
5.  **Result**: User's wallet balance updates.

## Internal Usage (Spending)

Services like `EventService` and `MealService` consume the wallet directly.

### Example: Event Registration
```javascript
// Inside a transaction (t)
if (event.is_paid) {
    await walletService.processPayment(
        userId, 
        event.price, 
        `Event: ${event. title}`
    );
}
// ... proceed to generate QR code ...
```

## Security Best Practices
- **Atomic Transactions**: All balance updates happen within Sequelize transactions `await sequelize.transaction()`.
- **Server-Side Validation**: Prices are fetched from the database, never trusted from the client.
- **Immutable Log**: Transactions are never deleted or updated, only appended.
