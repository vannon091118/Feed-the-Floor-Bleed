# packages/sim-core/docs/ARCHITEKTUR.md

## Rolle

Deterministischer, I/O-freier Core. Alle Simulation rein über PRNG-Seed, Fixed-Point
und feste Tick-Reihenfolge. Kein Zugriff auf Client, Server, `fs` oder Zeit.

## Module

- `prng` Mulberry32 (`createRng`, `nextUint32`, `nextBelow`, `nextRange`) plus
  `deriveSeed(seed, index, salt)` für unabhängige Sub-Streams pro Aktion.
- `math` Fixed-Point (Skala 1000) mit `mulFixed`, `divFixed`, `clampInt`, `absInt`
  sowie `isqrt`/`sqrtFixed` ohne `Math.sqrt`.
- `hash` FNV-1a-Kette über Wörter und Text (`hashStart`, `hashWord`, `hashText`,
  `hashFinish`, `hashToHex`).
- `grid` 64x64, fünf Tile-Typen, A* mit fester Nachbar-Reihenfolge; der Fallback
  nimmt den Weg mit den wenigsten Tiles.
- `combat` bounded Tick-Simulation (`simulateCombat`) mit deterministischer
  Zielwahl, Seed-Varianz pro Angriff, Event-Log und kanonischem Log-Hash.
- `combat/summary.ts` verdichtet den Log zu einer typisierten Kurzfassung.
- `combat/resolve-snapshot.ts` setzt den Contract-Envelope und liefert
  Ergebnis plus Log als zwei getrennte Payloads.
- `combat/fixture-job.ts` führt einen Auftrag lokal aus: Schema, Frist, Route,
  Kampf, Replay-Prüfung — und gibt einen validierten `RaidJob` zurück.
- `grid/serialize.ts` übersetzt Contract-Payload und Laufzeit-Grid in beide Richtungen.

## Vertrag und Version

`sim-core` kennt keine Protokollversion. `combat/types.ts` bleibt ein reiner
Engine-Typ; erst `resolve-snapshot.ts` hüllt das Ergebnis in den Envelope aus
`@floor/contracts`. Der Core darf Contracts importieren, aber kein Contract
darf vom Core abhängen.

## Keine Uhr, keine Nebenwirkung

`runFixtureRaid` liest weder `Date` noch einen globalen Zufallsgenerator. Zeit
kommt als `createdAt` und `observedAt` von außen, der Seed ebenso. Damit ist
jeder Fixture-Lauf im Test und im Browser wiederholbar. Das ist kein Zufalls-
feature, sondern die Bedingung dafür, dass ein Replay-Hash überhaupt etwas
aussagt.

## Bekannte Grenze

Aus dem Grid fließt aktuell nur `route.path.length` in den Kampf. Zwei Dungeons
mit gleich langer Route erzeugen denselben Hash, obwohl sie sich unterscheiden.
Der Client-Test `dokumentiert die bekannte Lücke` pinnt das bewusst. Der
Folgeblock führt den Pfad als Trail mit Zelltyp und Koordinaten in den Hash ein.
  `resolveCombat` zieht die Route aus dem Grid, `replayCombat` und
  `verifyCombatLog` bestätigen einen gespeicherten Log.
- `genome`, `items`, `ghost` sind weiterhin offen.

## Combat-Regeln

Die konkreten HP-, Angriffs- und Cooldown-Werte stehen zentral als
`PROVISIONAL_RULES` in `src/combat/rules.ts`. Sie sind nicht abgenommen
(`[K]` in `docs/CONCEPT_REVIEW.md`) und werden dort ersetzt, ohne die Engine
umzubauen. Die Engine selbst kennt keine eigenen Balancing-Zahlen.

## Regeln

Kein `Math.random`, `Date`, `Math.sin/pow/cos/tan/sqrt`, `parseFloat` und kein
`while (true)` in Combat. Event-Reihenfolge und Hash-Eingaben sind kanonisch,
damit derselbe Seed und Snapshot denselben Hash und identischen Log ergeben.
