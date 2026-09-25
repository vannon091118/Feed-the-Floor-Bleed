# docs/ROADMAP.md — Audit- und Produkt-Roadmap

## Zweck

Diese Roadmap ist die einzige aktive Reihenfolge für Produkt- und Technikarbeit. Sie trennt den belegten Ist-Stand von der geplanten Zielarchitektur und verhindert, dass unimplementierte Systeme als bereits vorhanden behandelt werden.

## Statusupdate — 2026-09-25

T1.0 ist abgeschlossen. T1.1 ist als Fixture-Shell mit Tag/Nacht-Umschaltung und Dungeon-Editor in `packages/client` vorhanden; die Ende-zu-Ende-Abnahme bleibt offen. T1.2 ist abgeschlossen: `packages/sim-core` besitzt jetzt deterministische `prng`-, `math`-, `hash`- und `combat`-Module, und gleicher Seed plus Snapshot liefern denselben Hash und identischen Log. Der nächste aktive Block ist T1.3: Contract-v2-Ergebnislog und lokale Fixture-Job-Ausführung. Parallel wurde `docs/CONCEPT_REVIEW.md` auf den ODT-Stand zurückgeschnitten; KI-Vorschläge sind dort als `[K]` markiert und keine Implementierungsfreigabe.

## Audit-Snapshot — 2026-09-25

### Grün

- `pnpm run -s typecheck` bestanden.
- `pnpm test -- --run` bestanden: 16 Testdateien, 79 Tests (inklusive 5 Client-Tests und 19 neuen Core-Tests).
- `pnpm run -s check` bestanden: LOC, Hygiene und alle Shinon-Gates.
- `pnpm audit --prod --json | jq` meldet keine bekannten Schwachstellen.
- Grid, Contracts, D1-Raid-Freeze sowie Combat-, Hash- und Replay-Core sind durch Tests abgedeckt.

### Befunde mit Priorität

- **P1 — Client nur als Fixture-Shell:** `packages/client` besitzt Shell, Tag/Nacht-Umschaltung und Dungeon-Editor, aber weder Storage noch Net oder Raid-Playback.
- **P1 — Kein vollständiger Raid-Flow:** HTTP, Auth, Queue, Matching, Ghost und Ergebniskonsequenzen sind nicht implementiert; Combat-, Hash- und Replay-Core stehen.
- **P1 — Paketmanager uneinheitlich (behoben in T1.0):** `packageManager` und Workspace sind auf pnpm ausgelegt, CI nutzt jetzt `pnpm install --frozen-lockfile`, `pnpm-lock.yaml` ist vorhanden und das veraltete `package-lock.json` wurde entfernt.
- **P2 — Dokumentationsabstand:** Funktionsgraph und Architektur beschreiben Zielmodule, nicht den aktuellen Implementierungsstand. Ziel und Ist-Stand müssen bei jedem Arbeitspaket getrennt bleiben.
- **P2 — Testabdeckung:** Die vorhandenen Tests decken Contracts, Grid, D1-Persistenz und jetzt Replay-Determinismus ab, nicht Client-Verhalten, End-to-End-Raids oder Fehlerfälle des Netzwerks.

## Prioritätsregel

- **T1 ist exklusiv:** Während T1 läuft, wird kein T2- oder T3-Feature begonnen.
- **Nach T1:** T2 wird zu T1 und T3 wird zu T2. Die Roadmap wird unmittelbar nach dem Abschluss von T1 neu priorisiert.
- Nach jedem Arbeitspaket werden Status, Evidenz, offene Punkte und benötigte Folgeschritte in dieser Datei aktualisiert.
- Ein Statuswechsel ist erst nach grünem `pnpm run -s typecheck`, `pnpm test -- --run`, `pnpm run -s lint` und `pnpm run -s check` zulässig.
- Neue Erkenntnisse werden nicht nur hier, sondern auch im betroffenen Domain-Changelog dokumentiert.

## T1 — Spielbarer Kern und reproduzierbarer Raid-Loop

