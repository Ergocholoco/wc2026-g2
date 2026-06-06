const express = require('express');
const { getDb } = require('../db/schema');
const router = express.Router();

router.get('/', (req, res) => {
  const db = getDb();

  db.prepare(`
    INSERT OR IGNORE INTO scores_cache (player_id, total_points, match_points, bonus_points)
    SELECT id, 0, 0, 0 FROM players
  `).run();

  const rows = db.prepare(`
    SELECT p.id AS player_id, p.name,
           COALESCE(sc.total_points, 0) AS total_points,
           COALESCE(sc.match_points, 0) AS match_points,
           COALESCE(sc.bonus_points, 0) AS bonus_points
    FROM players p LEFT JOIN scores_cache sc ON sc.player_id = p.id
    ORDER BY total_points DESC, p.name ASC
  `).all();

  res.json(rows.map((r, i) => ({ ...r, position: i + 1 })));
});

module.exports = router;
