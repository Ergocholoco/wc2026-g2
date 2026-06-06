const { newDb } = require('pg-mem');
const { _setPool, initSchema, query } = require('../db/schema');
const {
  scoreMatchPrediction,
  bonusPointsForType,
  refreshPlayerScore,
  scorePhaseBonus,
} = require('../services/scorer');

function registerSubstr(memDb) {
  memDb.public.registerFunction({
    name: 'substr',
    args: ['text', 'int', 'int'],
    returns: 'text',
    implementation: (s, a, b) => String(s).substr(a - 1, b),
  });
}

beforeEach(async () => {
  const memDb = newDb();
  registerSubstr(memDb);
  const { Pool } = memDb.adapters.createPg();
  _setPool(new Pool());
  await initSchema();
});

// --- scoreMatchPrediction (standard mode) ---
describe('scoreMatchPrediction — standard', () => {
  beforeEach(() => { process.env.SCORING_MODE = 'standard'; });
  afterEach(() => { delete process.env.SCORING_MODE; });

  it('returns 0 for wrong result', () => {
    expect(scoreMatchPrediction(1, 0, 0, 1)).toBe(0);
  });
  it('returns 2 for correct result only', () => {
    expect(scoreMatchPrediction(2, 0, 1, 0)).toBe(2);
  });
  it('returns 2 for correct draw result', () => {
    expect(scoreMatchPrediction(1, 1, 2, 2)).toBe(2);
  });
  it('returns 5 for exact score', () => {
    expect(scoreMatchPrediction(2, 1, 2, 1)).toBe(5);
  });
  it('returns 5 for exact draw score', () => {
    expect(scoreMatchPrediction(1, 1, 1, 1)).toBe(5);
  });
});

// --- scoreMatchPrediction (advanced mode) ---
describe('scoreMatchPrediction — advanced', () => {
  beforeEach(() => { process.env.SCORING_MODE = 'advanced'; });
  afterEach(() => { delete process.env.SCORING_MODE; });

  it('returns 0 for wrong result', () => {
    expect(scoreMatchPrediction(1, 0, 0, 1)).toBe(0);
  });
  it('returns 4 for correct outcome only', () => {
    expect(scoreMatchPrediction(3, 1, 1, 0)).toBe(4); // home win, neither goal matches
  });
  it('returns 6 for correct outcome + winner goals', () => {
    expect(scoreMatchPrediction(2, 0, 2, 1)).toBe(6); // winner score right (2), loser wrong
  });
  it('returns 6 for correct outcome + loser goals', () => {
    expect(scoreMatchPrediction(3, 1, 2, 1)).toBe(6); // loser score right (1), winner wrong
  });
  it('returns 8 for exact score (win)', () => {
    expect(scoreMatchPrediction(2, 1, 2, 1)).toBe(8);
  });
  it('returns 8 for exact draw score', () => {
    expect(scoreMatchPrediction(1, 1, 1, 1)).toBe(8);
  });
  it('returns 4 for correct draw, wrong goals', () => {
    expect(scoreMatchPrediction(0, 0, 1, 1)).toBe(4);
  });
  it('returns 4 for correct draw with wrong goals', () => {
    expect(scoreMatchPrediction(0, 0, 1, 1)).toBe(4); // both draws, goals all wrong
  });
});

// --- bonusPointsForType ---
describe('bonusPointsForType', () => {
  it.each([
    ['champion', 25],
    ['third_place', 12],
    ['finalist_1', 15],
    ['finalist_2', 15],
    ['semifinalist_3', 10],
    ['quarterfinalist_7', 6],
    ['group_a_1st', 4],
    ['group_l_2nd', 2],
  ])('%s → %d pts', (type, expected) => {
    expect(bonusPointsForType(type)).toBe(expected);
  });
});

// --- refreshPlayerScore ---
describe('refreshPlayerScore', () => {
  beforeEach(async () => {
    await query("INSERT INTO matches (id,phase,match_day,home_team,away_team,kickoff_utc,kickoff_mt,home_score,away_score,status) VALUES (1,'group_a',1,'MEX','ECU','2026-06-11T23:00:00Z','Jun 11, 5:00 PM MT',2,1,'FINISHED')");
    await query("INSERT INTO players (id,name,access_code) VALUES (1,'Alice','aaa')");
    await query("INSERT INTO scores_cache (player_id,total_points,match_points,bonus_points) VALUES (1,0,0,0)");
  });

  it('scores 5 pts for exact prediction', async () => {
    await query("INSERT INTO predictions (player_id,match_id,home_score,away_score,locked) VALUES (1,1,2,1,1)");
    await refreshPlayerScore(1);
    const { rows } = await query('SELECT * FROM scores_cache WHERE player_id=1');
    expect(rows[0].match_points).toBe(5);
    expect(rows[0].total_points).toBe(5);
  });

  it('scores 2 pts for correct result only', async () => {
    await query("INSERT INTO predictions (player_id,match_id,home_score,away_score,locked) VALUES (1,1,3,0,1)");
    await refreshPlayerScore(1);
    const { rows } = await query('SELECT * FROM scores_cache WHERE player_id=1');
    expect(rows[0].match_points).toBe(2);
  });

  it('scores 0 for unlocked predictions', async () => {
    await query("INSERT INTO predictions (player_id,match_id,home_score,away_score,locked) VALUES (1,1,2,1,0)");
    await refreshPlayerScore(1);
    const { rows } = await query('SELECT * FROM scores_cache WHERE player_id=1');
    expect(rows[0].match_points).toBe(0);
  });
});

// --- scorePhaseBonus ---
describe('scorePhaseBonus', () => {
  beforeEach(async () => {
    await query("INSERT INTO players (id,name,access_code) VALUES (1,'Alice','aaa')");
    await query("INSERT INTO scores_cache (player_id,total_points,match_points,bonus_points) VALUES (1,0,0,0)");
  });

  it('awards champion points when player picked correct team', async () => {
    await query("INSERT INTO bonus_picks (player_id,pick_type,team_code,locked) VALUES (1,'champion','BRA',1)");
    await query("INSERT INTO bonus_outcomes (pick_category,actual_teams_json) VALUES ('champion','[\"BRA\"]')");
    await scorePhaseBonus('champion');
    const { rows } = await query('SELECT * FROM scores_cache WHERE player_id=1');
    expect(rows[0].bonus_points).toBe(25);
    expect(rows[0].total_points).toBe(25);
  });

  it('awards 0 for wrong champion pick', async () => {
    await query("INSERT INTO bonus_picks (player_id,pick_type,team_code,locked) VALUES (1,'champion','ARG',1)");
    await query("INSERT INTO bonus_outcomes (pick_category,actual_teams_json) VALUES ('champion','[\"BRA\"]')");
    await scorePhaseBonus('champion');
    const { rows } = await query('SELECT * FROM scores_cache WHERE player_id=1');
    expect(rows[0].bonus_points).toBe(0);
  });
});
