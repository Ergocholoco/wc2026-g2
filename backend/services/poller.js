const { getDb } = require('../db/schema');
const { refreshPlayerScore, scorePhaseBonus } = require('./scorer');

const POLL_INTERVAL_MS = 5 * 60 * 1000;
let _timer = null;

async function fetchMatches() {
  const apiKey = process.env.FOOTBALL_API_KEY;
  if (!apiKey) { console.warn('[poller] FOOTBALL_API_KEY not set — skipping poll'); return []; }

  const res = await fetch('https://api.football-data.org/v4/competitions/WC/matches', {
    headers: { 'X-Auth-Token': apiKey },
  });
  if (!res.ok) throw new Error(`API ${res.status}: ${await res.text()}`);
  const data = await res.json();
  return data.matches || [];
}

async function fetchStandings() {
  const apiKey = process.env.FOOTBALL_API_KEY;
  if (!apiKey) return [];
  const res = await fetch('https://api.football-data.org/v4/competitions/WC/standings', {
    headers: { 'X-Auth-Token': apiKey },
  });
  if (!res.ok) return [];
  const data = await res.json();
  return data.standings || [];
}

async function pollCycle() {
  const db = getDb();
  let apiMatches;
  try {
    apiMatches = await fetchMatches();
  } catch (e) {
    console.error('[poller] fetch error — skipping cycle:', e.message);
    return;
  }

  const finishedMatchIds = new Set();

  for (const m of apiMatches) {
    if (m.status !== 'FINISHED') {
      if (['LIVE', 'IN_PLAY', 'PAUSED'].includes(m.status)) {
        db.prepare(`
          UPDATE matches SET status = ?, fd_match_id = COALESCE(fd_match_id, ?)
          WHERE fd_match_id = ? OR (
            home_team = ? AND away_team = ? AND substr(kickoff_utc,1,10) = substr(?,1,10)
          )
        `).run(m.status, m.id, m.id, m.homeTeam.tla, m.awayTeam.tla, m.utcDate);
      }
      continue;
    }

    const score = m.score?.fullTime;
    if (score?.home == null || score?.away == null) continue;

    let dbMatch = db.prepare('SELECT * FROM matches WHERE fd_match_id = ?').get(m.id);
    if (!dbMatch) {
      dbMatch = db.prepare(`
        SELECT * FROM matches
        WHERE home_team = ? AND away_team = ? AND substr(kickoff_utc,1,10) = substr(?,1,10)
      `).get(m.homeTeam.tla, m.awayTeam.tla, m.utcDate);
    }
    if (!dbMatch) continue;

    if (dbMatch.status === 'FINISHED' && dbMatch.home_score != null) continue;

    db.prepare(`
      UPDATE matches SET status='FINISHED', home_score=?, away_score=?, fd_match_id=?
      WHERE id=?
    `).run(score.home, score.away, m.id, dbMatch.id);

    db.prepare(`UPDATE predictions SET locked=1 WHERE match_id=?`).run(dbMatch.id);

    finishedMatchIds.add(dbMatch.id);
  }

  if (finishedMatchIds.size === 0) return;

  const affectedPlayers = db.prepare(`
    SELECT DISTINCT player_id FROM predictions WHERE match_id IN (${[...finishedMatchIds].map(() => '?').join(',')})
  `).all(...finishedMatchIds);

  for (const { player_id } of affectedPlayers) refreshPlayerScore(player_id);

  await scoreGroupBonusIfComplete(db);
  await scoreKnockoutBonusIfComplete(db);
}

async function scoreGroupBonusIfComplete(db) {
  const groups = ['a','b','c','d','e','f','g','h','i','j','k','l'];
  for (const g of groups) {
    const phase = `group_${g}`;
    const { total, finished } = db.prepare(`
      SELECT COUNT(*) AS total,
             SUM(CASE WHEN status='FINISHED' THEN 1 ELSE 0 END) AS finished
      FROM matches WHERE phase=?
    `).get(phase);
    if (total === 0 || finished < total) continue;

    const alreadyScored = db.prepare(
      `SELECT 1 FROM bonus_outcomes WHERE pick_category=?`
    ).get(`group_${g}_1st`);
    if (alreadyScored) continue;

    let standings;
    try { standings = await fetchStandings(); } catch { continue; }
    const groupStanding = standings.find(s => s.group === `GROUP_${g.toUpperCase()}`);
    if (!groupStanding) continue;

    const sorted = [...groupStanding.table].sort((a, b) => {
      if (b.points !== a.points) return b.points - a.points;
      const gdDiff = b.goalDifference - a.goalDifference;
      if (gdDiff !== 0) return gdDiff;
      return b.goalsFor - a.goalsFor;
    });

    const first = sorted[0]?.team?.tla;
    const second = sorted[1]?.team?.tla;
    if (!first || !second) continue;

    db.prepare(`INSERT OR REPLACE INTO bonus_outcomes (pick_category, actual_teams_json) VALUES (?,?)`).run(`group_${g}_1st`, JSON.stringify([first]));
    db.prepare(`INSERT OR REPLACE INTO bonus_outcomes (pick_category, actual_teams_json) VALUES (?,?)`).run(`group_${g}_2nd`, JSON.stringify([second]));
    db.prepare(`UPDATE bonus_picks SET locked=1 WHERE pick_type=? OR pick_type=?`).run(`group_${g}_1st`, `group_${g}_2nd`);
    scorePhaseBonus(`group_${g}_1st`);
    scorePhaseBonus(`group_${g}_2nd`);
  }
}

