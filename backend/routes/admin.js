const express = require('express');
const { query } = require('../db/schema');
const adminAuth = require('../middleware/adminAuth');
const router = express.Router();

router.use(adminAuth);

router.get('/players', async (req, res) => {
  const { rows } = await query(`
    SELECT p.id, p.name, p.access_code, p.created_at,
           COALESCE(sc.total_points, 0) AS total_points,
           COALESCE(pred.cnt, 0) + COALESCE(bonus.cnt, 0) AS picks_count
    FROM players p
    LEFT JOIN scores_cache sc ON sc.player_id = p.id
    LEFT JOIN (SELECT player_id, COUNT(*)::int AS cnt FROM predictions GROUP BY player_id) pred ON pred.player_id = p.id
    LEFT JOIN (SELECT player_id, COUNT(*)::int AS cnt FROM bonus_picks GROUP BY player_id) bonus ON bonus.player_id = p.id
    ORDER BY total_points DESC
  `);
  res.json(rows);
});

router.post('/players', async (req, res) => {
  const { name, access_code } = req.body;
  if (!name || !access_code) return res.status(400).json({ error: 'name and access_code required' });
  try {
    const { rows } = await query(
      'INSERT INTO players (name, access_code) VALUES ($1, $2) RETURNING id',
      [name, access_code]
    );
    res.json({ id: rows[0].id, name, access_code });
  } catch (e) {
    if (e.code === '23505') return res.status(409).json({ error: 'access_code already exists' });
    throw e;
  }
});

router.delete('/players/:id', async (req, res) => {
  await query('DELETE FROM players WHERE id = $1', [req.params.id]);
  res.json({ ok: true });
});

router.get('/players/:id/picks', async (req, res) => {
  const { rows: predictions } = await query(`
    SELECT p.match_id, m.home_team, m.away_team, m.phase,
           p.home_score, p.away_score, p.locked,
           m.home_score AS actual_home, m.away_score AS actual_away, m.status,
           m.kickoff_mt
    FROM predictions p JOIN matches m ON m.id = p.match_id
    WHERE p.player_id = $1 ORDER BY m.kickoff_utc
  `, [req.params.id]);

  const { rows: bonus } = await query(
    'SELECT pick_type, team_code, locked FROM bonus_picks WHERE player_id = $1',
    [req.params.id]
  );

  res.json({ predictions, bonus });
});

router.post('/refresh', (req, res) => {
  try {
    const { triggerPoll } = require('../services/poller');
    triggerPoll().catch(console.error);
  } catch (e) {
    // Poller not yet initialized or unavailable
  }
  res.json({ ok: true, message: 'Poll cycle triggered' });
});

function csvCell(v) {
  let s = String(v ?? '');
  if (/^[=+\-@\t\r]/.test(s)) s = "'" + s;
  return '"' + s.replace(/"/g, '""') + '"';
}

router.get('/export.csv', async (req, res) => {
  const { rows: players } = await query(`
    SELECT p.id, p.name, COALESCE(sc.total_points,0) tp,
           COALESCE(sc.match_points,0) mp, COALESCE(sc.bonus_points,0) bp
    FROM players p LEFT JOIN scores_cache sc ON sc.player_id=p.id
    ORDER BY tp DESC
  `);

  const lines = ['Rank,Name,Total,Match Pts,Bonus Pts'];
  players.forEach((p, i) => {
    lines.push(`${i + 1},${csvCell(p.name)},${p.tp},${p.mp},${p.bp}`);
  });

  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', 'attachment; filename="leaderboard.csv"');
  res.send(lines.join('\n'));
});

router.get('/export-picks.csv', async (req, res) => {
  const { rows: predictions } = await query(`
    SELECT pl.name AS player_name, m.phase, m.home_team, m.away_team,
           p.home_score AS pick_home, p.away_score AS pick_away, p.locked,
           m.home_score AS actual_home, m.away_score AS actual_away, m.status
    FROM predictions p
    JOIN players pl ON pl.id = p.player_id
    JOIN matches m ON m.id = p.match_id
    ORDER BY pl.name, m.kickoff_utc
  `);

  const { rows: bonus } = await query(`
    SELECT pl.name AS player_name, b.pick_type, b.team_code, b.locked
    FROM bonus_picks b
    JOIN players pl ON pl.id = b.player_id
    ORDER BY pl.name, b.pick_type
  `);

  const lines = ['Player,Type,Phase,Match / Pick,Your Pick,Actual Result,Locked'];

  predictions.forEach(p => {
    const matchLabel = `${p.home_team} vs ${p.away_team}`;
    const yourPick = `${p.pick_home}-${p.pick_away}`;
    const actual = p.status === 'FINISHED' ? `${p.actual_home}-${p.actual_away}` : p.status;
    lines.push([
      csvCell(p.player_name), csvCell('Match'), csvCell(p.phase),
      csvCell(matchLabel), csvCell(yourPick), csvCell(actual), csvCell(p.locked ? 'Yes' : 'No'),
    ].join(','));
  });

  bonus.forEach(b => {
    lines.push([
      csvCell(b.player_name), csvCell('Bonus'), csvCell(''),
      csvCell(b.pick_type), csvCell(b.team_code), csvCell(''), csvCell(b.locked ? 'Yes' : 'No'),
    ].join(','));
  });

  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', 'attachment; filename="picks_backup.csv"');
  res.send(lines.join('\n'));
});

module.exports = router;
