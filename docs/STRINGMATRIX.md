# docs/STRINGMATRIX.md — Global

| Schlüssel | Bedeutung | Besitzer |
|-----------|-----------|----------|
| `sim_version` | Version der Sim (Snapshot-Hash, Kampf-Hash) — in jedem Snapshot + Validierung | contracts |
| `VERSION` | Repo-Version (X.Y.Z, PATCH 0..99 → MINOR 0..99 → MAJOR), Single Source of Truth | root |
| `VERSION/bump` | Next-Bump-Zähler via `scripts/bump-version.mjs`, Basis aus `origin/main`, Kollision wird verweigert; + amend + auto-push | shinon |
| `proto/upload` | Contract-v4-Upload: vollständiger `RaidSnapshot` plus `tactics` | sync/net |
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
| `sync/checkpoint` | Fortschrittspunkt, ab dem ein Raid-Upload als angekommen und unveränderlich gilt; `POST /api/sync/checkpoint`, HTTP 201 (neu) oder 200 (idempotent) | server/db |
| `sync/503` | `SYNC_NICHT_VERBUNDEN` ohne D1-Bindung; das Spiel läuft lokal weiter, es wird nichts gespeichert | server/worker |
| `deploy/worker` | `run_worker_first: ["/api/*"]`; Assets laufen an der Worker-Vorbeifahrt vorbei, Worker-Zeit nur bei Aufruf und Sync-Checkpoints | root |
| `agent/critical-adversarial-reviewer` | Schreibgeschützter Tree-/Diff-Review; meldet ausschließlich belegte Governance-, KI-Code-, Contract- oder Scope-Befunde | root |
| `agent/berater` | Schreibgeschützte Second-Opinion zu Idee, Diff oder Gate-Ausgabe; antwortet kurz und zynisch, ändert nichts | root |
| `governance/architecture` | Verbindliche Domain-, Ownership-, Datenwahrheits- und LOC-Regeln | root |
| `governance/documentation` | Pflichtdoku, Pflege, Hygiene-Gate und Historisierung | root |
| `governance/git` | Shinon, Commit-Text, Versionierung und Git-Lifecycle | root |
| `visual/fx-seed` | Stabiler Präsentationsseed aus Eventtyp, IDs, Tick, Indizes und Menge; keine Wirkung auf den Combat-Hash | client |
| `visual/route-markers` | Route-View liest `route.path` und rendert sparsames Highlight des aktiven Actors; kein Grid- oder Positionsbesitz | client |
| `visual/route-index` | Boundsafe `routePointAt(path, index)` wird von Actor-Frame, Event-FX und Leerlaufroute geteilt | client |
| `visual/actor-variant` | ID-basierte `actorVariant(id)` ist zwischen Leerlauf- und Combat-Actors identisch | client |
| `phase/state` | `'tag' \| 'night' \| 'raid' \| 'result'` — Schleifenreihenfolge, einziger Owner `village/state.ts` | client |
| `phase/transitions` | erlaubt: `tag→night`, `night→raid`, `raid→result`, `result→tag`, `result→raid`; jeder andere Übergang wird verworfen | client |
| `phase/day` | Zähler hoch bei `result→tag`, der Auftrag wird dabei gelöscht | client |
| `phase/actions` | `startNight`, `triggerRaid`, `completeRaid`, `finishResult`, `retryAfterResult` | client |
| `village/building-kind` | `'hall' \| 'guild' \| 'house' \| 'workshop'` — Union in `village/balance.ts`, von der Renderer-Seite entlehnt | client |
| `village/day-settlement` | `daySettlement: DaySettlement \| null` — Tag und Materialgutschrift, gesetzt nur im Übergang `result → tag` | client |
| `village/rejection` | `below-first-level`, `above-max-level`, `worker-capacity`, `not-wider`, `not-a-whole-step`, `below-start-columns`, `below-first-paid-floor`, `slot-out-of-range` — Regeln in `village/economy.ts` | client |
| `village/command` | `not-day-phase`, `not-buildable`, `not-affordable`, `unknown-building`, `not-a-cell`, `out-of-bounds`, `overlaps` — Kommandos in `village/commands.ts`, Platzierung in `village/plot.ts` | client |
| `balance/groups` | `start`, `buildings`, `workshop`, `workers`, `attraction`, `land`, `dungeon` — benannte Gruppen der eingefrorenen Dorfconfig | client |

Die Fehlercodes und Auftragsstatus werden seit T1.3 von `packages/contracts` definiert. Server, D1, Client und lokale Fixture-Ausführung lesen dieselbe Quelle; freie Strings sind nicht mehr zulässig. `combat/trail` (x/y/cell je Schritt) fließt seit T1.1 in den Kampf-Hash.

Balancing ist getrennt zu lesen. Die Dorf- und Slot-Werte sind seit dem 2026-09-28 freigegeben und stehen ausschließlich in `packages/client/src/village/balance.ts`; die Tabelle mit einer Grenzfallzeile je Wert steht in `docs/VISUAL_GRUNDSATZ.md`. Weiterhin `[K]` und ohne Code sind der Unique-Pool, die Roll-Gewichte der Boss-Drops, der Match-Stärkewert samt Band, die Kampfbalance und die Stärke-/Generations-Goldformel — bei Letzterer steht seit Contract v4 die Zahl der belegten Verteidiger als `CombatSummary.defendersTotal` bereit (Boss inklusive, gefallene Gegner daraus berechenbar); Stärke und Generation je Gegner führt kein Schema, ihre Freigabe ist offen. Werte wie `MAX_FLOORS`, `RECOVERY_H`, `LOCK_DAYS` oder `WORKER_FACTOR` bleiben KI-Vorschläge und sind keine Festlegung.