async function scoreKnockoutBonusIfComplete(db) {
  if ((process.env.SCORING_MODE || 'standard') === 'advanced') {
    return scoreAdvancedBonusIfComplete(db);
  }

  const phases = [
    { dbPhase: 'r16',       bonusCategory: 'quarterfinalists', matchCount: 8 },
    { dbPhase: 'qf',        bonusCategory: 'semifinalists',    matchCount: 4 },
    { dbPhase: 'sf',        bonusCategory: 'finalists',        matchCount: 2 },
    { dbPhase: 'final',     bonusCategory: 'champion',         matchCount: 1 },
    { dbPhase: '3rd_place', bonusCategory: 'third_place',      matchCount: 1 },
  ];

  for (const { dbPhase, bonusCategory, matchCount } of phases) {
    const { finished } = db.prepare(
      `SELECT SUM(CASE WHEN status='FINISHED' THEN 1 ELSE 0 END) AS finished FROM matches WHERE phase=?`
    ).get(dbPhase);
    if ((finished || 0) < matchCount) continue;

    const alreadyScored = db.prepare(
      `SELECT 1 FROM bonus_outcomes WHERE pick_category=?`
    ).get(bonusCategory);
    if (alreadyScored) continue;

    const winners = db.prepare(`
      SELECT CASE WHEN home_score > away_score THEN home_team ELSE away_team END AS winner
      FROM matches WHERE phase=? AND status='FINISHED'
    `).all(dbPhase).map(r => r.winner);

    const teamCodes = ['champion', 'third_place'].includes(bonusCategory)
      ? [winners[0]] : winners;

    db.prepare(`INSERT OR REPLACE INTO bonus_outcomes (pick_category, actual_teams_json) VALUES (?,?)`).run(bonusCategory, JSON.stringify(teamCodes));
    db.prepare(`UPDATE bonus_picks SET locked=1 WHERE pick_type LIKE ?`).run(
      bonusCategory === 'champion' ? 'champion' :
      bonusCategory === 'third_place' ? 'third_place' :
      `${bonusCategory.replace(/s$/, '')}_%`
    );
    scorePhaseBonus(bonusCategory);
  }
}

async function scoreAdvancedBonusIfComplete(db) {
  // R16 teams: winners of all 16 R32 matches
  const r32Finished = db.prepare(
    `SELECT SUM(CASE WHEN status='FINISHED' THEN 1 ELSE 0 END) AS c FROM matches WHERE phase='r32'`
  ).get().c || 0;
  if (r32Finished >= 16 && !db.prepare(`SELECT 1 FROM bonus_outcomes WHERE pick_category='r16'`).get()) {
    const r16Teams = db.prepare(`
      SELECT CASE WHEN home_score > away_score THEN home_team ELSE away_team END AS winner
      FROM matches WHERE phase='r32' AND status='FINISHED'
    `).all().map(r => r.winner);
    db.prepare(`INSERT OR REPLACE INTO bonus_outcomes (pick_category, actual_teams_json) VALUES ('r16',?)`).run(JSON.stringify(r16Teams));
    db.prepare(`UPDATE bonus_picks SET locked=1 WHERE pick_type LIKE 'r16_team_%'`).run();
    scorePhaseBonus('r16');
  }

  // Champion + runner-up from final
  const finalMatch = db.prepare(`SELECT * FROM matches WHERE phase='final' AND status='FINISHED'`).get();
  if (finalMatch && !db.prepare(`SELECT 1 FROM bonus_outcomes WHERE pick_category='champion'`).get()) {
    const champion = finalMatch.home_score > finalMatch.away_score ? finalMatch.home_team : finalMatch.away_team;
    const runnerUp = finalMatch.home_score > finalMatch.away_score ? finalMatch.away_team : finalMatch.home_team;
    db.prepare(`INSERT OR REPLACE INTO bonus_outcomes (pick_category, actual_teams_json) VALUES ('champion',?)`).run(JSON.stringify([champion]));
    db.prepare(`INSERT OR REPLACE INTO bonus_outcomes (pick_category, actual_teams_json) VALUES ('runner_up',?)`).run(JSON.stringify([runnerUp]));
    db.prepare(`UPDATE bonus_picks SET locked=1 WHERE pick_type='champion' OR pick_type='runner_up'`).run();
    scorePhaseBonus('champion');
    scorePhaseBonus('runner_up');
  }

  // 3rd + 4th place from 3rd-place match
  const match3 = db.prepare(`SELECT * FROM matches WHERE phase='3rd_place' AND status='FINISHED'`).get();
  if (match3 && !db.prepare(`SELECT 1 FROM bonus_outcomes WHERE pick_category='third_place'`).get()) {
    const third  = match3.home_score > match3.away_score ? match3.home_team : match3.away_team;
    const fourth = match3.home_score > match3.away_score ? match3.away_team : match3.home_team;
    db.prepare(`INSERT OR REPLACE INTO bonus_outcomes (pick_category, actual_teams_json) VALUES ('third_place',?)`).run(JSON.stringify([third]));
    db.prepare(`INSERT OR REPLACE INTO bonus_outcomes (pick_category, actual_teams_json) VALUES ('fourth_place',?)`).run(JSON.stringify([fourth]));
    db.prepare(`UPDATE bonus_picks SET locked=1 WHERE pick_type='third_place' OR pick_type='fourth_place'`).run();
    scorePhaseBonus('third_place');
    scorePhaseBonus('fourth_place');
  }
}

async function triggerPoll() { return pollCycle(); }

function startPoller() {
  pollCycle().catch(console.error);
  _timer = setInterval(() => pollCycle().catch(console.error), POLL_INTERVAL_MS);
  console.log('[poller] started — polling every 5 min');
}

function stopPoller() {
  if (_timer) { clearInterval(_timer); _timer = null; }
}

module.exports = { startPoller, stopPoller, triggerPoll };
