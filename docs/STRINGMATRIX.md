# docs/STRINGMATRIX.md — Global

| Schlüssel | Bedeutung | Besitzer |
|-----------|-----------|----------|
| `sim_version` | Version der Sim (Snapshot-Hash, Kampf-Hash) — in jedem Snapshot + Validierung | contracts |
| `VERSION` | Repo-Version (X.Y.Z, PATCH 0..99 → MINOR 0..99 → MAJOR), Single Source of Truth | root |
| `VERSION/bump` | Mechanischer Bump via `scripts/bump-version.mjs` + amend + auto-push | shinon |
| `proto/upload` | Contract-v3-Upload: vollständiger `RaidSnapshot` plus `tactics` | sync/net |
| `proto/results` | Results-Payload: `token`, `floor`, `hash`, typisierte `summary` | sync/net |
| `proto/log` | Ergebnislog als eigenes Artefakt: `token`, `floor`, `hash`, `log` inkl. `trail` | sync/net |
| `proto/match` | Match-Antwort: `seed`, `floor`, vollständiger `RaidSnapshot` als Ziel | matchmaking |
| `error/blocked` | Ziel lokal für den Angreifer gesperrt (Dauer offen) oder Route ohne Zugang | matchmaking/sync |
| `error/invalid-hash` | Replay-Hash oder Trail weicht vom serialisierten Log ab | sync |
| `error/invalid-request` | Snapshot, Taktiken oder Payload verletzen den Contract | sync |
| `error/protected` | Defender global geschützt (alle Moral 0) | sync |
| `error/timeout` | Auftragsfrist abgelaufen; ausschließlich bei `job/status = expired` | sync/db |
| `job/status` | `accepted`, `queued`, `running`, `completed`, `failed`, `expired` | contracts |
| `job/ttl` | 15 Minuten; Kampf-Timeout ist davon getrennt (`summary.stage`) | contracts |
| `agent/critical-adversarial-reviewer` | Schreibgeschützter Tree-/Diff-Review; meldet ausschließlich belegte Governance-, KI-Code-, Contract- oder Scope-Befunde | root |
| `agent/berater` | Schreibgeschützte Second-Opinion zu Idee, Diff oder Gate-Ausgabe; antwortet kurz und zynisch, ändert nichts | root |

Die Fehlercodes und Auftragsstatus werden seit T1.3 von `packages/contracts` definiert. Server, D1, Client und lokale Fixture-Ausführung lesen dieselbe Quelle; freie Strings sind nicht mehr zulässig. `combat/trail` (x/y/cell je Schritt) fließt seit T1.1 in den Kampf-Hash.

Balancing-Konstanten sind offen. Werte wie `MAX_FLOORS`, `RECOVERY_H`, `LOCK_DAYS` oder `WORKER_FACTOR` sind KI-Vorschläge und keine Festlegung.