**Ziel:** Ein Nutzer kann eine kleine Welt öffnen, einen Dungeon bauen, einen deterministischen Raid auslösen, das Ergebnis ansehen und eine verständliche Konsequenz sehen.

| ID | Ergebnis | Abhängigkeit | Fertig, wenn |
|----|----------|--------------|---------------|
| T1.0 | pnpm als einziger Paketmanager, reproduzierbarer Lockfile-Stand und angepasste CI | keine | `pnpm install --frozen-lockfile`, CI und alle Checks laufen mit derselben Toolchain |
| T1.1 | Startbarer Client-Shell mit Fixture-Spielstand, Tag/Nacht-Umschaltung und Dungeon-Editor | T1.0 | Ein Nutzer erreicht den Editor auf Desktop und Touch ohne toten Screen |
| T1.2 | Deterministischer Combat-, Hash- und Replay-Core auf Basis des vorhandenen Grids | T1.0 | Gleicher Snapshot und Seed erzeugen denselben Hash und identischen Log |
| T1.3 | Contract-v2-Ergebnislog und lokale Fixture-Job-Ausführung | T1.2 | Snapshot, Taktiken, Ergebnis, Fehler und Timeout sind strikt serialisierbar |
| T1.4 | Raid-Playback mit Timeline, Routen-/Fallenereignissen und Schlussfolgen | T1.1, T1.3 | Der Nutzer kann die drei entscheidenden Momente des Raids erklären |
| T1.5 | Ende-zu-Ende-Abnahme der Tag-/Nacht-/Raid-Schleife | T1.1–T1.4 | Ein Fixture-Loop läuft in unter fünf Minuten und erfüllt die Checkliste |

**T1-Definition of Done:** Keine unbeabsichtigte Core-Lücke, keine nicht versionierte Payload, keine Cliententscheidung über den Raid-Ausgang, reproduzierbarer Fixture-Seed und ein dokumentierter lokaler Playback.

## T2 — Alltagstiefe nach T1

Diese Arbeit wird erst nach Abschluss von T1 zu T1 promoted und anschließend einzeln abgearbeitet.

- Dorfwirtschaft mit Arbeitern, Attraktivität und Materialbedarf.
- Inventar, Ausrüstung und sichtbare Phantom-Loot-Umsetzung.
- Zucht, Generationen, Mutationen und reproduzierbare Stammbäume.
- Persistenter lokaler Spielstand und echter asynchroner Job-Status.
- Erweiterte Taktiken mit sichtbaren Regeln und Risikoauswirkung.

## T3 — Systemische Erweiterung nach T1

Diese Arbeit wird nach Abschluss von T1 zu T2 promoted. Sie startet nicht parallel zum ersten T2-Block.

- MMR-Matching mit noch offenem Stärkeband und Ghost-Fallback (KI-Vorschlag, siehe `docs/CONCEPT_REVIEW.md`).
- Vollständige Queue-, Reconnect-, Retry- und Timeout-Semantik.
- Autorisierte Endpunkte, Rate-Limits, Audit-Log und Missbrauchserkennung.
- PWA-Installierbarkeit, Offline-Editor-Stand und produktionsfähige Deployment-Konfiguration.
- Seed-/Build-Teilen und Replay-Inspektion ohne Live-Matchmaking.

## Nächster konkreter Schritt

T1.3 beginnen: Contract-v2-Ergebnislog und lokale Fixture-Job-Ausführung bauen. T1.2 ist im `sim-core` abgeschlossen, T1.1 ist als Fixture-Shell in `packages/client` vorhanden.

## Pflegeprotokoll

Bei jedem Arbeitspaket drei Dinge aktualisieren: den Status dieser Roadmap, den betroffenen `docs/CHANGELOG.md` und bei neuen oder entfernten Komponenten den jeweiligen `REPOINDEX.md`. Danach Check-Befehle ausführen und Abweichungen als offenen T1/T2/T3-Punkt eintragen, nicht stillschweigend verschieben.
