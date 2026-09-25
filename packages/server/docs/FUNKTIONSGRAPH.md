# packages/server/docs/FUNKTIONSGRAPH.md

```text
contracts:RaidSnapshot → db:validate → db:atomic-commit
db:atomic-commit → D1 raid_snapshots(attacker freeze) + raid_jobs(accepted)
raid_jobs.snapshot_id → unveränderlicher Angreifer-Freeze
raid_jobs.target_snapshot_id: NULL → späterer Ziel-Freeze (Matching noch nicht implementiert)
db:transition → D1 bedingtes Status-Update
db:expire → D1 expired/timeout
sync/http/queue → db (später)
headless/replay → db:completed|failed (später)
```

`db` besitzt Persistenz und Zustandsautomat. `sync`, `matchmaking`, Queue und Headless-Combat besitzen im aktuellen Pass keine Implementierung und keine Umgehung dieser Grenzen.
