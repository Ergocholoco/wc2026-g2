const { query } = require('../db/schema');

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

async function refreshPlayerScore(playerId) {
  const { rows: preds } = await query(`
    SELECT p.home_score ph, p.away_score pa, m.home_score ah, m.away_score aa
    FROM predictions p JOIN matches m ON m.id = p.match_id
    WHERE p.player_id = $1 AND p.locked = 1 AND m.status = 'FINISHED'
  `, [playerId]);

  const matchPoints = preds.reduce(
    (sum, p) => sum + scoreMatchPrediction(p.ph, p.pa, p.ah, p.aa), 0
  );

  const { rows: bonusPicks } = await query(
    `SELECT pick_type, team_code FROM bonus_picks WHERE player_id = $1 AND locked = 1`,
    [playerId]
  );

  let bonusPoints = 0;
  for (const pick of bonusPicks) {
    const { rows: outcomeRows } = await query(
      `SELECT actual_teams_json FROM bonus_outcomes WHERE pick_category = $1`,
      [pickCategory(pick.pick_type)]
    );
    const outcome = outcomeRows[0];
    if (!outcome) continue;
    const actual = JSON.parse(outcome.actual_teams_json);
    if (actual.includes(pick.team_code)) bonusPoints += bonusPointsForType(pick.pick_type);
  }

  const total = matchPoints + bonusPoints;
  await query(`
    INSERT INTO scores_cache (player_id, total_points, match_points, bonus_points, last_calculated)
    VALUES ($1, $2, $3, $4, NOW())
    ON CONFLICT (player_id) DO UPDATE SET
      total_points = EXCLUDED.total_points,
      match_points = EXCLUDED.match_points,
      bonus_points = EXCLUDED.bonus_points,
      last_calculated = EXCLUDED.last_calculated
  `, [playerId, total, matchPoints, bonusPoints]);
}

// Re-score all players for a given bonus category after its actual_teams_json is set
async function scorePhaseBonus(pickCategory) {
  const { rows: players } = await query(
    'SELECT DISTINCT player_id FROM bonus_picks WHERE pick_type LIKE $1',
    [_categoryLike(pickCategory)]
  );
  for (const { player_id } of players) await refreshPlayerScore(player_id);
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
