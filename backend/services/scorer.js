const { getDb } = require('../db/schema');

function scoreMatchPrediction(predictedHome, predictedAway, actualHome, actualAway) {
  const predResult = Math.sign(predictedHome - predictedAway);
  const actualResult = Math.sign(actualHome - actualAway);
  if (predResult !== actualResult) return 0;

  if ((process.env.SCORING_MODE || 'standard') === 'advanced') {
    let pts = 4;
    const homeWins = actualResult > 0;
    const isDraw   = actualResult === 0;
    if (isDraw) {
      if (predictedHome === actualHome) pts += 2;
      if (predictedAway === actualAway) pts += 2;
    } else {
      const predWinner = homeWins ? predictedHome : predictedAway;
      const predLoser  = homeWins ? predictedAway : predictedHome;
      const actWinner  = homeWins ? actualHome    : actualAway;
      const actLoser   = homeWins ? actualAway    : actualHome;
      if (predWinner === actWinner) pts += 2;
      if (predLoser  === actLoser)  pts += 2;
    }
    return pts;
  }

  return predictedHome === actualHome && predictedAway === actualAway ? 5 : 2;
}

function bonusPointsForType(pickType) {
  if ((process.env.SCORING_MODE || 'standard') === 'advanced') {
    if (pickType === 'champion')  return 20;
    if (pickType === 'runner_up') return 15;
    if (pickType === 'third_place')  return 10;
    if (pickType === 'fourth_place') return 5;
    if (pickType.startsWith('r16_team_')) return 2;
    return 0;
  }
  if (pickType === 'champion') return 25;
  if (pickType === 'third_place') return 12;
  if (pickType.startsWith('finalist_')) return 15;
  if (pickType.startsWith('semifinalist_')) return 10;
  if (pickType.startsWith('quarterfinalist_')) return 6;
  if (pickType.endsWith('_1st')) return 4;
  if (pickType.endsWith('_2nd')) return 2;
  return 0;
}

function refreshPlayerScore(playerId) {
  const db = getDb();

  const preds = db.prepare(`
    SELECT p.home_score ph, p.away_score pa, m.home_score ah, m.away_score aa
    FROM predictions p JOIN matches m ON m.id = p.match_id
    WHERE p.player_id = ? AND p.locked = 1 AND m.status = 'FINISHED'
  `).all(playerId);

  const matchPoints = preds.reduce(
    (sum, p) => sum + scoreMatchPrediction(p.ph, p.pa, p.ah, p.aa), 0
  );

  const bonusPicks = db.prepare(
    `SELECT pick_type, team_code FROM bonus_picks WHERE player_id = ? AND locked = 1`
  ).all(playerId);

  let bonusPoints = 0;
  for (const pick of bonusPicks) {
    const outcome = db.prepare(
      `SELECT actual_teams_json FROM bonus_outcomes WHERE pick_category = ?`
    ).get(pickCategory(pick.pick_type));
    if (!outcome) continue;
    const actual = JSON.parse(outcome.actual_teams_json);
    if (actual.includes(pick.team_code)) bonusPoints += bonusPointsForType(pick.pick_type);
  }

  const total = matchPoints + bonusPoints;
  db.prepare(`
    INSERT INTO scores_cache (player_id, total_points, match_points, bonus_points, last_calculated)
    VALUES (?, ?, ?, ?, datetime('now'))
    ON CONFLICT(player_id) DO UPDATE SET
      total_points = excluded.total_points,
      match_points = excluded.match_points,
      bonus_points = excluded.bonus_points,
      last_calculated = excluded.last_calculated
  `).run(playerId, total, matchPoints, bonusPoints);
}

// Re-score all players for a given bonus category after its actual_teams_json is set
function scorePhaseBonus(pickCategory) {
  const db = getDb();
  const players = db.prepare('SELECT DISTINCT player_id FROM bonus_picks WHERE pick_type LIKE ?')
    .all(_categoryLike(pickCategory));
  for (const { player_id } of players) refreshPlayerScore(player_id);
}

function pickCategory(pickType) {
  if (['champion', 'third_place', 'runner_up', 'fourth_place'].includes(pickType)) return pickType;
  if (pickType.startsWith('finalist_')) return 'finalists';
  if (pickType.startsWith('semifinalist_')) return 'semifinalists';
  if (pickType.startsWith('quarterfinalist_')) return 'quarterfinalists';
  if (pickType.startsWith('r16_team_')) return 'r16';
  return pickType;
}

function _categoryLike(cat) {
  if (cat === 'finalists') return 'finalist_%';
  if (cat === 'semifinalists') return 'semifinalist_%';
  if (cat === 'quarterfinalists') return 'quarterfinalist_%';
  if (cat === 'r16') return 'r16_team_%';
  return cat;
}

module.exports = { scoreMatchPrediction, bonusPointsForType, refreshPlayerScore, scorePhaseBonus, pickCategory };
