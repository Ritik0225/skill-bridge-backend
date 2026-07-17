# SkillBridge — Backend

REST API for SkillBridge (AI Career Operating System).

**Stack:** Node + Express + TypeScript + MongoDB. AI engine (added later) is provider-agnostic:
Google Gemini (free) default, Groq (free) fallback. Runs entirely on free tiers.

## Getting started

```bash
# 1. Install dependencies
npm install

# 2. Configure environment
cp .env.example .env        # then edit values

# 3. (Optional) start a local MongoDB via Docker
docker compose up -d

# 4. Run the dev server (hot reload)
npm run dev
```

The API starts on `http://localhost:4000`. Check it:

```bash
curl http://localhost:4000/health
# { "status": "ok", "db": "connected", "uptime": 1, "timestamp": "..." }
```

## Scripts

| Script | Purpose |
| --- | --- |
| `npm run dev` | Dev server with hot reload (tsx) |
| `npm run build` | Type-check + compile to `dist/` |
| `npm start` | Run the compiled server |
| `npm test` | Run tests (Vitest + Supertest) |
| `npm run lint` | ESLint |
| `npm run format` | Prettier |

## Structure

```
src/
  config/      env (zod-validated), db, logger
  middleware/  error handler, 404, (auth/validation/upload/rate-limit added later)
  routes/      health + versioned /api/v1 router
  utils/       async handler, errors
  app.ts       Express app factory (used by server + tests)
  server.ts    bootstrap (listen + DB connect + graceful shutdown)
```

## Environment

See `.env.example`. `JWT_SECRET` must be a real random string in production; `MONGODB_URI`
points at local Docker Mongo in dev and MongoDB Atlas M0 in production.
