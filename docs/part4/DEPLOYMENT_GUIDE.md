# Smart Campus - Deployment Guide (Complete)

## Prerequisites

- Docker & Docker Compose (v2.0+)
- Node.js 18+ (for local development)
- Git
- 4GB RAM minimum

---

## 1. Docker Deployment (Recommended)

### 1.1 Clone & Configure

```bash
git clone <repository-url>
cd smart-campus
```

### 1.2 Environment Setup

The default configuration works out-of-the-box with Docker. For custom settings:

**Backend `.env`:**
```env
NODE_ENV=production
PORT=5000

# Database (Docker internal network)
DB_HOST=postgres
DB_PORT=5432
DB_NAME=campus_db
DB_USER=admin
DB_PASSWORD=secure_password

# JWT
JWT_ACCESS_TOKEN_SECRET=your-secret-key
JWT_REFRESH_TOKEN_SECRET=your-refresh-secret

# Email (optional)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=app-password
```

**Frontend `.env`:**
```env
REACT_APP_API_URL=http://localhost:5000/api/v1
REACT_APP_SOCKET_URL=http://localhost:5000
```

### 1.3 Build & Run

```bash
# Build all containers
docker-compose build --no-cache

# Start services
docker-compose up -d

# View logs
docker-compose logs -f
```

### 1.4 Verify Deployment

| Service | URL | Status Check |
|---------|-----|--------------|
| Frontend | http://localhost:80 | Should show login page |
| Backend | http://localhost:5000 | `{"message": "Smart Campus API"}` |
| Health | http://localhost:5000/health | `{"status": "ok"}` |

### 1.5 Database Migrations

```bash
# Run inside backend container
docker exec -it smart_campus_backend npm run db:migrate

# Seed demo data (optional)
docker exec -it smart_campus_backend npm run db:seed
```

### 1.6 Stop Services

```bash
docker-compose down

# Remove volumes (WARNING: Deletes data)
docker-compose down -v
```

---

## 2. Local Development

### 2.1 Database Setup

Install PostgreSQL locally or use Docker:

```bash
docker run --name campus-postgres -e POSTGRES_PASSWORD=password -e POSTGRES_DB=campus_db -p 5432:5432 -d postgres:14
```

### 2.2 Backend

```bash
cd backend
npm install

# Configure .env
cp .env.example .env
# Edit DB_HOST=localhost

# Run migrations
npm run db:migrate

# Start server
npm run dev
```

### 2.3 Frontend

```bash
cd frontend
npm install
npm start
```

---

## 3. Cloud Deployment

### 3.1 Google Cloud Platform (GCP)

1. Create a VM instance (e2-medium recommended)
2. Install Docker:
   ```bash
   sudo apt update
   sudo apt install docker.io docker-compose -y
   ```
3. Clone repository and configure `.env` with VM's external IP
4. Open firewall ports: 80 (HTTP), 5000 (API)
5. Run `docker-compose up -d`

### 3.2 AWS EC2

Similar steps with security group configuration for ports.

### 3.3 Heroku

Use separate Heroku apps for backend and frontend with Heroku Postgres addon.

---

## 4. Windows Quick-Start

Double-click `DEPLOY_WIN.bat` in the root directory to:
1. Check prerequisites
2. Install dependencies
3. Start backend and frontend
4. Open browser

---

## 5. SSL/HTTPS Setup

For production, use Let's Encrypt with Nginx:

```nginx
server {
    listen 443 ssl;
    server_name campus.yourdomain.com;
    
    ssl_certificate /etc/letsencrypt/live/campus.yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/campus.yourdomain.com/privkey.pem;
    
    location / {
        proxy_pass http://frontend:80;
    }
    
    location /api {
        proxy_pass http://backend:5000;
    }
    
    location /socket.io {
        proxy_pass http://backend:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }
}
```

---

## 6. Troubleshooting

| Issue | Solution |
|-------|----------|
| Database connection error | Check `DB_HOST`: use `postgres` for Docker, `localhost` for local |
| CORS errors | Verify `REACT_APP_API_URL` matches backend URL |
| Socket.IO not connecting | Check `REACT_APP_SOCKET_URL` and WebSocket proxy config |
| Migrations fail | Ensure database exists and user has permissions |
| Port already in use | Stop conflicting services or change ports in docker-compose.yml |

---

## 7. Backup & Recovery

### Database Backup

```bash
# Create backup
docker exec smart_campus_postgres pg_dump -U admin campus_db > backup.sql

# Restore backup
docker exec -i smart_campus_postgres psql -U admin campus_db < backup.sql
```

### Automated Backups

The system includes a cron job (`jobs/backup.job.js`) that runs daily at 3 AM.
