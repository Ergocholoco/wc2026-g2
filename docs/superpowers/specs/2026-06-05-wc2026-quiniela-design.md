# WC2026 Office Pool (Quiniela) — Design Spec

**Date:** 2026-06-05  
**Status:** Approved  
**Project dir:** `wc2026-quiniela/`

---

## Overview

A private World Cup 2026 office pool web app. Players receive a unique access code from the admin, use it to submit predictions for all 104 matches plus bonus picks, and compete on a live leaderboard. Scores are calculated automatically via the football-data.org API as matches finish.

Tournament runs June 11 – July 19, 2026. App must be live before June 11.

---

## Architecture

### Stack

- **Frontend:** Next.js 14 (App Router), React, custom CSS (no Bootstrap/Tailwind)
- **Backend:** Node.js + Express on port 3001
- **Database:** SQLite via `better-sqlite3`
- **Monorepo:** single repo, root `package.json` uses `concurrently` to start both
- **Single command:** `npm install && npm run dev`

### Directory Layout

```
wc2026-quiniela/
├── frontend/                  # Next.js app
│   ├── app/
│   │   ├── page.tsx           # Standings (leaderboard)
│   │   ├── picks/page.tsx     # My Picks (predictions form)
│   │   ├── schedule/page.tsx  # Match schedule
│   │   └── admin/page.tsx     # Admin panel
│   ├── components/
│   ├── lib/
│   │   └── api.ts             # fetch wrappers → /api/*
│   └── next.config.js         # rewrites /api/* → localhost:3001
├── backend/
│   ├── index.js               # Express entry point
│   ├── db/
│   │   ├── schema.js          # better-sqlite3 setup + migrations
│   │   └── seed.js            # hardcoded 104-match schedule
│   ├── routes/
│   │   ├── auth.js            # POST /api/auth/login
│   │   ├── predictions.js     # GET/POST /api/predictions
│   │   ├── leaderboard.js     # GET /api/leaderboard
│   │   ├── matches.js         # GET /api/matches
│   │   └── admin.js           # admin-only routes
│   ├── services/
│   │   ├── poller.js          # football-data.org polling job
│   │   └── scorer.js          # point calculation engine
│   └── data/
│       └── matches.js         # hardcoded WC2026 schedule (104 matches)
├── .env.example
└── package.json               # root — concurrently
```

### API Proxy

`next.config.js` rewrites:
```js
async rewrites() {
  return [{ source: '/api/:path*', destination: 'http://localhost:3001/api/:path*' }]
}
```
Frontend calls `/api/...` — no CORS config needed in development.

---

## Database Schema

### `matches`
```
id              INTEGER PRIMARY KEY
phase           TEXT    -- 'group_a'..'group_l', 'r32', 'r16', 'qf', 'sf', 'final', '3rd_place'
match_day       INTEGER -- matchday number for display
home_team       TEXT    -- ISO 3166-1 alpha-3 code, e.g. 'MEX'
away_team       TEXT
kickoff_utc     TEXT    -- ISO 8601, converted to MT on frontend
kickoff_mt      TEXT    -- pre-computed display string "Jun 11, 7:00 PM MT"
home_score      INTEGER -- NULL until finished
away_score      INTEGER -- NULL until finished
status          TEXT    -- SCHEDULED | LIVE | IN_PLAY | PAUSED | FINISHED | POSTPONED
fd_match_id     INTEGER -- football-data.org match ID (populated on first sync)
```

### `players`
```
id              INTEGER PRIMARY KEY
name            TEXT    NOT NULL
access_code     TEXT    UNIQUE NOT NULL
created_at      TEXT
```

### `predictions`
```
id              INTEGER PRIMARY KEY
player_id       INTEGER REFERENCES players(id)
match_id        INTEGER REFERENCES matches(id)
home_score      INTEGER NOT NULL
away_score      INTEGER NOT NULL
submitted_at    TEXT
locked          INTEGER DEFAULT 0  -- 1 = locked (1h before kickoff)
UNIQUE(player_id, match_id)
```

