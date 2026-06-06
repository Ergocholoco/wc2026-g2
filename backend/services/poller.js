const { query } = require('../db/schema');
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
        await query(`
          UPDATE matches SET status = $1, fd_match_id = COALESCE(fd_match_id, $2)
          WHERE fd_match_id = $3 OR (
            home_team = $4 AND away_team = $5 AND substr(kickoff_utc,1,10) = substr($6,1,10)
          )
        `, [m.status, m.id, m.id, m.homeTeam.tla, m.awayTeam.tla, m.utcDate]);
      }
      continue;
    }

    const score = m.score?.fullTime;
    if (score?.home == null || score?.away == null) continue;

    let dbMatch = (await query('SELECT * FROM matches WHERE fd_match_id = $1', [m.id])).rows[0];
    if (!dbMatch) {
      dbMatch = (await query(`
        SELECT * FROM matches
        WHERE home_team = $1 AND away_team = $2 AND substr(kickoff_utc,1,10) = substr($3,1,10)
      `, [m.homeTeam.tla, m.awayTeam.tla, m.utcDate])).rows[0];
    }
    if (!dbMatch) continue;

    if (dbMatch.status === 'FINISHED' && dbMatch.home_score != null) continue;

    await query(`
      UPDATE matches SET status='FINISHED', home_score=$1, away_score=$2, fd_match_id=$3
      WHERE id=$4
    `, [score.home, score.away, m.id, dbMatch.id]);

    await query(`UPDATE predictions SET locked=1 WHERE match_id=$1`, [dbMatch.id]);

    finishedMatchIds.add(dbMatch.id);
  }

  if (finishedMatchIds.size === 0) return;

  const ids = [...finishedMatchIds];
  const placeholders = ids.map((_, i) => `$${i + 1}`).join(',');
  const { rows: affectedPlayers } = await query(
    `SELECT DISTINCT player_id FROM predictions WHERE match_id IN (${placeholders})`,
    ids
  );

  for (const { player_id } of affectedPlayers) await refreshPlayerScore(player_id);

  await scoreGroupBonusIfComplete();
  await scoreKnockoutBonusIfComplete();
}

async function scoreGroupBonusIfComplete() {
  const groups = ['a','b','c','d','e','f','g','h','i','j','k','l'];
  for (const g of groups) {
    const phase = `group_${g}`;
    const { rows } = await query(`
      SELECT COUNT(*)::int AS total,
             SUM(CASE WHEN status='FINISHED' THEN 1 ELSE 0 END)::int AS finished
      FROM matches WHERE phase=$1
    `, [phase]);
    const { total, finished } = rows[0];
    if (total === 0 || finished < total) continue;

    const alreadyScored = (await query(
      `SELECT 1 FROM bonus_outcomes WHERE pick_category=$1`,
      [`group_${g}_1st`]
    )).rows[0];
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

    await query(`INSERT INTO bonus_outcomes (pick_category, actual_teams_json) VALUES ($1,$2)
                 ON CONFLICT (pick_category) DO UPDATE SET actual_teams_json = EXCLUDED.actual_teams_json`,
                 [`group_${g}_1st`, JSON.stringify([first])]);
    await query(`INSERT INTO bonus_outcomes (pick_category, actual_teams_json) VALUES ($1,$2)
                 ON CONFLICT (pick_category) DO UPDATE SET actual_teams_json = EXCLUDED.actual_teams_json`,
                 [`group_${g}_2nd`, JSON.stringify([second])]);
    await query(`UPDATE bonus_picks SET locked=1 WHERE pick_type=$1 OR pick_type=$2`, [`group_${g}_1st`, `group_${g}_2nd`]);
    await scorePhaseBonus(`group_${g}_1st`);
    await scorePhaseBonus(`group_${g}_2nd`);
  }
}

async function scoreKnockoutBonusIfComplete() {
  if ((process.env.SCORING_MODE || 'standard') === 'advanced') {
    return scoreAdvancedBonusIfComplete();
  }

  const phases = [
    { dbPhase: 'r16',       bonusCategory: 'quarterfinalists', matchCount: 8 },
    { dbPhase: 'qf',        bonusCategory: 'semifinalists',    matchCount: 4 },
    { dbPhase: 'sf',        bonusCategory: 'finalists',        matchCount: 2 },
    { dbPhase: 'final',     bonusCategory: 'champion',         matchCount: 1 },
    { dbPhase: '3rd_place', bonusCategory: 'third_place',      matchCount: 1 },
  ];

  for (const { dbPhase, bonusCategory, matchCount } of phases) {
    const { rows: finishedRows } = await query(
      `SELECT SUM(CASE WHEN status='FINISHED' THEN 1 ELSE 0 END)::int AS finished FROM matches WHERE phase=$1`,
      [dbPhase]
    );
    const finished = finishedRows[0].finished;
    if ((finished || 0) < matchCount) continue;

    const alreadyScored = (await query(
      `SELECT 1 FROM bonus_outcomes WHERE pick_category=$1`,
      [bonusCategory]
    )).rows[0];
    if (alreadyScored) continue;

    const { rows: winnerRows } = await query(`
      SELECT CASE WHEN home_score > away_score THEN home_team ELSE away_team END AS winner
      FROM matches WHERE phase=$1 AND status='FINISHED'
    `, [dbPhase]);
    const winners = winnerRows.map(r => r.winner);

    const teamCodes = ['champion', 'third_place'].includes(bonusCategory)
      ? [winners[0]] : winners;

    await query(`INSERT INTO bonus_outcomes (pick_category, actual_teams_json) VALUES ($1,$2)
                 ON CONFLICT (pick_category) DO UPDATE SET actual_teams_json = EXCLUDED.actual_teams_json`,
                 [bonusCategory, JSON.stringify(teamCodes)]);
    await query(`UPDATE bonus_picks SET locked=1 WHERE pick_type LIKE $1`, [
      bonusCategory === 'champion' ? 'champion' :
      bonusCategory === 'third_place' ? 'third_place' :
      `${bonusCategory.replace(/s$/, '')}_%`
    ]);
    await scorePhaseBonus(bonusCategory);
  }
}

