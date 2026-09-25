# docs/CHANGELOG.md — Global

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

- Spiel-Design gelockt (8 V-Entscheidungen, 3 G-Entscheidungen, Etagen-Loop sequenziell, halbe Beute bei Gier-Tod).