### `bonus_picks`
```
id              INTEGER PRIMARY KEY
player_id       INTEGER REFERENCES players(id)
pick_type       TEXT    -- 'champion' | 'third_place' | 'finalist_1' | 'finalist_2'
                        -- | 'semifinalist_1..4' | 'quarterfinalist_1..8'
                        -- | 'group_a_1st' | 'group_a_2nd' .. 'group_l_2nd'
team_code       TEXT    -- ISO 3166-1 alpha-3
locked          INTEGER DEFAULT 0
UNIQUE(player_id, pick_type)
-- Server-side validation required: a player must not pick the same team_code
-- in two slots of the same category (e.g. Brazil as both QF_1 and QF_3).
```

### `scores_cache`
```
player_id       INTEGER PRIMARY KEY REFERENCES players(id)
total_points    INTEGER DEFAULT 0
breakdown_json  TEXT    -- JSON: { match_points, bonus_points, detail[] }
last_calculated TEXT
```

---

## Scoring Engine (`backend/services/scorer.js`)

Triggered after each newly-finished match is detected by the poller.

### Match Predictions
- Correct winner/draw (result only): **3 pts**
- Exact score: **8 pts** — awarded in addition to the 3 pts for correct result (**11 pts total** for an exact correct score)
  - ⚠️ Assumption: these are additive. Confirm with admin before launch.

### Bonus Picks
| Pick | Points Each | Count |
|---|---|---|
| Group 1st place | 4 | ×12 |
| Group 2nd place | 2 | ×12 |
| Quarterfinalist | 6 | ×8 |
| Semifinalist | 10 | ×4 |
| Finalist | 15 | ×2 |
| Champion | 25 | ×1 |
| 3rd place | 12 | ×1 |

Bonus picks are scored as the tournament progresses (QF picks scored after QF results, etc.).

### Implementation
1. For finished match: fetch all predictions where `match_id = X AND locked = 1`
2. Calculate points per prediction
3. Re-sum player's total from all scored predictions + all scored bonus picks
4. Update `scores_cache`

---

## Polling Service (`backend/services/poller.js`)

- Interval: every **5 minutes** via `setInterval`
- Endpoint: `GET https://api.football-data.org/v4/competitions/WC/matches`
- Auth header: `X-Auth-Token: ${process.env.FOOTBALL_API_KEY}`
- Match statuses that trigger scoring: `FINISHED`
- On first sync: match API result to DB row by `home_team + away_team + date`, store `fd_match_id`
- On subsequent syncs: look up by `fd_match_id` directly
- Rate limit: free tier = 10 req/min — one call every 5 min is well within limits
- Error handling: log and skip cycle on API error, never crash the server

---

## Authentication

### Player Auth
- No passwords, no sessions
- Player enters `access_code` on the home screen
- Code is validated via `POST /api/auth/login` → returns `{ player_id, name }`
- `player_id` and `name` stored in `localStorage`
- All prediction API calls include `player_id` in the request body
- Server validates `player_id` exists in DB on every write

### Admin Auth
- `ADMIN_PASSWORD` from `.env`
- Admin enters password on `/admin` page → stored in `sessionStorage`
- Every admin API call sends `X-Admin-Password` header
- Express middleware validates header against `process.env.ADMIN_PASSWORD`

---

## Prediction Locking

- Predictions lock **1 hour before kickoff** for each match individually
- Backend computes lock status: `NOW() >= kickoff_utc - 1h`
- `GET /api/matches` returns `locked: true/false` per match (computed server-side)
- Frontend disables inputs and shows 🔒 badge on locked matches
- Write endpoints (`POST /api/predictions`) reject writes if match is locked

---

## Pick Visibility

- **Before lock**: player sees only their own predictions
- **After lock** (match is locked): `GET /api/predictions/:matchId` returns all players' picks for that match
- Leaderboard always shows total points; picks tab shows per-match breakdown after lock

---

## Navigation

Bottom tab bar (fixed, mobile-first):

