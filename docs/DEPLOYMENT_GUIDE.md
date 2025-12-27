# Deployment Guide

## Prerequisites
- Docker & Docker Compose installed
- Node.js (v16+) (for local dev)
- Git

## Production Deployment (Docker)

This is the recommended way to run Smart Campus in production.

1. **Clone the Repository:**
   ```bash
   git clone <repo-url>
   cd smart-campus
   ```

2. **Configure Environment:**
   Review `.env` files in `backend/` and `frontend/` (if customized).
   *Default docker-compose uses internal networking, so minimal config is needed.*

3. **Run with Docker Compose:**
   ```bash
   docker-compose build --no-cache
   docker-compose up -d
   ```

4. **Verify Deployment:**
   - **Frontend:** http://localhost:80 (or your server IP)
   - **Backend API:** http://localhost:5000
   - **DB Check:** `docker exec -it smart_campus_backend npm run db:migrate` (Automatic in startup script, but good for manual verify)

5. **Stopping:**
   ```bash
   docker-compose down
   ```

## Local Development (Without Docker)

1. **Database:**
   Ensure PostgreSQL is running locally on port 5432.
   Create database `campus_db`.

2. **Backend:**
   ```bash
   cd backend
   npm install
   npm run db:migrate
   npm start
   ```

3. **Frontend:**
   ```bash
   cd frontend
   npm install
   npm start
   ```

## Windows Quick-Start
Double-click `DEPLOY_WIN.bat` in the root directory to auto-install dependencies and start local servers.

## Troubleshooting
- **Database Connection Error:** Check `DB_HOST` in `.env`. (Use `localhost` for local run, `postgres` for Docker).
- **Socket Connection Fail:** Ensure Frontend config points to correct Backend URL.
