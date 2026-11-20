CREATE TABLE story_players (
  id TEXT PRIMARY KEY
) WITHOUT ROWID;

ALTER TABLE rank_players ADD COLUMN browser_id TEXT;
