# RentFlow Backend API

Enterprise-grade rental management system built with NestJS, Prisma and MySQL.

## Tech Stack

| Layer | Tech |
|---|---|
| Framework | NestJS 10 + TypeScript |
| ORM | Prisma 5 |
| Database | MySQL 8.0 |
| Auth | JWT (access + refresh tokens) |
| Realtime | Socket.IO WebSockets |
| Docs | Swagger / OpenAPI 3 |
| Containerization | Docker + Docker Compose |

---

## Quick Start (Docker)

```bash
# 1. Clone and copy environment variables
cp .env.example .env

# 2. Start services (API + MySQL + Adminer)
docker-compose up -d

# 3. Run migrations and seed demo data
docker-compose exec api npx prisma migrate dev --name init
docker-compose exec api npx prisma db seed
```

API: http://localhost:3000/api/v1  
Swagger: http://localhost:3000/api/docs  
Adminer: http://localhost:8080

---

## Local Development (without Docker)

### Prerequisites
- Node.js 20+
- MySQL 8.0 running locally

```bash
npm install
cp .env.example .env
# Edit .env → set DATABASE_URL to your local MySQL instance

npx prisma migrate dev --name init
npx prisma db seed

npm run start:dev
```

---

## Demo Credentials

After running the seed:

| Field | Value |
|---|---|
| Email | admin@rentflow.com |
| Password | Admin123* |

The seed creates:
- 8 properties (4 occupied, 3 available, 1 under maintenance)
- 10 tenants
- 5 rental contracts (3 active, 1 expiring soon, 1 expired)
- ~18 payments with various statuses
- 5 maintenance tickets
- 6 notifications and 10 activity log entries

---

## API Endpoints

All routes are prefixed with `/api/v1`. Protected routes require `Authorization: Bearer <token>`.

### Auth
| Method | Route | Description |
|---|---|---|
| POST | /auth/register | Create account |
| POST | /auth/login | Login → returns access + refresh tokens |
| POST | /auth/refresh | Rotate tokens |
| POST | /auth/logout | Revoke refresh token |
| GET | /auth/me | Current user profile |

### Properties
| Method | Route | Description |
|---|---|---|
| GET | /properties | List with pagination + filters |
| POST | /properties | Create property |
| GET | /properties/stats/overview | Aggregated stats |
| GET | /properties/:id | Get by ID |
| PATCH | /properties/:id | Update |
| DELETE | /properties/:id | Soft delete |

### Tenants
| Method | Route | Description |
|---|---|---|
| GET | /tenants | List with pagination |
| POST | /tenants | Create tenant |
| GET | /tenants/stats/overview | Aggregated stats |
| GET | /tenants/:id | Get by ID |
| PATCH | /tenants/:id | Update |
| DELETE | /tenants/:id | Soft delete |

### Contracts
| Method | Route | Description |
|---|---|---|
| GET | /contracts | List |
| POST | /contracts | Create |
| GET | /contracts/stats/overview | Stats |
| GET | /contracts/:id | Get by ID |
| PATCH | /contracts/:id | Update |
| DELETE | /contracts/:id | Soft delete |
| POST | /contracts/:id/renew | Renew contract |

### Payments
| Method | Route | Description |
|---|---|---|
| GET | /payments | List |
| GET | /payments/stats/overview | Stats + overdue |
| GET | /payments/:id | Get by ID |
| PATCH | /payments/:id/pay | Register payment |
| PATCH | /payments/:id/overdue | Mark as overdue |

### Maintenance
| Method | Route | Description |
|---|---|---|
| GET | /maintenance | List tickets |
| POST | /maintenance | Create ticket |
| GET | /maintenance/stats/overview | Stats |
| GET | /maintenance/:id | Get by ID |
| PATCH | /maintenance/:id | Update ticket |
| DELETE | /maintenance/:id | Soft delete |

### Notifications
| Method | Route | Description |
|---|---|---|
| GET | /notifications | List notifications |
| GET | /notifications/unread-count | Unread count |
| PATCH | /notifications/:id/read | Mark as read |
| PATCH | /notifications/read-all | Mark all as read |
| DELETE | /notifications/:id | Delete |

### Uploads
| Method | Route | Description |
|---|---|---|
| POST | /uploads/property/:propertyId | Upload property image |
| GET | /uploads/property/:propertyId | List property images |
| DELETE | /uploads/property/:imageId | Delete image |
| POST | /uploads/avatar | Upload user avatar |

### Dashboard
| Method | Route | Description |
|---|---|---|
| GET | /dashboard/overview | 18 KPIs (properties, contracts, payments, maintenance) |
| GET | /dashboard/revenue | 12-month revenue chart + YoY comparison |
| GET | /dashboard/occupancy | Occupancy rate by property type |
| GET | /dashboard/payments | Collection rate, overdue, payment methods |
| GET | /dashboard/maintenance | Costs, resolution time, by category |
| GET | /dashboard/activity | Recent activity feed |

