const Database = require('better-sqlite3');
const path = require('path');

const DB_PATH = process.env.DB_PATH || path.join(__dirname, '../../quiniela.db');
let _db;

function getDb() {
  if (!_db) {
    _db = new Database(DB_PATH);
    _db.pragma('journal_mode = WAL');
    _db.pragma('foreign_keys = ON');
    _initSchema(_db);
  }
  return _db;
}

// Exposed only for tests — lets tests inject an in-memory DB
function _setDb(db) { _db = db; }

function _initSchema(db) {
  db.exec(`
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
      fd_match_id INTEGER
    );

    CREATE TABLE IF NOT EXISTS players (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      name        TEXT    NOT NULL,
      access_code TEXT    UNIQUE NOT NULL,
      created_at  TEXT    NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS predictions (
      id           INTEGER PRIMARY KEY AUTOINCREMENT,
      player_id    INTEGER NOT NULL REFERENCES players(id) ON DELETE CASCADE,
      match_id     INTEGER NOT NULL REFERENCES matches(id) ON DELETE RESTRICT,
      home_score   INTEGER NOT NULL,
      away_score   INTEGER NOT NULL,
      submitted_at TEXT    NOT NULL DEFAULT (datetime('now')),
      locked       INTEGER NOT NULL DEFAULT 0,
      UNIQUE(player_id, match_id)
    );

    CREATE TABLE IF NOT EXISTS bonus_picks (
      id        INTEGER PRIMARY KEY AUTOINCREMENT,
      player_id INTEGER NOT NULL REFERENCES players(id) ON DELETE CASCADE,
      pick_type TEXT    NOT NULL,
      team_code TEXT    NOT NULL,
      locked    INTEGER NOT NULL DEFAULT 0,
      UNIQUE(player_id, pick_type)
    );

    CREATE TABLE IF NOT EXISTS bonus_outcomes (
      pick_category       TEXT PRIMARY KEY,
      actual_teams_json   TEXT NOT NULL DEFAULT '[]'
    );

    CREATE TABLE IF NOT EXISTS scores_cache (
      player_id     INTEGER PRIMARY KEY REFERENCES players(id) ON DELETE CASCADE,
      total_points  INTEGER NOT NULL DEFAULT 0,
      match_points  INTEGER NOT NULL DEFAULT 0,
      bonus_points  INTEGER NOT NULL DEFAULT 0,
      last_calculated TEXT NOT NULL DEFAULT (datetime('now'))
    );
  `);
}

module.exports = { getDb, _setDb, _initSchema };