| Tab | Icon | Route |
|---|---|---|
| Standings | 🏆 | `/` |
| My Picks | ⚽ | `/picks` |
| Schedule | 📅 | `/schedule` |
| Admin | ⚙️ | `/admin` |

Admin tab only visible if `sessionStorage` has admin password set.

---

## Predictions Form (`/picks`)

### Phase Tabs (horizontal scroll)
`Group A | Group B | ... | Group L | R32 | R16 | QF | SF | Final | Bonus`

### Each Group Tab
- 6 match cards for that group's fixtures
- Each card: home flag + team name, score input ×2, away team, kickoff time (MT)
- Locked matches show 🔒, inputs disabled
- Auto-saves on input blur (debounced 800ms)

### Knockout Tabs (R32, R16, QF, SF, Final)
- Match cards same as above
- Teams shown as TBD until bracket resolves

### Bonus Tab
Dropdown selectors, grouped by category:
- **Knockout Picks**: Champion, 3rd Place, Finalist 1, Finalist 2, SF ×4, QF ×8
- **Group Winners**: Group A 1st / 2nd … Group L 1st / 2nd
- Locking rules:
  - **Group winner picks (A–L)**: lock 1h before the last match of that group kicks off (so players can update as they watch group games)
  - **Quarterfinalist picks (×8)**: lock 1h before the first R32 match kicks off
  - **Semifinalist picks (×4)**: lock 1h before the first QF match kicks off
  - **Finalist picks (×2)**: lock 1h before the first SF match kicks off
  - **Champion + 3rd place**: lock 1h before the Final and 3rd place matches respectively

---

## Leaderboard (`/`)

- Ranked cards, sorted by `total_points` descending
- Each card: position medal (🥇🥈🥉 for top 3, number for rest), player initials avatar (colored circle), player name, total points badge
- Real-time: page polls `GET /api/leaderboard` every 30 seconds
- Clicking a player card expands to show their scored picks (locked matches only)

---

## Schedule (`/schedule`)

- All 104 matches listed chronologically
- Kickoff times displayed in **Mountain Time**
- Status badges: `Scheduled` / `Live` / `Finished` / `Postponed`
- Finished matches show score
- Groups matches under date headers
- Page auto-refreshes every 5 minutes

---

## Admin Panel (`/admin`)

Password-gated. Features:
- **Player list**: name, access code, total points, picks submitted count
- **Add player**: name + access code fields
- **Delete player**: with confirmation
- **View player picks**: click to see any player's full prediction sheet (all phases, all bonus picks)
- **Manual score refresh**: button to trigger immediate poll cycle
- **Export CSV**: leaderboard + all picks as CSV download

---

## Design System

Implemented via the `frontend-design` plugin for production-grade UI.

| Token | Value |
|---|---|
| Background | `#0d1b35` (dark navy) |
| Surface | `#162847` (navy light) |
| Accent | `#f0a500` (gold) |
| Secondary | `#1a9e6a` (green) |
| Text | `#e8eaf0` |
| Text dim | `#8a9bbf` |
| Font | Barlow Condensed + Inter (Google Fonts) |

- Mobile-first responsive
- No Bootstrap — custom CSS with gradients, box shadows, bold type
- Trophy favicon (🏆)
- Custom scrollbars, smooth transitions

---

## Environment Variables

`.env.example`:
```
FOOTBALL_API_KEY=your_key_here
ADMIN_PASSWORD=your_admin_password_here
PORT=3001
```

---

## Match Schedule

104 matches hardcoded in `backend/data/matches.js`:
- **Group stage**: 72 matches (12 groups × 6 matches each), June 11 – July 2
- **Round of 32**: 16 matches, July 4–8
- **Round of 16**: 8 matches, July 10–12
- **Quarterfinals**: 4 matches, July 14–15
- **Semifinals**: 2 matches, July 17–18
- **3rd place**: 1 match, July 19
- **Final**: 1 match, July 19
- All times in Mountain Time (UTC-6)

---

## Out of Scope

- User-set passwords or email auth
- Push notifications
- Real-time WebSocket updates (polling is sufficient)
- Multi-tournament support
- Public registration (admin-only player management)