---

## WebSocket Events

Connect to the WebSocket server with your JWT token:

```js
import { io } from 'socket.io-client';

const socket = io('http://localhost:3000', {
  auth: { token: 'your-access-token' },
});

socket.on('notification:new', (notification) => {
  console.log(notification); // { id, titulo, mensaje, tipo, prioridad }
});
```

---

## Environment Variables

See [.env.example](.env.example) for a full list with descriptions.

Key variables:

```bash
DATABASE_URL=mysql://user:pass@host:3306/db
JWT_SECRET=min-32-char-secret
JWT_REFRESH_SECRET=another-min-32-char-secret
FRONTEND_URL=http://localhost:3001   # comma-separated for multiple origins
```

---

## Production Deployment

```bash
# Build and start with production compose
docker-compose -f docker-compose.prod.yml up -d

# Migrations run automatically on startup (prisma migrate deploy)
# To seed demo data manually:
docker-compose -f docker-compose.prod.yml exec api npx prisma db seed
```

In production, `SWAGGER_ENABLED` is set to `false` automatically.

---

## Project Structure

```
src/
├── common/
│   ├── decorators/        # @CurrentUser, @Roles, @Public
│   ├── filters/           # HttpExceptionFilter
│   ├── guards/            # JwtAuthGuard, RolesGuard
│   ├── interceptors/      # TransformInterceptor, LoggingInterceptor
│   └── enums/             # Shared enums
├── config/
│   ├── app.config.ts
│   ├── jwt.config.ts
│   └── env.validation.ts
├── database/
│   └── prisma.service.ts
└── modules/
    ├── auth/
    ├── users/
    ├── properties/
    ├── tenants/
    ├── contracts/
    ├── payments/
    ├── maintenance/
    ├── notifications/     # REST + WebSocket gateway + ActivityLog
    ├── uploads/           # IStorageProvider abstraction (local / S3-ready)
    └── dashboard/         # Analytics aggregations
```

---

## Connecting a Frontend

The reference implementation lives in `RentFlow Front` (Next.js). Its `src/lib/api-client.ts` already covers:
- Automatic JWT token attachment
- Silent token refresh on 401 (with queue for concurrent requests)
- Response envelope unwrapping `{ success, message, data }` → `data`
- WebSocket connection via Socket.IO with reconnection

---

## Testing

```bash
# Unit tests
npm run test
npm run test:cov      # with coverage report

# E2E tests (requires a running MySQL test database)
# 1. Point DATABASE_URL to a dedicated test database whose name contains "test", e.g.:
export DATABASE_URL="mysql://rentflow:rentflow_password@localhost:3306/rentflow_test"
export NODE_ENV=test
# 2. Apply the schema
npx prisma migrate deploy
# 3. Run the e2e suite
npm run test:e2e
```

**Important — read before running e2e tests:** `PrismaService.cleanDatabase()` truncates every table and runs automatically between e2e test runs. It refuses to execute unless BOTH `NODE_ENV=test` AND the database name in `DATABASE_URL` contains the word `test` — this exists because it once ran against the real Railway database (name `railway`) and wiped it, since only `NODE_ENV` was set at the time. Never rename a shared/production database to include "test", and never export a `DATABASE_URL` pointing at a real database while `NODE_ENV=test` is set in your shell.

CI (`.github/workflows/ci.yml`) runs lint, build, unit tests and e2e tests (against a disposable `mysql:8.0` service container) on every push and pull request.

---

## Rate Limiting

The whole API is throttled to `THROTTLE_LIMIT` requests per `THROTTLE_TTL` seconds per IP (defaults: 100/60s). `/auth/login`, `/auth/register` and `/auth/refresh` have an additional, stricter limit of 5 requests/minute to slow down brute-force attempts.

---

## Database Migrations

From this point on, generate migrations incrementally with `npx prisma migrate dev --name <description>` for every schema change, instead of consolidating changes into a single migration. This keeps the migration history auditable and makes production rollbacks/review possible.

---

## Backups

```bash
# Manual backup (reads DATABASE_URL from the environment, or pass host/user/pass/db explicitly)
./scripts/backup-db.sh
```

The script produces a timestamped, gzip-compressed `mysqldump` under `backups/`. To automate it:
- **Cron (self-hosted/VPS):** schedule `scripts/backup-db.sh` via crontab and rotate/upload the output to external storage (S3, Backblaze, etc.).
- **GitHub Actions (scheduled workflow):** a commented example is included at the bottom of `scripts/backup-db.sh`'s companion notes — wire it to your own storage credentials (repo secrets) before enabling it, since none are provided here.

Always verify a backup by restoring it to a scratch database periodically — an untested backup is not a backup.
