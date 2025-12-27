# Smart Campus - Developer Guide

## 1. Project Structure

```
smart-campus/
├── backend/
│   ├── config/              # Database configuration
│   ├── jobs/                # Cron jobs (5 files)
│   │   ├── absenceWarning.job.js
│   │   ├── backup.job.js
│   │   ├── eventReminder.job.js
│   │   ├── mealReminder.job.js
│   │   └── sessionCloser.job.js
│   ├── migrations/          # Sequelize migrations
│   ├── models/              # 30+ Sequelize models
│   ├── routes/              # Legacy route imports
│   ├── src/
│   │   ├── controllers/     # Request handlers (15+ files)
│   │   ├── middleware/      # Auth, validation, rate-limit
│   │   ├── routes/          # API route definitions
│   │   ├── services/        # Business logic layer
│   │   ├── utils/           # Helpers (email, jwt, qr, logger)
│   │   ├── validators/      # Joi/Yup schemas
│   │   ├── app.js           # Express setup
│   │   └── server.js        # Entry point + Socket.IO
│   ├── tests/
│   │   ├── unit/            # Service tests
│   │   └── integration/     # API tests
│   └── uploads/             # File uploads
├── frontend/
│   └── src/
│       ├── components/      # Reusable UI components
│       ├── context/         # React Context (Auth, Socket)
│       ├── i18n/            # Translations (TR/EN)
│       ├── pages/           # 40+ page components
│       │   ├── admin/
│       │   ├── attendance/
│       │   ├── events/
│       │   ├── meals/
│       │   └── ...
│       ├── services/        # Axios API clients
│       └── App.js           # Router setup
└── docs/                    # Documentation
```

---

## 2. Getting Started

### Prerequisites
- Node.js 18+
- PostgreSQL 14+
- Git

### Setup

```bash
# Clone
git clone <repo-url>
cd smart-campus

# Backend
cd backend
npm install
cp .env.example .env  # Configure DB credentials
npm run db:migrate
npm run dev

# Frontend (new terminal)
cd frontend
npm install
npm start
```

---

## 3. Adding a New Feature

### 3.1 Backend

1. **Create Model** (if new table needed):
   ```bash
   npx sequelize-cli model:generate --name NewModel --attributes field1:string,field2:integer
   ```

2. **Create Service** (`src/services/newFeature.service.js`):
   ```javascript
   class NewFeatureService {
     async doSomething(data) {
       // Business logic here
     }
   }
   module.exports = new NewFeatureService();
   ```

3. **Create Controller** (`src/controllers/newFeature.controller.js`):
   ```javascript
   const newFeatureService = require('../services/newFeature.service');
   
   exports.doSomething = async (req, res) => {
     try {
       const result = await newFeatureService.doSomething(req.body);
       res.json(result);
     } catch (error) {
       res.status(500).json({ error: error.message });
     }
   };
   ```

4. **Create Routes** (`src/routes/newFeature.routes.js`):
   ```javascript
   const router = require('express').Router();
   const controller = require('../controllers/newFeature.controller');
   const { authenticate } = require('../middleware/auth');
   
   router.post('/action', authenticate, controller.doSomething);
   
   module.exports = router;
   ```

5. **Register in app.js**:
   ```javascript
   app.use('/api/v1/new-feature', require('./routes/newFeature.routes'));
   ```

6. **Add Tests** (`tests/integration/newFeature.test.js`)

### 3.2 Frontend

1. **Create Service** (`src/services/newFeatureService.js`):
   ```javascript
   import api from './api';
   
   export const doSomething = async (data) => {
     const response = await api.post('/new-feature/action', data);
     return response.data;
   };
   ```

2. **Create Page** (`src/pages/NewFeaturePage.jsx`)

3. **Add Route** in `App.js`:
   ```jsx
   <Route path="/new-feature" element={<NewFeaturePage />} />
   ```

---

## 4. Coding Conventions

### Naming
| Element | Convention | Example |
|---------|-----------|---------|
| Variables/Functions | camelCase | `getUserById`, `isActive` |
| Classes/Components | PascalCase | `UserController`, `LoginPage` |
| Database columns | snake_case | `user_id`, `created_at` |
| Constants | UPPER_SNAKE | `MAX_RETRIES`, `DEFAULT_LIMIT` |
| Files | kebab-case or camelCase | `auth.routes.js`, `userService.js` |

### Code Style
- Use async/await over callbacks
- Always handle errors with try/catch
- Use middleware for cross-cutting concerns
- Keep controllers thin, logic in services

### Git Commits
Use semantic prefixes:
- `feat:` New feature
- `fix:` Bug fix
- `docs:` Documentation
- `refactor:` Code refactor
- `test:` Adding tests
- `chore:` Maintenance

---

## 5. Testing

### Running Tests

```bash
cd backend

# Run all tests
npm test

# With coverage
npm run test:coverage

# Specific file
npm test -- tests/unit/wallet.service.test.js
```

### Writing Tests

```javascript
const request = require('supertest');
const app = require('../../src/app');

describe('Feature API', () => {
  it('should do something', async () => {
    const res = await request(app)
      .post('/api/v1/feature/action')
      .set('Authorization', `Bearer ${token}`)
      .send({ data: 'value' });
    
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('result');
  });
});
```

---

## 6. Database Migrations

### Create Migration
```bash
npx sequelize-cli migration:generate --name add-column-to-table
```

### Migration Template
```javascript
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('users', 'new_field', {
      type: Sequelize.STRING,
      allowNull: true
    });
  },
  async down(queryInterface) {
    await queryInterface.removeColumn('users', 'new_field');
  }
};
```

### Run Migrations
```bash
npm run db:migrate        # Apply
npm run db:migrate:undo   # Rollback last
```

---

## 7. Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `NODE_ENV` | Environment | development |
| `PORT` | Server port | 5000 |
| `DB_HOST` | Database host | localhost |
| `DB_PORT` | Database port | 5432 |
| `DB_NAME` | Database name | campus_db |
| `DB_USER` | Database user | postgres |
| `DB_PASSWORD` | Database password | - |
| `JWT_ACCESS_TOKEN_SECRET` | JWT signing key | - |
| `JWT_REFRESH_TOKEN_SECRET` | Refresh token key | - |
| `SMTP_HOST` | Email server | - |
| `SMTP_PORT` | Email port | 587 |
| `SMTP_USER` | Email username | - |
| `SMTP_PASS` | Email password | - |

---

## 8. Debugging

### Backend Logs
```bash
# Development logs
npm run dev  # Uses nodemon, auto-reload

# View log files
cat logs/combined.log
cat logs/error.log
```

### Database Queries
Enable Sequelize logging in `config/config.js`:
```javascript
logging: console.log
```

### Frontend
Use React DevTools and Network tab for API debugging.

---

## 9. Contributing

1. Fork the repository
2. Create feature branch: `git checkout -b feat/my-feature`
3. Commit changes: `git commit -m "feat: add new feature"`
4. Push: `git push origin feat/my-feature`
5. Create Pull Request
