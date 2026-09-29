# packages/sim-core/docs/historisch/2026-09-25_changelog-trail-hash.md

Die beiden Eintraege vom 2026-09-25 („T1.1 Trail-Hash" und „Kommentar- und Doku-Typos") aus `packages/sim-core/docs/CHANGELOG.md`, ausgelagert am 2026-09-29 zusammen mit dem Block `2026-09-25_changelog-dungeon-kern.md`, weil die Datei an ihre Zeilengrenze stiess. Unveraendert erhalten; die aktive Fassung steht unter `packages/sim-core/docs/CHANGELOG.md`.

## 2026-09-25 — T1.1 Trail-Hash: `trail` fließt in den Hash, LOC-Cap gehalten

- `src/combat/types.ts`: `CombatTrailEntry { x, y, cell }` und `CombatLog.trail: CombatTrailEntry[]` neu.
- `src/combat/fingerprint.ts`: `trailHash` neu, `fingerprintCombatLog` hasht jede Trail-Zelle vor Units und Events — gleich lange Routen unterscheiden sich.
- `src/combat/resolve.ts`: baut `trail` aus `findPath(grid)` plus `getCell`, reicht ihn an `simulateCombat`.
- `src/combat/simulate.ts`/`replay.ts`: `trail` ist Pflicht-Input, `verifyCombatLog` prüft Länge und jede Zelle.
- `packages/client/test/raid-job.test.ts`: bekannte Lücke geschlossen, Test von `toBe` auf `not.toBe` gedreht (bewusst roter Durchlauf vor dem Fix belegt).

## 2026-09-25 — Kommentar- und Doku-Typos in Grid und Combat

- `src/grid/serialize.ts`: der Brücken-Kommentar sprach davon, dass ein eingefrorener Snapshot „hinterher“ nicht verändert werden kann. Gemeint war „nachträglich“; hinterher im Sinne von Zeitfolge ergibt hier keinen Sinn.
- `src/combat/fixture-job.test.ts`: der Testname sprach davon, den Kampf-Timeout „als erfolgreiches Ergebnis“ zu behandeln. Der Auftrag ist erfolgreich abgeschlossen, das Ergebnis darin trägt die Stufe `timeout`. Beides ist jetzt im Namen getrennt.
- `docs/STRINGMATRIX.md`: die Hard-Block-Zeile nannte die Regel „Letzte freie Route nicht zumauerbar“. Die Form existiert im Deutschen nicht; die Regel lautet jetzt, dass die letzte freie Route nicht zugemauert werden darf.

## 2026-09-25 — T1.3 Ergebnislog und lokale Fixture-Job-Ausführung

- `src/grid/serialize.ts` ergänzt: `toDungeonGrid` und `fromDungeonGrid` als Brücke zwischen Contract-Payload (`cells` als Array) und Laufzeit-Grid (`Uint8Array`), jeweils kopierend und mit Zellzahl-Prüfung.
- `src/combat/summary.ts` ergänzt: `summarizeCombat` verdichtet den Log zu Stufe, Ticks, Hash, Ereignis- und Angriffszahlen, Schaden und Überlebenden. Die Summary wird gegen den Contract geparst.
- `src/combat/resolve-snapshot.ts` ergänzt: `resolveSnapshotRaid` liefert aus Grid und Aufstellung ein `ResultPayload` und ein `RaidLogPayload`. Der Envelope sitzt erst hier — die Engine kennt weiterhin keine Protokollversion.
- `src/combat/fixture-job.ts` ergänzt: `runFixtureRaid` führt einen Auftrag lokal und ohne Uhr aus. `createdAt`/`observedAt` werden übergeben, nicht gelesen. Rückgabe ist ein durch `RaidJobSchema` validierter Auftrag.
- Der Runner prüft die Auftragsfrist (`expired`/`timeout`), die Route (`blocked`), das Upload-Schema (`invalid-request`) und replayt den geparsten Log, bevor er `completed` meldet (`invalid-hash` bei Abweichung).
- Der Kampf-Timeout bleibt ein erfolgreiches Ergebnis mit `stage: 'timeout'`; er ist damit vom Auftrags-Timeout getrennt.
- 8 neue Tests in `src/combat/fixture-job.test.ts` decken Ergebnis, Roundtrip, Log-Artefakt, Fehler, Auftrags-Timeout, Kampf-Timeout und Block ab.
- Der Test baut seinen Upload bewusst selbst und importiert keine Fremd-Domain-Fixture: das Modularity-Gate verbietet das Verlassen des eigenen Packages.

## 2026-09-25 — T1.2 deterministischer Combat-, Hash- und Replay-Core

- `math` implementiert Fixed-Point (Skala 1000) mit `mulFixed`, `divFixed`, `clampInt`, `absInt` sowie `isqrt`/`sqrtFixed` ohne `Math.sqrt`.
- `prng` implementiert Mulberry32 (`createRng`, `nextUint32`, `nextBelow`, `nextRange`) und `deriveSeed(seed, index, salt)` für Sub-Streams pro Aktion.
- `hash` implementiert eine FNV-1a-Kette über Wörter und Text als deterministischen Log-Fingerprint.
- `combat` implementiert die bounded Tick-Simulation mit deterministischer Zielwahl, Seed-Varianz pro Angriff, Event-Log, kanonischem Hash und Replay über `resolveCombat`, `simulateCombat`, `replayCombat` und `verifyCombatLog`.
- Balancing-Werte liegen provisorisch und zentral in `src/combat/rules.ts`; sie sind nicht abgenommen (`[K]` in `docs/CONCEPT_REVIEW.md`).
- 20 neue Tests decken Fixed-Point, PRNG, Hash, Determinismus, Seed-Sensitivität, Replay, Tick-Limit, Team-/Slot-Grenzen und den Hard-Block ohne Route ab.

