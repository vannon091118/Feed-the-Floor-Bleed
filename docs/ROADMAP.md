# docs/ROADMAP.md — Audit- und Produkt-Roadmap

## Zweck

Diese Roadmap ist die einzige aktive Reihenfolge für Produkt- und Technikarbeit. Sie trennt den belegten Ist-Stand von der geplanten Zielarchitektur und verhindert, dass unimplementierte Systeme als bereits vorhanden behandelt werden.

## Statusupdate — 2026-09-25

T1.0 ist abgeschlossen. `pnpm@9.12.3` besitzt jetzt `pnpm-lock.yaml`, `package-lock.json` wurde entfernt, `package.json` ruft den Check über pnpm auf und die GitHub-Actions führen den vollständigen Gate-Lauf bei jedem Push auf `main` aus. Die verpflichtende lokale Hook-Kette bleibt unverändert. Der nächste aktive Block ist T1.1: startbarer Client-Shell mit Fixture-Spielstand und Dungeon-Editor.

## Audit-Snapshot — 2026-09-25

### Grün

- `pnpm run -s typecheck` bestanden.
- `pnpm test -- --run` bestanden: 11 Testdateien, 55 Tests.
- `pnpm run -s check` bestanden: LOC, Hygiene und alle Shinon-Gates.
- `pnpm audit --prod --json | jq` meldet keine bekannten Schwachstellen.
- Grid, Contracts und D1-Raid-Freeze sind durch Tests abgedeckt.

### Befunde mit Priorität

- **P1 — Kein spielbarer Client:** `packages/client/src` enthält nur `.gitkeep`; es gibt keine UI, keinen Editor, keinen Storage und keine Raid-Playback.
- **P1 — Kein vollständiger Raid-Flow:** HTTP, Auth, Queue, Matching, Ghost, Combat, Replay und Ergebniskonsequenzen sind nicht implementiert.
- **P1 — Paketmanager uneinheitlich (behoben in T1.0):** `packageManager` und Workspace sind auf pnpm ausgelegt, CI nutzt jetzt `pnpm install --frozen-lockfile`, `pnpm-lock.yaml` ist vorhanden und das veraltete `package-lock.json` wurde entfernt.
- **P2 — Dokumentationsabstand:** Funktionsgraph und Architektur beschreiben Zielmodule, nicht den aktuellen Implementierungsstand. Ziel und Ist-Stand müssen bei jedem Arbeitspaket getrennt bleiben.
- **P2 — Testabdeckung:** Die vorhandenen Tests decken Contracts, Grid und D1-Persistenz ab, nicht Client-Verhalten, End-to-End-Raids, Replay-Determinismus oder Fehlerfälle des Netzwerks.

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
- Inventar, Ausrüstung und sichtbare Phantom-Loot-Entscheidungen.
- Zucht, Generationen, Mutationen und reproduzierbare Stammbäume.
- Persistenter lokaler Spielstand und echter asynchroner Job-Status.
- Erweiterte Taktiken mit sichtbaren Regeln und Risikoauswirkung.

## T3 — Systemische Erweiterung nach T1

Diese Arbeit wird nach Abschluss von T1 zu T2 promoted. Sie startet nicht parallel zum ersten T2-Block.

- MMR-Matching mit dem bereits bestätigten ±10-%-Band und Ghost-Fallback.
- Vollständige Queue-, Reconnect-, Retry- und Timeout-Semantik.
- Autorisierte Endpunkte, Rate-Limits, Audit-Log und Missbrauchserkennung.
- PWA-Installierbarkeit, Offline-Editor-Stand und produktionsfähige Deployment-Konfiguration.
- Seed-/Build-Teilen und Replay-Inspektion ohne Live-Matchmaking.

## Nächster konkreter Schritt

T1.1 beginnen: startbaren Client-Shell mit Fixture-Spielstand, Tag/Nacht-Umschaltung und minimalem Dungeon-Editor bauen. T1.0 ist durch den gepflegten pnpm-Lockfile-, CI- und Governance-Slice abgeschlossen.

## Pflegeprotokoll

Bei jedem Arbeitspaket drei Dinge aktualisieren: den Status dieser Roadmap, den betroffenen `docs/CHANGELOG.md` und bei neuen oder entfernten Komponenten den jeweiligen `REPOINDEX.md`. Danach Check-Befehle ausführen und Abweichungen als offenen T1/T2/T3-Punkt eintragen, nicht stillschweigend verschieben.
