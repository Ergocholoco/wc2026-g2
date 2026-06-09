const { Pool } = require('pg');

let _pool;

function getPool() {
  if (!_pool) {
    _pool = new Pool({ connectionString: process.env.DATABASE_URL });
  }
  return _pool;
}

function query(text, params) {
  return getPool().query(text, params);
}

// Exposed only for tests — lets tests inject a mock pool (e.g. pg-mem)
function _setPool(pool) { _pool = pool; }

async function initSchema() {
  await query(`
    CREATE TABLE IF NOT EXISTS matches (
      id          INTEGER PRIMARY KEY,
      phase       TEXT    NOT NULL,
      match_day   INTEGER NOT NULL DEFAULT 1,
      home_team   TEXT    NOT NULL,
      away_team   TEXT    NOT NULL,
      kickoff_utc TEXT    NOT NULL,
      kickoff_mt  TEXT    NOT NULL,
      home_score  INTEGER,
      away_score  INTEGER,
      status      TEXT    NOT NULL DEFAULT 'SCHEDULED',
      fd_match_id INTEGER,
      winner      TEXT
    );

    CREATE TABLE IF NOT EXISTS players (
      id          SERIAL PRIMARY KEY,
      name        TEXT   NOT NULL,
      access_code TEXT   UNIQUE NOT NULL,
      created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS predictions (
      id           SERIAL  PRIMARY KEY,
      player_id    INTEGER NOT NULL REFERENCES players(id) ON DELETE CASCADE,
      match_id     INTEGER NOT NULL REFERENCES matches(id) ON DELETE RESTRICT,
      home_score   INTEGER NOT NULL,
      away_score   INTEGER NOT NULL,
      submitted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      locked       INTEGER NOT NULL DEFAULT 0,
      UNIQUE(player_id, match_id)
    );

    CREATE TABLE IF NOT EXISTS bonus_picks (
      id        SERIAL  PRIMARY KEY,
      player_id INTEGER NOT NULL REFERENCES players(id) ON DELETE CASCADE,
      pick_type TEXT    NOT NULL,
      team_code TEXT    NOT NULL,
      locked    INTEGER NOT NULL DEFAULT 0,
      UNIQUE(player_id, pick_type)
    );

    CREATE TABLE IF NOT EXISTS bonus_outcomes (
      pick_category     TEXT PRIMARY KEY,
      actual_teams_json TEXT NOT NULL DEFAULT '[]'
    );

    CREATE TABLE IF NOT EXISTS scores_cache (
      player_id       INTEGER PRIMARY KEY REFERENCES players(id) ON DELETE CASCADE,
      total_points    INTEGER NOT NULL DEFAULT 0,
      match_points    INTEGER NOT NULL DEFAULT 0,
      bonus_points    INTEGER NOT NULL DEFAULT 0,
      last_calculated TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);
  // Add winner column to existing DBs that were created before this column existed
  await query(`ALTER TABLE matches ADD COLUMN IF NOT EXISTS winner TEXT`);
}

module.exports = { query, getPool, _setPool, initSchema };
