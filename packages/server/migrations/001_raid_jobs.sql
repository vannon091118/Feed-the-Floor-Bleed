PRAGMA foreign_keys = ON;

CREATE TABLE raid_snapshots (
  id TEXT PRIMARY KEY,
  request_key TEXT UNIQUE,
  sim_version TEXT NOT NULL,
  payload_json TEXT NOT NULL CHECK (json_valid(payload_json)),
  created_at INTEGER NOT NULL CHECK (created_at >= 0)
) STRICT;

CREATE TRIGGER raid_snapshots_immutable_update
BEFORE UPDATE ON raid_snapshots
BEGIN
  SELECT RAISE(ABORT, 'raid snapshots are immutable');
END;

CREATE TRIGGER raid_snapshots_immutable_delete
BEFORE DELETE ON raid_snapshots
BEGIN
  SELECT RAISE(ABORT, 'raid snapshots are immutable');
END;

CREATE TABLE raid_jobs (
  id TEXT PRIMARY KEY,
  snapshot_id TEXT NOT NULL UNIQUE REFERENCES raid_snapshots(id),
  target_snapshot_id TEXT UNIQUE REFERENCES raid_snapshots(id),
  attacker_id TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('accepted', 'queued', 'running', 'completed', 'failed', 'expired')),
  created_at INTEGER NOT NULL CHECK (created_at >= 0),
  updated_at INTEGER NOT NULL CHECK (updated_at >= created_at),
  expires_at INTEGER NOT NULL CHECK (expires_at = created_at + 900000),
  result_json TEXT CHECK (
    result_json IS NULL OR (json_valid(result_json) AND json_type(result_json) = 'object')
  ),
  failure_code TEXT,
  revision INTEGER NOT NULL DEFAULT 1 CHECK (revision > 0),
  CHECK (
    (status IN ('accepted', 'queued', 'running') AND result_json IS NULL AND failure_code IS NULL)
    OR (status = 'completed' AND result_json IS NOT NULL AND failure_code IS NULL)
    OR (status = 'failed' AND result_json IS NULL AND failure_code IS NOT NULL)
    OR (status = 'expired' AND result_json IS NULL AND failure_code = 'timeout')
  )
) STRICT;

CREATE TRIGGER raid_jobs_target_snapshot_immutable
BEFORE UPDATE OF target_snapshot_id ON raid_jobs
WHEN OLD.target_snapshot_id IS NOT NULL
BEGIN
  SELECT RAISE(ABORT, 'raid job target snapshot is immutable');
END;

CREATE TRIGGER raid_jobs_valid_status_transition
BEFORE UPDATE OF status ON raid_jobs
WHEN NOT (
  (OLD.status = 'accepted' AND NEW.status IN ('queued', 'failed', 'expired'))
  OR (OLD.status = 'queued' AND NEW.status IN ('running', 'failed', 'expired'))
  OR (OLD.status = 'running' AND NEW.status IN ('completed', 'failed', 'expired'))
)
BEGIN
  SELECT RAISE(ABORT, 'invalid job status transition');
END;

CREATE UNIQUE INDEX raid_jobs_one_open_per_attacker
ON raid_jobs(attacker_id)
WHERE status IN ('accepted', 'queued', 'running');

CREATE INDEX raid_jobs_expiration_sweep
ON raid_jobs(status, expires_at);
