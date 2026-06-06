const Database = require('better-sqlite3');
const { _setDb, _initSchema } = require('../db/schema');
const {
  scoreMatchPrediction,
  bonusPointsForType,
  refreshPlayerScore,
  scorePhaseBonus,
} = require('../services/scorer');

let db;

beforeEach(() => {
  db = new Database(':memory:');
  db.pragma('foreign_keys = ON');
  _initSchema(db);
  _setDb(db);
});

// --- scoreMatchPrediction ---
describe('scoreMatchPrediction', () => {
  it('returns 0 for wrong result', () => {
    expect(scoreMatchPrediction(1, 0, 0, 1)).toBe(0); // predicted home win, actual away win
  });

  it('returns 3 for correct result only', () => {
    expect(scoreMatchPrediction(2, 0, 1, 0)).toBe(3); // both home wins, different scores
  });

  it('returns 3 for correct draw result', () => {
    expect(scoreMatchPrediction(1, 1, 2, 2)).toBe(3); // both draws
  });

  it('returns 11 for exact score', () => {
    expect(scoreMatchPrediction(2, 1, 2, 1)).toBe(11); // 3 + 8
  });

  it('returns 0 for correct score but wrong result is impossible by definition', () => {
    // 1-1 predicted vs 1-1 actual = draw, 11 pts
    expect(scoreMatchPrediction(1, 1, 1, 1)).toBe(11);
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
  beforeEach(() => {
    db.prepare("INSERT INTO matches (id,phase,match_day,home_team,away_team,kickoff_utc,kickoff_mt,home_score,away_score,status) VALUES (1,'group_a',1,'MEX','ECU','2026-06-11T23:00:00Z','Jun 11, 5:00 PM MT',2,1,'FINISHED')").run();
    db.prepare("INSERT INTO players (id,name,access_code) VALUES (1,'Alice','aaa')").run();
    db.prepare("INSERT INTO scores_cache (player_id,total_points,match_points,bonus_points) VALUES (1,0,0,0)").run();
  });

  it('scores 11 pts for exact prediction', () => {
    db.prepare("INSERT INTO predictions (player_id,match_id,home_score,away_score,locked) VALUES (1,1,2,1,1)").run();
    refreshPlayerScore(1);
    const row = db.prepare('SELECT * FROM scores_cache WHERE player_id=1').get();
    expect(row.match_points).toBe(11);
    expect(row.total_points).toBe(11);
  });

  it('scores 3 pts for correct result only', () => {
    db.prepare("INSERT INTO predictions (player_id,match_id,home_score,away_score,locked) VALUES (1,1,3,0,1)").run();
    refreshPlayerScore(1);
    const row = db.prepare('SELECT * FROM scores_cache WHERE player_id=1').get();
    expect(row.match_points).toBe(3);
  });

  it('scores 0 for unlocked predictions', () => {
    db.prepare("INSERT INTO predictions (player_id,match_id,home_score,away_score,locked) VALUES (1,1,2,1,0)").run();
    refreshPlayerScore(1);
    const row = db.prepare('SELECT * FROM scores_cache WHERE player_id=1').get();
    expect(row.match_points).toBe(0);
  });
});

// --- scorePhaseBonus ---
describe('scorePhaseBonus', () => {
  beforeEach(() => {
    db.prepare("INSERT INTO players (id,name,access_code) VALUES (1,'Alice','aaa')").run();
    db.prepare("INSERT INTO scores_cache (player_id,total_points,match_points,bonus_points) VALUES (1,0,0,0)").run();
  });

  it('awards champion points when player picked correct team', () => {
    db.prepare("INSERT INTO bonus_picks (player_id,pick_type,team_code,locked) VALUES (1,'champion','BRA',1)").run();
    db.prepare("INSERT INTO bonus_outcomes (pick_category,actual_teams_json) VALUES ('champion','[\"BRA\"]')").run();
    scorePhaseBonus('champion');
    const row = db.prepare('SELECT * FROM scores_cache WHERE player_id=1').get();
    expect(row.bonus_points).toBe(25);
    expect(row.total_points).toBe(25);
  });

  it('awards 0 for wrong champion pick', () => {
    db.prepare("INSERT INTO bonus_picks (player_id,pick_type,team_code,locked) VALUES (1,'champion','ARG',1)").run();
    db.prepare("INSERT INTO bonus_outcomes (pick_category,actual_teams_json) VALUES ('champion','[\"BRA\"]')").run();
    scorePhaseBonus('champion');
    const row = db.prepare('SELECT * FROM scores_cache WHERE player_id=1').get();
    expect(row.bonus_points).toBe(0);
  });
});
