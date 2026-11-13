CREATE TABLE rank_players (
  id TEXT PRIMARY KEY,
  nickname TEXT NOT NULL,
  token_hash TEXT NOT NULL UNIQUE
);

CREATE TABLE rank_runs (
  id TEXT PRIMARY KEY,
  player_id TEXT NOT NULL REFERENCES rank_players(id),
  week TEXT NOT NULL,
  route TEXT NOT NULL CHECK (route IN ('arrival','worker','heir','system')),
  attempt INTEGER NOT NULL CHECK (attempt BETWEEN 1 AND 3),
  state TEXT NOT NULL,
  round INTEGER NOT NULL DEFAULT 0 CHECK (round BETWEEN 0 AND 3),
  score INTEGER CHECK (score BETWEEN 0 AND 100),
  last_request TEXT,
  UNIQUE (player_id, week, route, attempt),
  CHECK ((round = 3) = (score IS NOT NULL))
);

CREATE UNIQUE INDEX rank_single_active ON rank_runs (player_id, week, route) WHERE score IS NULL;
CREATE INDEX rank_results ON rank_runs (week, route, player_id, score) WHERE score IS NOT NULL;
