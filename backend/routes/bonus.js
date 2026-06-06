const express = require('express');
const { getDb } = require('../db/schema');
const router = express.Router();

function category(pickType) {
  if (pickType.startsWith('finalist_')) return 'finalist';
  if (pickType.startsWith('semifinalist_')) return 'semifinalist';
  if (pickType.startsWith('quarterfinalist_')) return 'quarterfinalist';
  return pickType;
}

function isBonusLocked(pickType) {
  const db = getDb();
  const groupMatch = pickType.match(/^group_([a-l])_[12](st|nd)$/);
  if (groupMatch) {
    const phase = `group_${groupMatch[1]}`;
    const lastMatch = db.prepare(
      `SELECT kickoff_utc FROM matches WHERE phase = ? ORDER BY kickoff_utc DESC LIMIT 1`
    ).get(phase);
    if (!lastMatch) return false;
    return Date.now() >= new Date(lastMatch.kickoff_utc).getTime() - 60 * 60 * 1000;
  }
  const phaseMap = {
    quarterfinalist: 'r32', semifinalist: 'r16',
    finalist: 'qf', champion: 'final', third_place: '3rd_place',
  };
  const cat = category(pickType);
  const phase = phaseMap[cat];
  if (!phase) return false;
  const firstMatch = db.prepare(
    `SELECT kickoff_utc FROM matches WHERE phase = ? ORDER BY kickoff_utc ASC LIMIT 1`
  ).get(phase);
  if (!firstMatch) return false;
  return Date.now() >= new Date(firstMatch.kickoff_utc).getTime() - 60 * 60 * 1000;
}

router.get('/', (req, res) => {
  const { player_id } = req.query;
  if (!player_id) return res.status(400).json({ error: 'player_id required' });
  const rows = getDb().prepare(
    'SELECT pick_type, team_code, locked FROM bonus_picks WHERE player_id = ?'
  ).all(player_id);
  res.json(rows);
});

router.post('/', (req, res) => {
  const { player_id, pick_type, team_code } = req.body;
  if (!player_id || !pick_type || !team_code)
    return res.status(400).json({ error: 'player_id, pick_type, team_code required' });

  const player = getDb().prepare('SELECT id FROM players WHERE id = ?').get(player_id);
  if (!player) return res.status(404).json({ error: 'Player not found' });

  if (isBonusLocked(pick_type))
    return res.status(403).json({ error: 'This bonus pick is locked' });

  const cat = category(pick_type);
  if (['finalist', 'semifinalist', 'quarterfinalist'].includes(cat)) {
    const existing = getDb().prepare(
      `SELECT id FROM bonus_picks WHERE player_id = ? AND pick_type LIKE ? AND team_code = ?`
    ).get(player_id, `${cat}_%`, team_code);
    if (existing) return res.status(409).json({ error: `${team_code} already picked in this category` });
  }

  getDb().prepare(`
    INSERT INTO bonus_picks (player_id, pick_type, team_code, locked)
    VALUES (?, ?, ?, 0)
    ON CONFLICT(player_id, pick_type) DO UPDATE SET team_code = excluded.team_code
  `).run(player_id, pick_type, team_code);

  res.json({ ok: true });
});

module.exports = router;
