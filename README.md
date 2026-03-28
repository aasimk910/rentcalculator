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
