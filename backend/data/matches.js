// PLACEHOLDER — run scripts/fetch-schedule.js once a valid FOOTBALL_API_KEY is available
// WC 2026: 48 teams, 12 groups (A–L), 104 total matches
// Kickoff times are approximate MT (Mountain Time, UTC-6 during MDT)
const MATCHES = [
  // ── GROUP A (USA, host group) ──
  { "id": 1, "phase": "group_a", "match_day": 1, "home_team": "MEX", "away_team": "POL", "kickoff_utc": "2026-06-11T23:00:00Z", "kickoff_mt": "Jun 11, 5:00 PM MT", "fd_match_id": null },
  { "id": 2, "phase": "group_a", "match_day": 1, "home_team": "USA", "away_team": "SRB", "kickoff_utc": "2026-06-12T02:00:00Z", "kickoff_mt": "Jun 11, 8:00 PM MT", "fd_match_id": null },
  { "id": 3, "phase": "group_a", "match_day": 2, "home_team": "POL", "away_team": "USA", "kickoff_utc": "2026-06-16T23:00:00Z", "kickoff_mt": "Jun 16, 5:00 PM MT", "fd_match_id": null },
  { "id": 4, "phase": "group_a", "match_day": 2, "home_team": "SRB", "away_team": "MEX", "kickoff_utc": "2026-06-17T02:00:00Z", "kickoff_mt": "Jun 16, 8:00 PM MT", "fd_match_id": null },
  { "id": 5, "phase": "group_a", "match_day": 3, "home_team": "USA", "away_team": "MEX", "kickoff_utc": "2026-06-21T02:00:00Z", "kickoff_mt": "Jun 20, 8:00 PM MT", "fd_match_id": null },
  { "id": 6, "phase": "group_a", "match_day": 3, "home_team": "SRB", "away_team": "POL", "kickoff_utc": "2026-06-21T02:00:00Z", "kickoff_mt": "Jun 20, 8:00 PM MT", "fd_match_id": null },

  // ── GROUP B ──
  { "id": 7, "phase": "group_b", "match_day": 1, "home_team": "ESP", "away_team": "CRO", "kickoff_utc": "2026-06-12T18:00:00Z", "kickoff_mt": "Jun 12, 12:00 PM MT", "fd_match_id": null },
  { "id": 8, "phase": "group_b", "match_day": 1, "home_team": "MAR", "away_team": "ARG", "kickoff_utc": "2026-06-12T21:00:00Z", "kickoff_mt": "Jun 12, 3:00 PM MT", "fd_match_id": null },
  { "id": 9, "phase": "group_b", "match_day": 2, "home_team": "CRO", "away_team": "MAR", "kickoff_utc": "2026-06-17T18:00:00Z", "kickoff_mt": "Jun 17, 12:00 PM MT", "fd_match_id": null },
  { "id": 10, "phase": "group_b", "match_day": 2, "home_team": "ARG", "away_team": "ESP", "kickoff_utc": "2026-06-17T21:00:00Z", "kickoff_mt": "Jun 17, 3:00 PM MT", "fd_match_id": null },
  { "id": 11, "phase": "group_b", "match_day": 3, "home_team": "ARG", "away_team": "CRO", "kickoff_utc": "2026-06-22T02:00:00Z", "kickoff_mt": "Jun 21, 8:00 PM MT", "fd_match_id": null },
  { "id": 12, "phase": "group_b", "match_day": 3, "home_team": "MAR", "away_team": "ESP", "kickoff_utc": "2026-06-22T02:00:00Z", "kickoff_mt": "Jun 21, 8:00 PM MT", "fd_match_id": null },

  // ── GROUP C ──
  { "id": 13, "phase": "group_c", "match_day": 1, "home_team": "BRA", "away_team": "SUI", "kickoff_utc": "2026-06-13T18:00:00Z", "kickoff_mt": "Jun 13, 12:00 PM MT", "fd_match_id": null },
  { "id": 14, "phase": "group_c", "match_day": 1, "home_team": "CAN", "away_team": "NGA", "kickoff_utc": "2026-06-13T21:00:00Z", "kickoff_mt": "Jun 13, 3:00 PM MT", "fd_match_id": null },
  { "id": 15, "phase": "group_c", "match_day": 2, "home_team": "SUI", "away_team": "CAN", "kickoff_utc": "2026-06-18T18:00:00Z", "kickoff_mt": "Jun 18, 12:00 PM MT", "fd_match_id": null },
  { "id": 16, "phase": "group_c", "match_day": 2, "home_team": "NGA", "away_team": "BRA", "kickoff_utc": "2026-06-18T21:00:00Z", "kickoff_mt": "Jun 18, 3:00 PM MT", "fd_match_id": null },
  { "id": 17, "phase": "group_c", "match_day": 3, "home_team": "BRA", "away_team": "CAN", "kickoff_utc": "2026-06-23T02:00:00Z", "kickoff_mt": "Jun 22, 8:00 PM MT", "fd_match_id": null },
  { "id": 18, "phase": "group_c", "match_day": 3, "home_team": "NGA", "away_team": "SUI", "kickoff_utc": "2026-06-23T02:00:00Z", "kickoff_mt": "Jun 22, 8:00 PM MT", "fd_match_id": null },

  // ── GROUP D ──
  { "id": 19, "phase": "group_d", "match_day": 1, "home_team": "FRA", "away_team": "URU", "kickoff_utc": "2026-06-13T23:00:00Z", "kickoff_mt": "Jun 13, 5:00 PM MT", "fd_match_id": null },
  { "id": 20, "phase": "group_d", "match_day": 1, "home_team": "GER", "away_team": "JPN", "kickoff_utc": "2026-06-14T02:00:00Z", "kickoff_mt": "Jun 13, 8:00 PM MT", "fd_match_id": null },
  { "id": 21, "phase": "group_d", "match_day": 2, "home_team": "URU", "away_team": "GER", "kickoff_utc": "2026-06-18T23:00:00Z", "kickoff_mt": "Jun 18, 5:00 PM MT", "fd_match_id": null },
  { "id": 22, "phase": "group_d", "match_day": 2, "home_team": "JPN", "away_team": "FRA", "kickoff_utc": "2026-06-19T02:00:00Z", "kickoff_mt": "Jun 18, 8:00 PM MT", "fd_match_id": null },
  { "id": 23, "phase": "group_d", "match_day": 3, "home_team": "FRA", "away_team": "GER", "kickoff_utc": "2026-06-23T22:00:00Z", "kickoff_mt": "Jun 23, 4:00 PM MT", "fd_match_id": null },
  { "id": 24, "phase": "group_d", "match_day": 3, "home_team": "JPN", "away_team": "URU", "kickoff_utc": "2026-06-23T22:00:00Z", "kickoff_mt": "Jun 23, 4:00 PM MT", "fd_match_id": null },

  // ── GROUP E ──
  { "id": 25, "phase": "group_e", "match_day": 1, "home_team": "ENG", "away_team": "TUN", "kickoff_utc": "2026-06-14T18:00:00Z", "kickoff_mt": "Jun 14, 12:00 PM MT", "fd_match_id": null },
  { "id": 26, "phase": "group_e", "match_day": 1, "home_team": "NED", "away_team": "SEN", "kickoff_utc": "2026-06-14T21:00:00Z", "kickoff_mt": "Jun 14, 3:00 PM MT", "fd_match_id": null },
  { "id": 27, "phase": "group_e", "match_day": 2, "home_team": "TUN", "away_team": "NED", "kickoff_utc": "2026-06-19T18:00:00Z", "kickoff_mt": "Jun 19, 12:00 PM MT", "fd_match_id": null },
  { "id": 28, "phase": "group_e", "match_day": 2, "home_team": "SEN", "away_team": "ENG", "kickoff_utc": "2026-06-19T21:00:00Z", "kickoff_mt": "Jun 19, 3:00 PM MT", "fd_match_id": null },
  { "id": 29, "phase": "group_e", "match_day": 3, "home_team": "ENG", "away_team": "NED", "kickoff_utc": "2026-06-24T02:00:00Z", "kickoff_mt": "Jun 23, 8:00 PM MT", "fd_match_id": null },
  { "id": 30, "phase": "group_e", "match_day": 3, "home_team": "SEN", "away_team": "TUN", "kickoff_utc": "2026-06-24T02:00:00Z", "kickoff_mt": "Jun 23, 8:00 PM MT", "fd_match_id": null },

  // ── GROUP F ──
  { "id": 31, "phase": "group_f", "match_day": 1, "home_team": "POR", "away_team": "KOR", "kickoff_utc": "2026-06-15T18:00:00Z", "kickoff_mt": "Jun 15, 12:00 PM MT", "fd_match_id": null },
  { "id": 32, "phase": "group_f", "match_day": 1, "home_team": "BEL", "away_team": "COL", "kickoff_utc": "2026-06-15T21:00:00Z", "kickoff_mt": "Jun 15, 3:00 PM MT", "fd_match_id": null },
  { "id": 33, "phase": "group_f", "match_day": 2, "home_team": "KOR", "away_team": "BEL", "kickoff_utc": "2026-06-20T18:00:00Z", "kickoff_mt": "Jun 20, 12:00 PM MT", "fd_match_id": null },
  { "id": 34, "phase": "group_f", "match_day": 2, "home_team": "COL", "away_team": "POR", "kickoff_utc": "2026-06-20T21:00:00Z", "kickoff_mt": "Jun 20, 3:00 PM MT", "fd_match_id": null },
  { "id": 35, "phase": "group_f", "match_day": 3, "home_team": "POR", "away_team": "BEL", "kickoff_utc": "2026-06-24T22:00:00Z", "kickoff_mt": "Jun 24, 4:00 PM MT", "fd_match_id": null },
  { "id": 36, "phase": "group_f", "match_day": 3, "home_team": "COL", "away_team": "KOR", "kickoff_utc": "2026-06-24T22:00:00Z", "kickoff_mt": "Jun 24, 4:00 PM MT", "fd_match_id": null },

  // ── GROUP G ──
  { "id": 37, "phase": "group_g", "match_day": 1, "home_team": "ITA", "away_team": "ECU", "kickoff_utc": "2026-06-15T23:00:00Z", "kickoff_mt": "Jun 15, 5:00 PM MT", "fd_match_id": null },
  { "id": 38, "phase": "group_g", "match_day": 1, "home_team": "AUS", "away_team": "SAU", "kickoff_utc": "2026-06-16T02:00:00Z", "kickoff_mt": "Jun 15, 8:00 PM MT", "fd_match_id": null },
  { "id": 39, "phase": "group_g", "match_day": 2, "home_team": "ECU", "away_team": "AUS", "kickoff_utc": "2026-06-20T23:00:00Z", "kickoff_mt": "Jun 20, 5:00 PM MT", "fd_match_id": null },
  { "id": 40, "phase": "group_g", "match_day": 2, "home_team": "SAU", "away_team": "ITA", "kickoff_utc": "2026-06-21T02:00:00Z", "kickoff_mt": "Jun 20, 8:00 PM MT", "fd_match_id": null },
  { "id": 41, "phase": "group_g", "match_day": 3, "home_team": "ITA", "away_team": "AUS", "kickoff_utc": "2026-06-25T02:00:00Z", "kickoff_mt": "Jun 24, 8:00 PM MT", "fd_match_id": null },
  { "id": 42, "phase": "group_g", "match_day": 3, "home_team": "SAU", "away_team": "ECU", "kickoff_utc": "2026-06-25T02:00:00Z", "kickoff_mt": "Jun 24, 8:00 PM MT", "fd_match_id": null },

  // ── GROUP H ──
  { "id": 43, "phase": "group_h", "match_day": 1, "home_team": "DEN", "away_team": "SUI", "kickoff_utc": "2026-06-16T18:00:00Z", "kickoff_mt": "Jun 16, 12:00 PM MT", "fd_match_id": null },
  { "id": 44, "phase": "group_h", "match_day": 1, "home_team": "CRC", "away_team": "GHA", "kickoff_utc": "2026-06-16T21:00:00Z", "kickoff_mt": "Jun 16, 3:00 PM MT", "fd_match_id": null },
  { "id": 45, "phase": "group_h", "match_day": 2, "home_team": "SUI", "away_team": "CRC", "kickoff_utc": "2026-06-21T18:00:00Z", "kickoff_mt": "Jun 21, 12:00 PM MT", "fd_match_id": null },
  { "id": 46, "phase": "group_h", "match_day": 2, "home_team": "GHA", "away_team": "DEN", "kickoff_utc": "2026-06-21T21:00:00Z", "kickoff_mt": "Jun 21, 3:00 PM MT", "fd_match_id": null },
  { "id": 47, "phase": "group_h", "match_day": 3, "home_team": "DEN", "away_team": "CRC", "kickoff_utc": "2026-06-25T22:00:00Z", "kickoff_mt": "Jun 25, 4:00 PM MT", "fd_match_id": null },
  { "id": 48, "phase": "group_h", "match_day": 3, "home_team": "GHA", "away_team": "SUI", "kickoff_utc": "2026-06-25T22:00:00Z", "kickoff_mt": "Jun 25, 4:00 PM MT", "fd_match_id": null },

  // ── GROUP I ──
  { "id": 49, "phase": "group_i", "match_day": 1, "home_team": "URU", "away_team": "PAR", "kickoff_utc": "2026-06-17T18:00:00Z", "kickoff_mt": "Jun 17, 12:00 PM MT", "fd_match_id": null },
  { "id": 50, "phase": "group_i", "match_day": 1, "home_team": "CMR", "away_team": "CHI", "kickoff_utc": "2026-06-17T21:00:00Z", "kickoff_mt": "Jun 17, 3:00 PM MT", "fd_match_id": null },
  { "id": 51, "phase": "group_i", "match_day": 2, "home_team": "PAR", "away_team": "CMR", "kickoff_utc": "2026-06-22T18:00:00Z", "kickoff_mt": "Jun 22, 12:00 PM MT", "fd_match_id": null },
  { "id": 52, "phase": "group_i", "match_day": 2, "home_team": "CHI", "away_team": "URU", "kickoff_utc": "2026-06-22T21:00:00Z", "kickoff_mt": "Jun 22, 3:00 PM MT", "fd_match_id": null },
  { "id": 53, "phase": "group_i", "match_day": 3, "home_team": "URU", "away_team": "CMR", "kickoff_utc": "2026-06-26T02:00:00Z", "kickoff_mt": "Jun 25, 8:00 PM MT", "fd_match_id": null },
  { "id": 54, "phase": "group_i", "match_day": 3, "home_team": "CHI", "away_team": "PAR", "kickoff_utc": "2026-06-26T02:00:00Z", "kickoff_mt": "Jun 25, 8:00 PM MT", "fd_match_id": null },

  // ── GROUP J ──
  { "id": 55, "phase": "group_j", "match_day": 1, "home_team": "EGY", "away_team": "TRI", "kickoff_utc": "2026-06-17T23:00:00Z", "kickoff_mt": "Jun 17, 5:00 PM MT", "fd_match_id": null },
  { "id": 56, "phase": "group_j", "match_day": 1, "home_team": "NZL", "away_team": "HON", "kickoff_utc": "2026-06-18T02:00:00Z", "kickoff_mt": "Jun 17, 8:00 PM MT", "fd_match_id": null },
  { "id": 57, "phase": "group_j", "match_day": 2, "home_team": "TRI", "away_team": "NZL", "kickoff_utc": "2026-06-22T23:00:00Z", "kickoff_mt": "Jun 22, 5:00 PM MT", "fd_match_id": null },
  { "id": 58, "phase": "group_j", "match_day": 2, "home_team": "HON", "away_team": "EGY", "kickoff_utc": "2026-06-23T02:00:00Z", "kickoff_mt": "Jun 22, 8:00 PM MT", "fd_match_id": null },
  { "id": 59, "phase": "group_j", "match_day": 3, "home_team": "EGY", "away_team": "NZL", "kickoff_utc": "2026-06-26T22:00:00Z", "kickoff_mt": "Jun 26, 4:00 PM MT", "fd_match_id": null },
  { "id": 60, "phase": "group_j", "match_day": 3, "home_team": "HON", "away_team": "TRI", "kickoff_utc": "2026-06-26T22:00:00Z", "kickoff_mt": "Jun 26, 4:00 PM MT", "fd_match_id": null },

  // ── GROUP K ──
  { "id": 61, "phase": "group_k", "match_day": 1, "home_team": "RSA", "away_team": "BOL", "kickoff_utc": "2026-06-18T18:00:00Z", "kickoff_mt": "Jun 18, 12:00 PM MT", "fd_match_id": null },
  { "id": 62, "phase": "group_k", "match_day": 1, "home_team": "IRN", "away_team": "JAM", "kickoff_utc": "2026-06-18T21:00:00Z", "kickoff_mt": "Jun 18, 3:00 PM MT", "fd_match_id": null },
  { "id": 63, "phase": "group_k", "match_day": 2, "home_team": "BOL", "away_team": "IRN", "kickoff_utc": "2026-06-23T18:00:00Z", "kickoff_mt": "Jun 23, 12:00 PM MT", "fd_match_id": null },
  { "id": 64, "phase": "group_k", "match_day": 2, "home_team": "JAM", "away_team": "RSA", "kickoff_utc": "2026-06-23T21:00:00Z", "kickoff_mt": "Jun 23, 3:00 PM MT", "fd_match_id": null },
  { "id": 65, "phase": "group_k", "match_day": 3, "home_team": "RSA", "away_team": "IRN", "kickoff_utc": "2026-06-27T02:00:00Z", "kickoff_mt": "Jun 26, 8:00 PM MT", "fd_match_id": null },
  { "id": 66, "phase": "group_k", "match_day": 3, "home_team": "JAM", "away_team": "BOL", "kickoff_utc": "2026-06-27T02:00:00Z", "kickoff_mt": "Jun 26, 8:00 PM MT", "fd_match_id": null },

  // ── GROUP L ──
  { "id": 67, "phase": "group_l", "match_day": 1, "home_team": "VEN", "away_team": "PER", "kickoff_utc": "2026-06-19T18:00:00Z", "kickoff_mt": "Jun 19, 12:00 PM MT", "fd_match_id": null },
  { "id": 68, "phase": "group_l", "match_day": 1, "home_team": "PAN", "away_team": "ALG", "kickoff_utc": "2026-06-19T21:00:00Z", "kickoff_mt": "Jun 19, 3:00 PM MT", "fd_match_id": null },
  { "id": 69, "phase": "group_l", "match_day": 2, "home_team": "PER", "away_team": "PAN", "kickoff_utc": "2026-06-24T18:00:00Z", "kickoff_mt": "Jun 24, 12:00 PM MT", "fd_match_id": null },
  { "id": 70, "phase": "group_l", "match_day": 2, "home_team": "ALG", "away_team": "VEN", "kickoff_utc": "2026-06-24T21:00:00Z", "kickoff_mt": "Jun 24, 3:00 PM MT", "fd_match_id": null },
  { "id": 71, "phase": "group_l", "match_day": 3, "home_team": "VEN", "away_team": "PAN", "kickoff_utc": "2026-06-27T22:00:00Z", "kickoff_mt": "Jun 27, 4:00 PM MT", "fd_match_id": null },
  { "id": 72, "phase": "group_l", "match_day": 3, "home_team": "ALG", "away_team": "PER", "kickoff_utc": "2026-06-27T22:00:00Z", "kickoff_mt": "Jun 27, 4:00 PM MT", "fd_match_id": null },

  // ── ROUND OF 32 (16 matches) ──
  { "id": 73, "phase": "r32", "match_day": 1, "home_team": "TBD", "away_team": "TBD", "kickoff_utc": "2026-06-30T18:00:00Z", "kickoff_mt": "Jun 30, 12:00 PM MT", "fd_match_id": null },
  { "id": 74, "phase": "r32", "match_day": 1, "home_team": "TBD", "away_team": "TBD", "kickoff_utc": "2026-06-30T21:00:00Z", "kickoff_mt": "Jun 30, 3:00 PM MT", "fd_match_id": null },
  { "id": 75, "phase": "r32", "match_day": 1, "home_team": "TBD", "away_team": "TBD", "kickoff_utc": "2026-07-01T18:00:00Z", "kickoff_mt": "Jul 1, 12:00 PM MT", "fd_match_id": null },
  { "id": 76, "phase": "r32", "match_day": 1, "home_team": "TBD", "away_team": "TBD", "kickoff_utc": "2026-07-01T21:00:00Z", "kickoff_mt": "Jul 1, 3:00 PM MT", "fd_match_id": null },
  { "id": 77, "phase": "r32", "match_day": 1, "home_team": "TBD", "away_team": "TBD", "kickoff_utc": "2026-07-02T18:00:00Z", "kickoff_mt": "Jul 2, 12:00 PM MT", "fd_match_id": null },
  { "id": 78, "phase": "r32", "match_day": 1, "home_team": "TBD", "away_team": "TBD", "kickoff_utc": "2026-07-02T21:00:00Z", "kickoff_mt": "Jul 2, 3:00 PM MT", "fd_match_id": null },
  { "id": 79, "phase": "r32", "match_day": 1, "home_team": "TBD", "away_team": "TBD", "kickoff_utc": "2026-07-03T18:00:00Z", "kickoff_mt": "Jul 3, 12:00 PM MT", "fd_match_id": null },
  { "id": 80, "phase": "r32", "match_day": 1, "home_team": "TBD", "away_team": "TBD", "kickoff_utc": "2026-07-03T21:00:00Z", "kickoff_mt": "Jul 3, 3:00 PM MT", "fd_match_id": null },
  { "id": 81, "phase": "r32", "match_day": 1, "home_team": "TBD", "away_team": "TBD", "kickoff_utc": "2026-07-04T18:00:00Z", "kickoff_mt": "Jul 4, 12:00 PM MT", "fd_match_id": null },
  { "id": 82, "phase": "r32", "match_day": 1, "home_team": "TBD", "away_team": "TBD", "kickoff_utc": "2026-07-04T21:00:00Z", "kickoff_mt": "Jul 4, 3:00 PM MT", "fd_match_id": null },
  { "id": 83, "phase": "r32", "match_day": 1, "home_team": "TBD", "away_team": "TBD", "kickoff_utc": "2026-07-05T18:00:00Z", "kickoff_mt": "Jul 5, 12:00 PM MT", "fd_match_id": null },
  { "id": 84, "phase": "r32", "match_day": 1, "home_team": "TBD", "away_team": "TBD", "kickoff_utc": "2026-07-05T21:00:00Z", "kickoff_mt": "Jul 5, 3:00 PM MT", "fd_match_id": null },
  { "id": 85, "phase": "r32", "match_day": 1, "home_team": "TBD", "away_team": "TBD", "kickoff_utc": "2026-07-06T18:00:00Z", "kickoff_mt": "Jul 6, 12:00 PM MT", "fd_match_id": null },
  { "id": 86, "phase": "r32", "match_day": 1, "home_team": "TBD", "away_team": "TBD", "kickoff_utc": "2026-07-06T21:00:00Z", "kickoff_mt": "Jul 6, 3:00 PM MT", "fd_match_id": null },
  { "id": 87, "phase": "r32", "match_day": 1, "home_team": "TBD", "away_team": "TBD", "kickoff_utc": "2026-07-07T18:00:00Z", "kickoff_mt": "Jul 7, 12:00 PM MT", "fd_match_id": null },
  { "id": 88, "phase": "r32", "match_day": 1, "home_team": "TBD", "away_team": "TBD", "kickoff_utc": "2026-07-07T21:00:00Z", "kickoff_mt": "Jul 7, 3:00 PM MT", "fd_match_id": null },

  // ── ROUND OF 16 (8 matches) ──
  { "id": 89, "phase": "r16", "match_day": 1, "home_team": "TBD", "away_team": "TBD", "kickoff_utc": "2026-07-10T18:00:00Z", "kickoff_mt": "Jul 10, 12:00 PM MT", "fd_match_id": null },
  { "id": 90, "phase": "r16", "match_day": 1, "home_team": "TBD", "away_team": "TBD", "kickoff_utc": "2026-07-10T21:00:00Z", "kickoff_mt": "Jul 10, 3:00 PM MT", "fd_match_id": null },
  { "id": 91, "phase": "r16", "match_day": 1, "home_team": "TBD", "away_team": "TBD", "kickoff_utc": "2026-07-11T18:00:00Z", "kickoff_mt": "Jul 11, 12:00 PM MT", "fd_match_id": null },
  { "id": 92, "phase": "r16", "match_day": 1, "home_team": "TBD", "away_team": "TBD", "kickoff_utc": "2026-07-11T21:00:00Z", "kickoff_mt": "Jul 11, 3:00 PM MT", "fd_match_id": null },
  { "id": 93, "phase": "r16", "match_day": 1, "home_team": "TBD", "away_team": "TBD", "kickoff_utc": "2026-07-12T18:00:00Z", "kickoff_mt": "Jul 12, 12:00 PM MT", "fd_match_id": null },
  { "id": 94, "phase": "r16", "match_day": 1, "home_team": "TBD", "away_team": "TBD", "kickoff_utc": "2026-07-12T21:00:00Z", "kickoff_mt": "Jul 12, 3:00 PM MT", "fd_match_id": null },
  { "id": 95, "phase": "r16", "match_day": 1, "home_team": "TBD", "away_team": "TBD", "kickoff_utc": "2026-07-13T18:00:00Z", "kickoff_mt": "Jul 13, 12:00 PM MT", "fd_match_id": null },
  { "id": 96, "phase": "r16", "match_day": 1, "home_team": "TBD", "away_team": "TBD", "kickoff_utc": "2026-07-13T21:00:00Z", "kickoff_mt": "Jul 13, 3:00 PM MT", "fd_match_id": null },

  // ── QUARTER-FINALS (4 matches) ──
  { "id": 97, "phase": "qf", "match_day": 1, "home_team": "TBD", "away_team": "TBD", "kickoff_utc": "2026-07-17T21:00:00Z", "kickoff_mt": "Jul 17, 3:00 PM MT", "fd_match_id": null },
  { "id": 98, "phase": "qf", "match_day": 1, "home_team": "TBD", "away_team": "TBD", "kickoff_utc": "2026-07-18T21:00:00Z", "kickoff_mt": "Jul 18, 3:00 PM MT", "fd_match_id": null },
  { "id": 99, "phase": "qf", "match_day": 1, "home_team": "TBD", "away_team": "TBD", "kickoff_utc": "2026-07-19T21:00:00Z", "kickoff_mt": "Jul 19, 3:00 PM MT", "fd_match_id": null },
  { "id": 100, "phase": "qf", "match_day": 1, "home_team": "TBD", "away_team": "TBD", "kickoff_utc": "2026-07-20T21:00:00Z", "kickoff_mt": "Jul 20, 3:00 PM MT", "fd_match_id": null },

  // ── SEMI-FINALS (2 matches) ──
  { "id": 101, "phase": "sf", "match_day": 1, "home_team": "TBD", "away_team": "TBD", "kickoff_utc": "2026-07-24T21:00:00Z", "kickoff_mt": "Jul 24, 3:00 PM MT", "fd_match_id": null },
  { "id": 102, "phase": "sf", "match_day": 1, "home_team": "TBD", "away_team": "TBD", "kickoff_utc": "2026-07-25T21:00:00Z", "kickoff_mt": "Jul 25, 3:00 PM MT", "fd_match_id": null },

  // ── THIRD PLACE ──
  { "id": 103, "phase": "3rd_place", "match_day": 1, "home_team": "TBD", "away_team": "TBD", "kickoff_utc": "2026-07-28T21:00:00Z", "kickoff_mt": "Jul 28, 3:00 PM MT", "fd_match_id": null },

  // ── FINAL ──
  { "id": 104, "phase": "final", "match_day": 1, "home_team": "TBD", "away_team": "TBD", "kickoff_utc": "2026-07-31T21:00:00Z", "kickoff_mt": "Jul 31, 3:00 PM MT", "fd_match_id": null }
];
module.exports = { MATCHES };
