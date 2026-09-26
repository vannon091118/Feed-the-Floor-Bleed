# packages/server/docs/FUNKTIONSGRAPH.md

```text
contracts:RaidSnapshot → db:validate → db:atomic-checkpoint
contracts:RAID_JOB_STATUSES + RAID_JOB_TRANSITIONS → db:job-state → db:raid-store
contracts:ErrorCodeSchema → db:assertFailureCode
db:atomic-checkpoint → D1 raid_snapshots(attacker freeze) + raid_jobs(accepted)
raid_jobs.snapshot_id → unveränderlicher Angreifer-Freeze
raid_jobs.target_snapshot_id: NULL → späterer Ziel-Freeze (Matching noch nicht implementiert)
db:transition → canTransitionRaidJob → D1 bedingtes Status-Update
db:expire → D1 expired/timeout
sim-core:runFixtureRaid → contracts:RaidJob (lokale Referenz, kein Serverpfad)
GET /api/health → worker → db:keine Abfrage (nur Bindings-Status)
POST /api/sync/checkpoint → worker → db:raid-store.checkpoint → D1
GET /api/sync/job/:id → worker → db:raid-store.getJob → D1
Assets (/ und /assets/*) → Asset-Kante, umgeht den Worker vollständig
sync/queue → db (später)
headless/replay → db:completed|failed (später)
```

`db` besitzt Persistenz und die Durchsetzung des Zustandsautomaten; die Definition des Automaten liegt in `@floor/contracts`. `worker` besitzt nur HTTP: Routen, Statuscodes, `Date.now()`. Es kennt keine Zustandslogik und umgeht keine dieser Grenzen. `sync`, `matchmaking`, Queue und Headless-Combat besitzen im aktuellen Pass keine Implementierung.
