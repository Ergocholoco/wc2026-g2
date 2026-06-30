const express = require('express');
const { query } = require('../db/schema');
const router = express.Router();

function category(pickType) {
  if (pickType.startsWith('finalist_')) return 'finalist';
  if (pickType.startsWith('semifinalist_')) return 'semifinalist';
  if (pickType.startsWith('quarterfinalist_')) return 'quarterfinalist';
  if (pickType.startsWith('r16_team_')) return 'r16_team';
  return pickType;
}

async function isBonusLocked(pickType) {
  const groupMatch = pickType.match(/^group_([a-l])_[12](st|nd)$/);
  if (groupMatch) {
    const phase = `group_${groupMatch[1]}`;
    const { rows } = await query(
      `SELECT kickoff_utc FROM matches WHERE phase = $1 ORDER BY kickoff_utc DESC LIMIT 1`,
      [phase]
    );
    const lastMatch = rows[0];
    if (!lastMatch) return false;
    return Date.now() >= new Date(lastMatch.kickoff_utc).getTime() - 60 * 60 * 1000;
  }
  // advanced mode: r16 picks lock 10 min before the next upcoming R32 match
  if (pickType.startsWith('r16_team_')) {
    const { rows } = await query(
      `SELECT kickoff_utc FROM matches WHERE phase='r32' AND status='SCHEDULED' ORDER BY kickoff_utc ASC LIMIT 1`
    );
    const nextMatch = rows[0];
    if (!nextMatch) return true; // all R32 done, keep locked
    return Date.now() >= new Date(nextMatch.kickoff_utc).getTime() - 10 * 60 * 1000;
  }
  const phaseMap = {
    quarterfinalist: 'r16', semifinalist: 'r16',
    finalist: 'qf', champion: 'final', third_place: '3rd_place',
    runner_up: 'final', fourth_place: '3rd_place',
  };
  const cat = category(pickType);
  const phase = phaseMap[cat];
  if (!phase) return false;
  const { rows } = await query(
    `SELECT kickoff_utc FROM matches WHERE phase = $1 ORDER BY kickoff_utc ASC LIMIT 1`,
    [phase]
  );
  const firstMatch = rows[0];
  if (!firstMatch) return false;
  return Date.now() >= new Date(firstMatch.kickoff_utc).getTime() - 60 * 60 * 1000;
}

router.get('/', async (req, res) => {
  const { player_id } = req.query;
  if (!player_id) return res.status(400).json({ error: 'player_id required' });
  const { rows } = await query(
    'SELECT pick_type, team_code, locked FROM bonus_picks WHERE player_id = $1',
    [player_id]
  );
  res.json(rows);
});

router.post('/', async (req, res) => {
  const { player_id, pick_type, team_code } = req.body;
  if (!player_id || !pick_type || !team_code)
    return res.status(400).json({ error: 'player_id, pick_type, team_code required' });

  const { rows: playerRows } = await query('SELECT id FROM players WHERE id = $1', [player_id]);
  if (!playerRows[0]) return res.status(404).json({ error: 'Player not found' });

  if (await isBonusLocked(pick_type))
    return res.status(403).json({ error: 'This bonus pick is locked' });

  const cat = category(pick_type);
  if (['finalist', 'semifinalist', 'quarterfinalist', 'r16_team'].includes(cat)) {
    const { rows: existingRows } = await query(
      `SELECT id FROM bonus_picks WHERE player_id = $1 AND pick_type LIKE $2 AND team_code = $3`,
      [player_id, `${cat}_%`, team_code]
    );
    if (existingRows[0]) return res.status(409).json({ error: `${team_code} already picked in this category` });
  }

  await query(`
    INSERT INTO bonus_picks (player_id, pick_type, team_code, locked)
    VALUES ($1, $2, $3, 0)
    ON CONFLICT (player_id, pick_type) DO UPDATE SET team_code = EXCLUDED.team_code
  `, [player_id, pick_type, team_code]);

  res.json({ ok: true });
});

module.exports = router;
