# 🏠 Rent Calculator — Nepal

A full-featured MERN stack Rent Calculator for Nepali landlords to manage monthly tenant billing.

## Features
- Add/Edit/Delete tenants with name and room number
- Monthly billing: Rent + Water + Wastage + Electricity
- Electricity auto-calculated: (Current − Previous) × NPR 11
- Animated number counters on bill summary
- Save bills to history per tenant
- Print-ready receipt
- Month selector for billing period
- Input validation with error messages
- Toast notifications

## Tech Stack
- **MongoDB** — tenant and bill history storage
- **Express.js** — REST API
- **React** — frontend with hooks
- **Node.js** — server runtime

## Prerequisites
- Node.js (v16+)
- MongoDB running locally on port 27017

## Setup & Run

### 1. Install all dependencies
```bash
npm run install-all
```

### 2. Start MongoDB
Make sure MongoDB is running locally.

### 3. Run both server & client
```bash
npm run dev
```

This starts:
- **Backend** → http://localhost:5000
- **Frontend** → http://localhost:3000

### Run separately
```bash
# Backend only
npm run server

# Frontend only
npm run client
```

## Self-hosting (Docker)

`docker-compose.yml` runs the app (API + built client on one origin) and MongoDB.

```bash
docker compose up -d --build     # app on http://127.0.0.1:8090
```

- MongoDB is pinned to `mongo:8.2`: `mongo:8` (8.3) and 8.0 refuse to start on Linux 6.19+ ([SERVER-121912](https://jira.mongodb.org/browse/SERVER-121912)).
- The app has no login. Keep it private, e.g. `tailscale serve --bg --https=10000 http://127.0.0.1:8090`.
- `scripts/backup.sh` writes a gzipped `mongodump` to `/mnt/storage/backups/rentcalculator` (falls back to `./backups`) and keeps the newest 12. It runs monthly from cron: `15 0 1 * * …/scripts/backup.sh`.
- Restore a backup: `docker compose exec -T mongo mongorestore --archive --gzip --drop < backups/rentcalculator-YYYY-MM-DD.archive.gz`

To deploy changes, copy the repo to the server and rerun `docker compose up -d --build`.

## API Endpoints
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/tenants` | Get all tenants |
| GET | `/api/tenants/:id` | Get single tenant |
| POST | `/api/tenants` | Create tenant |
| PUT | `/api/tenants/:id` | Update tenant |
| DELETE | `/api/tenants/:id` | Delete tenant |
| POST | `/api/tenants/:id/generate-bill` | Save bill to history |

## Bill Calculation
- Consumed Units = Current Unit − Previous Unit
- Electricity Bill = Consumed Units × NPR 11
- **Total = Rent + Water + Wastage + Electricity**
