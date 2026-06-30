# Quantum Chat — Backend

This is the **API server** for Quantum Chat.

## What it does

- REST API (Express + MongoDB)
- Real-time messaging (Socket.IO)
- User auth (JWT)
- File uploads
- Multi-tenant website management

## How to run

```bash
# From project root (recommended)
npm run dev:backend

# OR from this folder
cd backend
npm run dev
```

Server runs at: **http://localhost:4000**

## Setup (first time)

1. Copy env file:
   ```bash
   cp .env.example .env
   ```
2. Set `MONGODB_URI` and `JWT_SECRET` in `.env`
3. Seed demo data:
   ```bash
   npm run seed
   ```
   (run from project root: `npm run seed`)

## Production

```bash
npm run build
npm start
```

## Folder structure

```
backend/
├── src/
│   ├── models/        # MongoDB schemas
│   ├── controllers/   # Request handlers
│   ├── services/      # Business logic
│   ├── routes/        # API routes
│   ├── middleware/    # Auth, CORS, rate limit
│   ├── socket/        # Socket.IO events
│   └── index.ts       # Entry point
├── .env               # Your config (MongoDB, JWT, etc.)
└── package.json
```
