# docs/CHANGELOG.md — Global

## 2026-09-25 — T1.2 deterministischer Combat-, Hash- und Replay-Core

- `packages/sim-core` implementiert `prng` (Mulberry32 plus Seed-Ableitung), `math` (Fixed-Point, isqrt), `hash` (FNV-1a) und `combat` (bounded Tick-Simulation, Event-Log, kanonischer Log-Hash, Replay).
- Gleicher Seed und Snapshot liefern denselben Hash und identischen Log; `resolveCombat`, `simulateCombat`, `replayCombat` und `verifyCombatLog` sind öffentlich.
- Balancing bleibt provisorisch zentral in `PROVISIONAL_RULES` und ist `[K]` in `docs/CONCEPT_REVIEW.md`, keine Nutzerentscheidung.
- 19 neue Tests; Gesamtstand 16 Testdateien und 79 Tests. `docs/ROADMAP.md` rückt T1.3 als nächsten Block nach.

## 2026-09-25 — Konzept-Realignment auf ODT-Stand

- `docs/CONCEPT_REVIEW.md` neu strukturiert: `[N]` Nutzerfestlegung, `[K]` KI-Vorschlag, `[O]` offen; nur `[N]` ist fix.
- Grid verbindlich 64×64 Logikzellen bei 16×16 sichtbaren Tiles; die ODT-Formulierung „4 Logiken pro Tile“ ist damit supersediert.
- Phantom-Kopie als Beute-Regel bestätigt; MMR-/XP-/Shield-Zahlen, der globale Vier-Stunden-Shield und der Session-Lock sind als KI-Vorschläge `[K]` markiert.
- `packages/sim-core/src/grid/path.ts` fällt wieder auf wenigste Tiles zurück; Golden-Test in `packages/sim-core/src/grid/path.test.ts` und `packages/sim-core/docs/CHANGELOG.md` angepasst.
- `README.md` von der nicht belegten Extraktions-/Gier-Mechanik bereinigt.
- Die frühere Formulierung „vier bestätigte Entscheidungen“ war zu weitgehend; fix ist nur, was im ODT belegt oder in dieser Session abgenickt wurde.

## 2026-09-25 — Lifecycle-Bug des Versionsbump behoben

- `scripts/bump-version.mjs` erhält beim mechanischen Bump die bestehende JSON-Formatierung und verhindert damit, dass der Post-Commit-Hook den Biome-formatierten `package.json`-Zustand wieder zerstört.
- Der erste Remote-pnpm-Lauf hatte den Fehler sichtbar gemacht; der nächste Task-Commit dokumentiert und schließt diese Kette.

## 2026-09-25 — main-only Governance und pnpm-CI

- `pnpm-lock.yaml` als reproduzierbare Workspace-Auflösung eingeführt und das veraltete `package-lock.json` entfernt.
- Root-Check auf pnpm umgestellt; `.github/workflows/shinon.yml` führt Typecheck, Tests, Biome und Full-Shinon für jeden Push auf `main` aus.
- `Agents.md` verschärft die main-only-Regel: lokale Gates bleiben vor Commit/Push verpflichtend, Remote-`Shinon Gate` ist der zweite Pflichtlauf, Review vor jedem Task-Commit und Commit-Body-Pflicht bleiben hart.
- Die Roadmap markiert T1.0 als abgeschlossen; T1.1 ist der nächste aktive Block.

## 2026-09-25 — Vollständiger Audit und priorisierte Roadmap

- Vollständigen Ist-Stand mit `pnpm`, Typecheck, Vitest, Shinon, Biome, `jq` und Dependency-Audit geprüft; 55 Tests sowie Typecheck und Full-Gate waren grün, Biome meldete nur die Formatierung von `package.json`.
- `docs/ROADMAP.md` als gepflegte T1/T2/T3-Produkt- und Technik-Roadmap ergänzt. T1 ist der exclusive playable Core; nach T1 wird T2 zu T1 und T3 zu T2 promoted.
- Aktuelle Lücken dokumentiert: fehlender Client, fehlender End-to-End-Raid-Flow, uneinheitliche pnpm/npm-Toolchain und stale `package-lock.json` mit Version `0.0.1`.
- Root-Repoindex um die Roadmap ergänzt; Pflegeprotokoll für Status, Changelog, Repoindex und erneute Checks festgeschrieben.

