# docs/ROADMAP.md — Audit- und Produkt-Roadmap

## Zweck

Diese Roadmap ist die einzige aktive Reihenfolge für Produkt- und Technikarbeit. Sie trennt den belegten Ist-Stand von der geplanten Zielarchitektur und verhindert, dass unimplementierte Systeme als bereits vorhanden behandelt werden.

## Statusupdate — 2026-09-25

Abgeschlossen und nach `docs/historisch/2026-09-25_roadmap-t1-abgeschlossen.md` archiviert: pnpm-only (T1.0), deterministischer Combat-/Hash-/Replay-Core (T1.2), Contract-v2-Ergebnislog und lokale Fixture-Ausführung (T1.3) sowie die sichtbare visuelle Basis (T1.3b). `docs/CONCEPT_REVIEW.md` steht auf ODT-Stand; KI-Vorschläge sind als `[K]` markiert. Der nächste aktive Block ist T1.1: Trail-Hash, damit der Dungeon im Kampf ankommt.

Nachtrag: Die visuelle Basis ist im Browser lauffähig (`pnpm --filter @floor/client dev`). Die Szene rechnet einen lokalen Fixture-Lauf aus `resolveSnapshotRaid` und entscheidet nichts. Der Hash sieht weiterhin nur `route.path.length`; gleich lange Umwege liefern denselben Wert.

## Audit-Snapshot — 2026-09-25

### Grün

- `pnpm run -s typecheck` bestanden.
- `pnpm test -- --run` bestanden: 21 Testdateien, 114 Tests (Client, Contracts, Server, Core).
- `pnpm run -s check` bestanden: LOC, Hygiene und alle Shinon-Gates.
- `pnpm audit --prod --json | jq` meldet keine bekannten Schwachstellen.
- Grid, Contracts, D1-Raid-Freeze, Combat-, Hash- und Replay-Core sowie der lokale Fixture-Auftrag sind durch Tests abgedeckt.

### Befunde mit Priorität

- **P1 — Der Hash sieht den Dungeon nicht:** Aus dem 64×64-Grid fließt nur `route.path.length` in den Kampf. Zwei Dungeons mit gleich langer Route erzeugen denselben Hash, Fallen ohne Wirkung. Gepinnt in `packages/client/test/raid-job.test.ts`. Der Pfad muss als Trail mit Zelltyp und Koordinaten in den Hash eingehen.
- **P1 — Client ohne echten Spielfluss:** Visuelle Basis steht (Pixi, World, Kamera, Depth, Occlusion, Actors, FX, Observer, Window-Runtime, Showcase), aber weder Storage noch Net noch servergebundenes Raid-Playback. Showcase rechnet nur lokal.
- **P1 — Kein vollständiger Raid-Flow:** HTTP, Auth, Queue, Matching, Ghost und Ergebniskonsequenzen fehlen; Core, Contract und lokale Fixture-Ausführung stehen.
- **P2 — Dokumentationsabstand:** Funktionsgraph und Architektur mischen Ziel und Ist-Stand. Bei jedem Arbeitspaket strikt trennen.
- **P2 — Testabdeckung:** Contracts, Grid, D1 und Replay-Determinismus abgedeckt, nicht Client-Verhalten, E2E-Raids oder Netzfehler.

## Prioritätsregel

- **T1 ist exklusiv:** Während T1 läuft, wird kein T2- oder T3-Feature begonnen.
- **Nach T1:** T2 wird zu T1 und T3 wird zu T2. Die Roadmap wird unmittelbar nach dem Abschluss von T1 neu priorisiert.
- Nach jedem Arbeitspaket werden Status, Evidenz, offene Punkte und Folgeschritte in dieser Datei aktualisiert.
- Ein Statuswechsel ist erst nach grünem `pnpm run -s typecheck`, `pnpm test -- --run`, `pnpm run -s lint` und `pnpm run -s check` zulässig.
- Neue Erkenntnisse werden nicht nur hier, sondern auch im betroffenen Domain-Changelog dokumentiert.

## T1 — Spielbarer Kern und reproduzierbarer Raid-Loop

**Ziel:** Ein Nutzer kann eine kleine Welt öffnen, einen Dungeon bauen, einen deterministischen Raid auslösen, das Ergebnis ansehen und eine verständliche Konsequenz sehen.

| ID | Ergebnis | Abhängigkeit | Fertig, wenn |
|----|----------|--------------|---------------|
| T1.1 | Trail-Hash: Pfad als Trail mit Zelltyp und Koordinaten im Kampf-Hash | — | Zwei Dungeons mit gleich langer Route erzeugen unterschiedliche Hashes; Fallenpositionen beeinflussen den Kampf; gepinnter Test in `raid-job.test.ts` grün |
| T1.2 | Raid-Playback mit Timeline, Routen-/Fallenereignissen und Schlussfolgen | T1.1 | Der Nutzer kann die drei entscheidenden Momente des Raids erklären |
| T1.3 | Ende-zu-Ende-Abnahme der Tag-/Nacht-/Raid-Schleife | T1.1–T1.2 | Ein Fixture-Loop läuft in unter fünf Minuten und erfüllt die Checkliste |

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

T1.1 beginnen: Trail-Hash. Der Pfad muss mit Zelltyp und Koordinaten in den Hash eingehen, sonst zeigt T1.2 nichts, das vom gebauten Dungeon stammt, und Fallen bleiben wirkungslos. Ausgang ist der gepinnte Test in `packages/client/test/raid-job.test.ts`.

## Pflegeprotokoll

Bei jedem Arbeitspaket drei Dinge aktualisieren: den Status dieser Roadmap, den betroffenen `docs/CHANGELOG.md` und bei neuen oder entfernten Komponenten den jeweiligen `REPOINDEX.md`. Danach Check-Befehle ausführen und Abweichungen als offenen T1/T2/T3-Punkt eintragen, nicht stillschweigend verschieben.
