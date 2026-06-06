const express = require('express');
const { getDb } = require('../db/schema');
const adminAuth = require('../middleware/adminAuth');
const router = express.Router();

router.use(adminAuth);

router.get('/players', (req, res) => {
  const rows = getDb().prepare(`
    SELECT p.id, p.name, p.access_code, p.created_at,
           COALESCE(sc.total_points, 0) AS total_points,
           (SELECT COUNT(*) FROM predictions WHERE player_id = p.id) +
           (SELECT COUNT(*) FROM bonus_picks WHERE player_id = p.id) AS picks_count
    FROM players p LEFT JOIN scores_cache sc ON sc.player_id = p.id
    ORDER BY total_points DESC
  `).all();
  res.json(rows);
});

router.post('/players', (req, res) => {
  const { name, access_code } = req.body;
  if (!name || !access_code) return res.status(400).json({ error: 'name and access_code required' });
  try {
    const result = getDb().prepare(
      'INSERT INTO players (name, access_code) VALUES (?, ?)'
    ).run(name, access_code);
    res.json({ id: result.lastInsertRowid, name, access_code });
  } catch (e) {
    if (e.message.includes('UNIQUE')) return res.status(409).json({ error: 'access_code already exists' });
    throw e;
  }
});

router.delete('/players/:id', (req, res) => {
  getDb().prepare('DELETE FROM players WHERE id = ?').run(req.params.id);
  res.json({ ok: true });
});

router.get('/players/:id/picks', (req, res) => {
  const db = getDb();
  const predictions = db.prepare(`
    SELECT p.match_id, m.home_team, m.away_team, m.phase,
           p.home_score, p.away_score, p.locked,
           m.home_score AS actual_home, m.away_score AS actual_away, m.status,
           m.kickoff_mt
    FROM predictions p JOIN matches m ON m.id = p.match_id
    WHERE p.player_id = ? ORDER BY m.kickoff_utc
  `).all(req.params.id);

  const bonus = db.prepare(
    'SELECT pick_type, team_code, locked FROM bonus_picks WHERE player_id = ?'
  ).all(req.params.id);

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

router.get('/export.csv', (req, res) => {
  const db = getDb();
  const players = db.prepare(`
    SELECT p.id, p.name, COALESCE(sc.total_points,0) tp,
           COALESCE(sc.match_points,0) mp, COALESCE(sc.bonus_points,0) bp
    FROM players p LEFT JOIN scores_cache sc ON sc.player_id=p.id
    ORDER BY tp DESC
  `).all();

  const lines = ['Rank,Name,Total,Match Pts,Bonus Pts'];
  players.forEach((p, i) => {
    lines.push(`${i + 1},${csvCell(p.name)},${p.tp},${p.mp},${p.bp}`);
  });

  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', 'attachment; filename="leaderboard.csv"');
  res.send(lines.join('\n'));
});

module.exports = router;