async function scoreAdvancedBonusIfComplete() {
  // R16 teams: winners of all 16 R32 matches
  const r32Finished = (await query(
    `SELECT SUM(CASE WHEN status='FINISHED' THEN 1 ELSE 0 END)::int AS c FROM matches WHERE phase='r32'`
  )).rows[0].c || 0;
  const r16Scored = (await query(`SELECT 1 FROM bonus_outcomes WHERE pick_category='r16'`)).rows[0];
  if (r32Finished >= 16 && !r16Scored) {
    const { rows: winnerRows } = await query(`
      SELECT CASE WHEN home_score > away_score THEN home_team ELSE away_team END AS winner
      FROM matches WHERE phase='r32' AND status='FINISHED'
    `);
    const r16Teams = winnerRows.map(r => r.winner);
    await query(`INSERT INTO bonus_outcomes (pick_category, actual_teams_json) VALUES ('r16',$1)
                 ON CONFLICT (pick_category) DO UPDATE SET actual_teams_json = EXCLUDED.actual_teams_json`,
                 [JSON.stringify(r16Teams)]);
    await query(`UPDATE bonus_picks SET locked=1 WHERE pick_type LIKE 'r16_team_%'`);
    await scorePhaseBonus('r16');
  }

  // Champion + runner-up from final
  const finalMatch = (await query(`SELECT * FROM matches WHERE phase='final' AND status='FINISHED'`)).rows[0];
  const championScored = (await query(`SELECT 1 FROM bonus_outcomes WHERE pick_category='champion'`)).rows[0];
  if (finalMatch && !championScored) {
    const champion = finalMatch.home_score > finalMatch.away_score ? finalMatch.home_team : finalMatch.away_team;
    const runnerUp = finalMatch.home_score > finalMatch.away_score ? finalMatch.away_team : finalMatch.home_team;
    await query(`INSERT INTO bonus_outcomes (pick_category, actual_teams_json) VALUES ('champion',$1)
                 ON CONFLICT (pick_category) DO UPDATE SET actual_teams_json = EXCLUDED.actual_teams_json`,
                 [JSON.stringify([champion])]);
    await query(`INSERT INTO bonus_outcomes (pick_category, actual_teams_json) VALUES ('runner_up',$1)
                 ON CONFLICT (pick_category) DO UPDATE SET actual_teams_json = EXCLUDED.actual_teams_json`,
                 [JSON.stringify([runnerUp])]);
    await query(`UPDATE bonus_picks SET locked=1 WHERE pick_type='champion' OR pick_type='runner_up'`);
    await scorePhaseBonus('champion');
    await scorePhaseBonus('runner_up');
  }

  // 3rd + 4th place from 3rd-place match
  const match3 = (await query(`SELECT * FROM matches WHERE phase='3rd_place' AND status='FINISHED'`)).rows[0];
  const thirdScored = (await query(`SELECT 1 FROM bonus_outcomes WHERE pick_category='third_place'`)).rows[0];
  if (match3 && !thirdScored) {
    const third  = match3.home_score > match3.away_score ? match3.home_team : match3.away_team;
    const fourth = match3.home_score > match3.away_score ? match3.away_team : match3.home_team;
    await query(`INSERT INTO bonus_outcomes (pick_category, actual_teams_json) VALUES ('third_place',$1)
                 ON CONFLICT (pick_category) DO UPDATE SET actual_teams_json = EXCLUDED.actual_teams_json`,
                 [JSON.stringify([third])]);
    await query(`INSERT INTO bonus_outcomes (pick_category, actual_teams_json) VALUES ('fourth_place',$1)
                 ON CONFLICT (pick_category) DO UPDATE SET actual_teams_json = EXCLUDED.actual_teams_json`,
                 [JSON.stringify([fourth])]);
    await query(`UPDATE bonus_picks SET locked=1 WHERE pick_type='third_place' OR pick_type='fourth_place'`);
    await scorePhaseBonus('third_place');
    await scorePhaseBonus('fourth_place');
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
