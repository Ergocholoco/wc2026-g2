# WC2026 Quiniela — Backend (Group 2 / Advanced Scoring)

## Local development

Requires a PostgreSQL database. Set `DATABASE_URL` in `.env` (see `.env.example`),
then:

```
npm install
npm run dev
```

## Deployment (Railway)

This service deploys to Railway via the included `Dockerfile` (Node 18).

### Database

The backend uses PostgreSQL via the `pg` library, connecting through the
`DATABASE_URL` environment variable. On Railway, add a **PostgreSQL** service
to your project (New → Database → PostgreSQL) — Railway automatically injects
`DATABASE_URL` into the backend service's environment, so no manual
configuration is needed. This gives the app persistent storage that survives
restarts and redeploys.

The schema is created automatically on startup (`CREATE TABLE IF NOT EXISTS`),
and the match list is seeded once on first run.
