# docs/historisch/2026-09-25_changelog-backend-und-initialstand.md

Append-only Archiv aus `docs/CHANGELOG.md`. Enthält die ältesten Einträge vom 2026-09-25 zur Backend-, Governance- und Initial-Phase, die aus dem aktiven Changelog in dieses Archiv gewandert sind.

## 2026-09-25 — Cloudflare-first Backendentscheidung

- D1 hält Raid-Jobstatus und 15-Minuten-Frist; Cloudflare Queues übergeben den Job an den Headless-Worker.
- Die alte Node-/Fastify-/better-sqlite3-Zielnotiz bleibt als historischer Initialstand, wird aber nicht als aktuelle Architektur behandelt.
- Die vier bestätigten Entscheidungen zu Upload-Reihenfolge, Shield, 3:1-Beitrag und +5-Bewegungspunkten sind in `docs/CONCEPT_REVIEW.md` festgehalten.

## 2026-09-25 — Governance-Konsolidierung

- Die parallele Session-Learning-Datei und der GitHub-Governance-Spiegel wurden entfernt; `Agents.md` blieb damals die zentrale Agent-Governance. Die aktuellen Detailregeln sind inzwischen in `docs/REGELWERK_ARCHITEKTUR.md`, `docs/REGELWERK_DOKUMENTATION.md` und `docs/REGELWERK_GIT.md` aufgeteilt; `Agents.md` verweist verbindlich auf diese Quellen.
- `docs/REPOINDEX.md` und die Shinon-Dokumentation verwiesen nach der damaligen Konsolidierung nicht mehr auf eigenständige Governance-Duplikate.

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

- Spiel-Design gelockt (8 V-Entscheidungen, 3 G-Entscheidungen, Etagen-Loop sequenziell). Die frühere „halbe Beute bei Gier-Tod"-Notiz ist nicht durch das ODT gedeckt und wurde am 2026-09-25 aus README/Konzept entfernt.
