# docs/historisch/2026-09-25_changelog-t1-kern-und-governance.md

Append-only Archiv aus `docs/CHANGELOG.md`. Enthält die Einträge vom 2026-09-25 zum T1-Kern und zur Governance, die aus dem aktiven Changelog in dieses Archiv gewandert sind, weil der aktive Changelog das Cap von 200 Zeilen erreicht hatte.

## 2026-09-25 — T1.3 Contract-v2-Ergebnislog und lokale Fixture-Job-Ausführung

- `packages/contracts/src/combat-log.ts` und `src/job.ts` neu: strikte Wire-Form für Config, Einheiten, Events, Log und Summary sowie ein Auftrag als Discriminated Union über `status`. Ergebnis, Fehler und Auftrags-Timeout sind damit nicht verwechselbar.
- `ResultPayloadSchema.summary` war ein freies `record(json)` und ist jetzt typisiert. `RaidLogPayloadSchema` trägt den vollständigen Log als eigenes Artefakt, damit `result_json` klein bleibt.
- `ErrorCodeSchema` von drei auf fünf Codes erweitert. `timeout` war in D1 möglich, im Contract aber nicht darstellbar — genau diese Drift ist jetzt geschlossen.
- `packages/sim-core/src/grid/serialize.ts` und `src/combat/{summary,resolve-snapshot,fixture-job}.ts` neu: Contract-Payload zu Grid, typisierte Summary, Snapshot-Auflösung und lokale Auftragsausführung ohne Netz, ohne Uhr und ohne Zufall von außen.
- `runFixtureRaid` prüft Upload-Schema, Auftragsfrist, Route und Replay-Hash, bevor er `completed` meldet. Der Rückgabewert ist durch `RaidJobSchema` validiert.
- `packages/server/src/db/job-state.ts` übernimmt Status, TTL, Übergänge und Fehlercodes aus dem Contract. `raid-store.ts` erzwingt Übergänge vor dem Schreibzugriff.
- `packages/client/src/raid/` neu: Fixture-Upload, Ergebnis-Panel und Team-Panel. `ui/shell.tsx` wurde unter seinem LOC-Cap gehalten, indem die Teamanzeige herausgelöst wurde.
- Ein Client-Test pinnt die bekannte Lücke: Aus dem Grid fließt nur die Routenlänge in den Hash, daher erzeugen gleich lange Umwege denselben Wert. Der Folgeblock führt den Pfad als Trail in den Hash ein.
- 24 neue Tests, Gesamtstand 20 Testdateien und 104 Tests. `CONTRACT_VERSION` bleibt 2.

## 2026-09-25 — T1.2 deterministischer Combat-, Hash- und Replay-Core

- `packages/sim-core` implementiert `prng` (Mulberry32 plus Seed-Ableitung), `math` (Fixed-Point, isqrt), `hash` (FNV-1a) und `combat` (bounded Tick-Simulation, Event-Log, kanonischer Log-Hash, Replay).
- Gleicher Seed und Snapshot liefern denselben Hash und identischen Log; `resolveCombat`, `simulateCombat`, `replayCombat` und `verifyCombatLog` sind öffentlich.
- Balancing bleibt provisorisch zentral in `PROVISIONAL_RULES` und ist `[K]` in `docs/CONCEPT_REVIEW.md`, keine Nutzerentscheidung.
- 20 neue Core-Tests; Gesamtstand 16 Testdateien und 80 Tests. `docs/ROADMAP.md` rückt T1.3 als nächsten Block nach.

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
