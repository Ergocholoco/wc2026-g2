# WC2026 Quiniela — Backend (Group 2 / Advanced Scoring)

## Local development

```
npm install
npm run dev
```

## Deployment (Railway)

This service deploys to Railway via the included `Dockerfile` (Node 18 +
`python3`/`build-essential`, required to compile `better-sqlite3`'s native
module).

### Database storage — read this before relaunching

Railway's free/trial plan does not support persistent volumes, so `DB_PATH`
points at `/tmp/quiniela.db` — local disk inside the container.

**This means the database is wiped every time the container restarts**:
on every redeploy (e.g. pushing new code), and on any restart Railway
triggers on its own (maintenance, crashes, etc). When that happens, every
registered player, prediction, and score is gone — players would need to
register and re-enter their picks from scratch.

Practical guidance for running the tournament:
- Once players start registering and submitting picks, **avoid pushing new
  code / redeploying** unless absolutely necessary.
- If the app does reset unexpectedly mid-tournament, you'll need to notify
  players to re-register and re-enter their picks.

If this turns out to be a problem, the real fix is persistent storage:
upgrade to a Railway plan that includes volumes, or move to a hosted
database (e.g. Postgres via a Railway plugin, or a SQLite-compatible
service like Turso/LibSQL).
