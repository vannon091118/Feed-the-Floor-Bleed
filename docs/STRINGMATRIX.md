# docs/STRINGMATRIX.md — Global

| Schlüssel | Bedeutung | Besitzer |
|-----------|-----------|----------|
| `sim_version` | Version der Sim (Snapshot-Hash, Kampf-Hash) — in jedem Snapshot + Validierung | contracts |
| `VERSION` | Repo-Version (X.Y.Z, PATCH 0..99 → MINOR 0..99 → MAJOR), Single Source of Truth | root |
| `VERSION/bump` | Mechanischer Bump via `scripts/bump-version.mjs` + amend + auto-push | shinon |
| `proto/upload` | Contract-v2-Upload: vollständiger `RaidSnapshot` plus `tactics` | sync/net |
| `proto/results` | Results-Payload: `token`, `floor`, `hash`, `summary` | sync/net |
| `proto/match` | Match-Antwort: `seed`, `floor`, vollständiger `RaidSnapshot` als Ziel | matchmaking |
| `error/blocked` | Ziel lokal für den Angreifer gesperrt (Dauer offen) | matchmaking |
| `error/invalid-hash` | Replay-Hash mismatch | sync |
| `error/protected` | Defender global geschützt (alle Moral 0) | sync |

Balancing-Konstanten sind offen. Werte wie `MAX_FLOORS`, `RECOVERY_H`, `LOCK_DAYS` oder `WORKER_FACTOR` sind KI-Vorschläge und keine Festlegung.