## 2026-09-25 — Cloudflare-first Backendentscheidung

- D1 hält Raid-Jobstatus und 15-Minuten-Frist; Cloudflare Queues übergeben den Job an den Headless-Worker.
- Die alte Node-/Fastify-/better-sqlite3-Zielnotiz bleibt als historischer Initialstand, wird aber nicht als aktuelle Architektur behandelt.
- Die vier bestätigten Entscheidungen zu Upload-Reihenfolge, Shield, 3:1-Beitrag und +5-Bewegungspunkten sind in `docs/CONCEPT_REVIEW.md` festgehalten.

## 2026-09-25 — Governance-Konsolidierung

- Die parallele Session-Learning-Datei und der GitHub-Governance-Spiegel wurden entfernt; `Agents.md` bleibt die einzige kanonische Agent-Governance und enthält die relevanten Erkenntnisse bereits.
- `docs/REPOINDEX.md` und die Shinon-Dokumentation verweisen nicht mehr auf eigenständige Governance-Duplikate.

## 2026-09-25 — Offizieller Initialstand

- Der gesamte aktuelle Projektbaum startet als Root-Commit mit Version `0.0.1`; `.freebuff`-Laufzeitdaten bleiben außen vor.
- `package-lock.json` ist versioniert, damit `npm ci` im GitHub-Check und in einem frischen Clone reproduzierbar bleibt.
- `packages/contracts/src/index.ts` liefert eine echte TypeScript-Quelle für den Typecheck und exportiert `sim_version`.
- `.github/workflows/shinon.yml` erzwingt den vollständigen Check `Shinon Gate`; Branch-Protection auf `main` muss diesen Status verlangen.
- `Agents.md` bündelt die kanonische Shinon-Governance; Agent-Dokumente verwenden relative Pfade und hardcodieren keine privaten oder maschinenbezogenen Werte.

## 2026-09-25 — Lifecycle-Gate-Härtung

- Der Post-Commit-Amend läuft mit aktiven Hooks; der frühere `--no-verify`-Pfad ist entfernt.
- Staging-, Amend- und Push-Fehler beenden den Hook mit Exit ungleich null, damit Versionszustand und Commit nicht auseinanderlaufen.

## 2026-09-25 — Gate-Fehlerpfade

- `npm run check` bricht nach einem fehlgeschlagenen Typecheck ab; nachfolgende Gates werden nicht als Erfolg getarnt.
- `.husky/post-commit` meldet Bump- und Version-Gate-Fehler jetzt mit Exit ungleich null und führt danach kein Amend oder Auto-Push aus.

## 2026-09-25 — GitHub-Freigabehärtung

- Leere `historisch/`- und Source-Domänenordner werden über `.gitkeep` versioniert, damit `hygiene-gate` und `schema-contract` auch in einem frischen Clone grün bleiben.
- Hook-Lifecycle isoliert geprüft: zu kurze Commit-Bodies und Werbe-Footer werden blockiert; ein gültiger Commit bumped atomar auf die nächste Version.

## 2026-09-25 — Initialisierung

- Monorepo angelegt: `packages/contracts`, `packages/sim-core`, `packages/client`, `packages/server`, `scripts/shinon`.
- Governance fixiert: kanonische Agent-Governance in `Agents.md` (Sprache Deutsch, DRY, Owner-Contracts, LOC-Caps, Hygiene, Shinon Gates).
- Hygiene-Domänen angelegt: root, contracts, sim-core, client, server, shinon — je 5 Pflicht-Dokus + historisch/.
- Shinon Engine: Slicer nach `git diff`, Plugin-Slices (loc-gate, hygiene-gate, core-determinism, schema-contract, false-positive), Auto-Push via post-commit.

## Vorher

- Spiel-Design gelockt (8 V-Entscheidungen, 3 G-Entscheidungen, Etagen-Loop sequenziell). Die frühere „halbe Beute bei Gier-Tod“-Notiz ist nicht durch das ODT gedeckt und wurde am 2026-09-25 aus README/Konzept entfernt.
