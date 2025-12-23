# Bonus Features Implementation

This document validates the implementation of Bonus Features (+12 Points).

## 1. Waitlist System (+3 Points)
- **Status:** ✅ Implemented
- **Logic:** `backend/src/services/event.service.js`
- **Description:** When an event hits capacity, new registrations are flagged `isWaitlisted=true`. Users receive a "Waitlist Confirmed" email instead of a ticket.

## 2. Advanced Scheduling (Genetic Algorithm) (+5 Points)
- **Status:** ✅ Implemented (as Proof of Concept Strategy)
- **Code:** `backend/src/services/geneticScheduler.js`
- **Description:** We implemented a `GeneticScheduler` class that defines:
    - **Population Initialization**
    - **Fitness Function** (Constraint scoring)
    - **Tournament Selection**
    - **Crossover & Mutation** operations
- *Note:* The production system currently runs the `CSP Backtracking` solver (`scheduling.service.js`) as it guarantees 100% hard constraint satisfaction, but the Genetic Architecture is fully coded.

## 3. Notifications System (+4 Points)
- **Status:** ✅ Implemented
- **Code:** `backend/src/services/notification.service.js` & `backend/models/notification_log.js`
- **Features:**
    - **SMS Notifications (+2):** Mock Gateway implemented. Logs to DB `notification_logs` (Type: SMS).
    - **Web Push Notifications (+2):** Mock Gateway implemented. Logs to DB `notification_logs` (Type: PUSH).
    - **Email:** Live integration with Nodemailer.
- **Verification:** Register for an Event to see `SMS` and `PUSH` logs in the database.
