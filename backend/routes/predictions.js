const express = require('express');
const { getDb } = require('../db/schema');
const { refreshPlayerScore } = require('../services/scorer');
const router = express.Router();

function isLocked(kickoff_utc) {
  return Date.now() >= new Date(kickoff_utc).getTime() - 60 * 60 * 1000;
}

router.get('/', (req, res) => {
  const { player_id } = req.query;
  if (!player_id) return res.status(400).json({ error: 'player_id required' });

  const rows = getDb().prepare(
    `SELECT p.match_id, p.home_score, p.away_score, p.locked,
            m.kickoff_utc
     FROM predictions p JOIN matches m ON m.id = p.match_id
     WHERE p.player_id = ?`
  ).all(player_id);

  res.json(rows.map(r => ({
    match_id: r.match_id,
    home_score: r.home_score,
    away_score: r.away_score,
    locked: r.locked === 1,
  })));
});

router.post('/', (req, res) => {
  const { player_id, match_id, home_score, away_score } = req.body;
  if (player_id == null || match_id == null || home_score == null || away_score == null) {
    return res.status(400).json({ error: 'player_id, match_id, home_score, away_score required' });
  }

  const match = getDb().prepare('SELECT kickoff_utc FROM matches WHERE id = ?').get(match_id);
  if (!match) return res.status(404).json({ error: 'Match not found' });
  if (isLocked(match.kickoff_utc)) return res.status(403).json({ error: 'Match is locked' });

  const player = getDb().prepare('SELECT id FROM players WHERE id = ?').get(player_id);
  if (!player) return res.status(404).json({ error: 'Player not found' });

  getDb().prepare(`
    INSERT INTO predictions (player_id, match_id, home_score, away_score, locked)
    VALUES (?, ?, ?, ?, 0)
    ON CONFLICT(player_id, match_id) DO UPDATE SET
      home_score = excluded.home_score,
      away_score = excluded.away_score,
      submitted_at = datetime('now')
  `).run(player_id, match_id, home_score, away_score);

  res.json({ ok: true });
});

module.exports = router;
