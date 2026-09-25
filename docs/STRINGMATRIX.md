# docs/STRINGMATRIX.md — Global

| Schlüssel | Bedeutung | Besitzer |
|-----------|-----------|----------|
| `sim_version` | Version der Sim (Snapshot-Hash, Kampf-Hash) — in jedem Snapshot + Validierung | contracts |
| `VERSION` | Repo-Version (X.Y.Z, PATCH 0..99 → MINOR 0..99 → MAJOR), Single Source of Truth | root |
| `VERSION/bump` | Mechanischer Bump via `scripts/bump-version.mjs` + amend + auto-push | shinon |
| `proto/upload` | Upload-Payload: `dungeon`, `team`, `tactics` | sync/net |
| `proto/results` | Results-Payload: `token`, `floor`, `hash`, `summary` | sync/net |
| `proto/match` | Match-Antwort: `seed`, `snapshot`, `floor` | matchmaking |
| `error/blocked` | Ziel lokal gesperrt (7T) | matchmaking |
| `error/invalid-hash` | Replay-Hash mismatch | sync |
| `error/protected` | Defender global geschützt (alle Moral 0) | sync |

Platzhalter-Konstanten (Balancing, später `contracts/balance.ts`): `MAX_FLOORS=5..10`, `RECOVERY_H=1..12`, `LOCK_DAYS=7`, `WORKER_FACTOR`.
