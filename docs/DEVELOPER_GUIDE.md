# Developer Guide

## Project Structure

```
smart-campus/
├── backend/            # Express.js API
│   ├── config/         # DB config
│   ├── controllers/    # Request handlers
│   ├── jobs/           # Cron jobs
│   ├── middleware/     # Auth, Validation
│   ├── migrations/     # DB Schema changes
│   ├── models/         # Sequelize Definitions
│   ├── routes/         # API Endpoints
│   ├── src/            # App entry
│   └── tests/          # Jest Tests
├── frontend/           # React SPA
│   ├── public/
│   └── src/
│       ├── components/ # Reusable UI
│       ├── context/    # Global State
│       ├── pages/      # Route Pages
│       └── services/   # API Clients
└── docs/               # Documentation
```

## Adding a New Feature

1. **Backend:**
   - Create Model (`npx sequelize-cli model:generate ...`)
   - Create Controller (`src/controllers/newFeature.controller.js`)
   - Define Routes (`src/routes/newFeature.routes.js`)
   - Add Tests (`tests/integration/newFeature.test.js`)

2. **Frontend:**
   - Create Service (`src/services/newFeatureService.js`)
   - Create Page/Component
   - Add Route in `App.js`

## Coding Conventions
- **Naming:** CamelCase for JS variables/functions (`getUser`), PascalCase for Classes/Components (`UserProfile`).
- **Database:** Snake_case for columns (`user_id`, `created_at`).
- **Commits:** Use semantic prefixes (feat:, fix:, docs:, chore:).

## Testing
- Run Backend Tests: `npm test` (in `/backend`)
- Test Coverage: `npm test -- --coverage`
