const express = require('express');
const { query } = require('../db/schema');
const { refreshPlayerScore } = require('../services/scorer');
const router = express.Router();

function isLocked(kickoff_utc) {
  return Date.now() >= new Date(kickoff_utc).getTime() - 60 * 60 * 1000;
}

router.get('/', async (req, res) => {
  const { player_id } = req.query;
  if (!player_id) return res.status(400).json({ error: 'player_id required' });

  const { rows } = await query(
    `SELECT p.match_id, p.home_score, p.away_score, p.locked,
            m.kickoff_utc
     FROM predictions p JOIN matches m ON m.id = p.match_id
     WHERE p.player_id = $1`,
    [player_id]
  );

  res.json(rows.map(r => ({
    match_id: r.match_id,
    home_score: r.home_score,
    away_score: r.away_score,
    locked: r.locked === 1,
  })));
});

router.post('/', async (req, res) => {
  const { player_id, match_id, home_score, away_score } = req.body;
  if (player_id == null || match_id == null || home_score == null || away_score == null) {
    return res.status(400).json({ error: 'player_id, match_id, home_score, away_score required' });
  }

  const { rows: matchRows } = await query('SELECT kickoff_utc FROM matches WHERE id = $1', [match_id]);
  const match = matchRows[0];
  if (!match) return res.status(404).json({ error: 'Match not found' });
  if (isLocked(match.kickoff_utc)) return res.status(403).json({ error: 'Match is locked' });

  const { rows: playerRows } = await query('SELECT id FROM players WHERE id = $1', [player_id]);
  if (!playerRows[0]) return res.status(404).json({ error: 'Player not found' });

  await query(`
    INSERT INTO predictions (player_id, match_id, home_score, away_score, locked)
    VALUES ($1, $2, $3, $4, 0)
    ON CONFLICT (player_id, match_id) DO UPDATE SET
      home_score = EXCLUDED.home_score,
      away_score = EXCLUDED.away_score,
      submitted_at = NOW()
  `, [player_id, match_id, home_score, away_score]);

  res.json({ ok: true });
});

module.exports = router;
