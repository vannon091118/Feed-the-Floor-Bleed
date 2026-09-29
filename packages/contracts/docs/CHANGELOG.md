# packages/contracts/docs/CHANGELOG.md

## 2026-09-29 — Contract v6: der Verteidiger-Slot trägt seine Generation

**Scope:** geändert `src/raid-snapshot.ts` (`monsterSlot` bekommt `generation`) und `src/version.ts` (`CONTRACT_VERSION` 5→6, `sim_version` 0.0.4→0.0.5). Kein neues Schema, keine bestehende Regel geändert.

`monsterSlots[i].generation` ist die Zuchtstufe des Verteidigers. Sie steht
hier und nicht im Ergebnis, weil die Goldformel (`docs/GOLDFORMEL.md`) die Beute
aus dem **eingefrorenen** Stand rechnet: die Stärke lässt sich über `monsterId`
aus der Registry auflösen, die Generation stand nirgends, und ein Ergebnis, das
sie nachzählte, müsste sie erst aus dem Snapshot dorthin kopieren.

**Warum sie nicht in die `monsterId` wanderte.** `genome/mutation.ts` salzt den
Zucht-Seed mit `hashText(hashStart(), genome.baseId)`, und `baseGenome()` legt
die geparzte ID als `baseId` ins Genom. Ein String, der auch die Generation
enthält, ginge als Salz in den Seed ein — jeder Zuchtwurf hinge dann an der
Beute-Kennzeichnung und der Replay-Hash eines eingefrorenen Runs verschöbe
sich mit. Als eigenes Feld bleibt der Seed unberührt; dieselbe Zucht auf einem
v5-Stand ergibt heute wie morgen dasselbe Wesen.

Das Feld ist **optional**, und das ist beabsichtigt: ein fehlendes `generation`
bedeutet Generation 1, also ein Basis-Monster. Damit bleiben alte Stände lesbar
und semantisch richtig, statt verworfen zu werden — anders als beim Sprung auf
v5, wo eine v4-Zeile unter einem nicht mehr existierenden Routenmodell gerechnet
worden war. `004_contract_v6.sql` hebt entsprechend nur die Versionsfelder an.

Der Mindestwert ist 1, weil Generation 0 in der Zuchtkette nicht vorkommt
(`baseGenome` startet bei 1, `breed` und `mutate` erhöhen). Ein Slot mit `0` oder
negativer Zahl ist kein gültiger Verteidiger und wird vom strikten Schema
abgewiesen, statt still auf Generation 1 zu fallen.

**Gates:** typecheck 0, 431 Tests in 63 Dateien, Contract-Gate ok, Shinon PASS.

## 2026-09-29 — Contract v5: öffentliche Angreifer-Sicht, und die Falle verliert ihr Budget

**Der Sprung hat zwei Gründe, beide entschieden.** Erstens sieht der Angreifer nur den Maze-Weg und die Bonus-Schätze; Monsterzahl, Platzierungen und Gruppen bleiben verborgen. Dafür gibt es neu `src/raid-public.ts` mit `RaidPublicViewSchema` (`.strict()`, nur Envelope und `dungeon`) und `toPublicView` als einzigem erlaubten Weg vom privaten `RaidSnapshot` zur Sicht. Die Maske tauscht ausschließlich Zellnummer 2 gegen Boden, also Platzierungsmarkierung gegen `Empty`; Spawn, Boss und Wände bleiben — und weil eine Platzierungszelle seit demselben Tag so viel kostet wie Boden, bleibt auch die Route dieselbe. `MatchResponseSchema.snapshot` trägt jetzt diese Sicht. Damit ist im Schema festgehalten, was am Bildschirm verborgen wäre: Eine Match-Antwort mit `monsterSlots` scheitert.

Zweitens ist `PathResultSchema` kürzer geworden. Mit der Falle entfällt ihr Kostenmodell: `mode` kennt nur noch `reachable` und `unreachable`, `detourCost` ist weg. `src/cell.ts` nennt die Zellnummern zusätzlich beim Namen (`EMPTY_CELL` bis `BOSS_CELL`), weil dieses Paket `sim-core` nicht importieren darf und ein Leser trotzdem sehen soll, was eine `2` bedeutet. `CONTRACT_VERSION 4→5`, `sim_version 0.0.3→0.0.4`.

**Was der Sprung nicht anfasst:** Die Form des privaten `RaidSnapshot` bleibt unverändert, `UploadRequestSchema` ebenso — der Verteidiger schickt weiter seinen vollen Stand. `toPublicView` hat noch keinen Aufrufer außerhalb der Tests, weil es weder Matchmaking noch einen Dienst gibt, der eine Match-Antwort ausliefert; sein Test ist bis dahin die Durchsetzung der Regel. `MatchResponseSchema` wird von keiner Produktionsstelle gelesen.

**Gates:** typecheck 0, 360 Tests in 54 Dateien, Shinon PASS.

## 2026-09-28 — Contract v4: das Rosterfeld macht die gefallenen Gegner berechenbar

**Der Anlass war eine belegte Lücke, kein Wunsch.** `docs/VISUAL_GRUNDSATZ.md` hält fest, dass die Stärke-/Generations-Goldformel nicht freigegeben werden kann, solange die Zahl der besiegten Gegner in keinem Contract-Feld steht: `ResultPayloadSchema` trägt den Kampflog nicht, und `monstersAlive`/`bossAlive` nennen nur die Überlebenden. Die Zahl der Gefallenen war aus einem abgelegten Ergebnis deshalb nicht rekonstruierbar.

**Das Feld.** `CombatSummarySchema` führt jetzt `defendersTotal: nonnegative int` — den eingefrorenen Verteidiger-Roster, also alle Einheiten der Monster-Seite mit dem Boss. Die Differenz `defendersTotal - monstersAlive - (bossAlive ? 1 : 0)` ist damit ohne den Log berechenbar. Die Heldenseite bekommt bewusst kein Gegenstück: die Formel braucht nur die Verteidiger, und ein Feld ohne Leser wäre vorbereitete Flexibilität.

**Der Bump.** `CONTRACT_VERSION 3→4`, `sim_version 0.0.2→0.0.3`. Beides ist nötig und beides ist bewusst: die akzeptierte Form von `result.summary` ändert sich (ein neues Pflichtfeld), und `sim-core` ist der Erzeuger dieser Summary. Der Kampf-Hash selbst ist unverändert — der Golden-Pin in `packages/sim-core/src/combat/combat-pin.test.ts` bleibt grün und ist der Beleg dafür.

**Ohne Verhalten.** Es wird keine Goldformel gerechnet und kein neues Feld gelesen. Der Slice friert nur die Form ein, damit alles Weitere Sim- oder Client-Verhalten auf stabilem Grund ist. v1/v2/v3 werden abgewiesen; die Datenmigration der alten Zeilen liegt in `packages/server/migrations/002_contract_v4.sql`.

## 2026-09-28 — `monstersAlive` ist als Feld ohne den Boss festgelegt

**Keine Formänderung, eine Semantikentscheidung.** `CombatSummarySchema` führt neben `monstersAlive` ein eigenes `bossAlive`; wer die beiden Felder liest, versteht daraus, dass der Boss nicht in beiden zugleich stehen soll. Die Umsetzung tat das eine Zeit lang doch: `sim-core` zählte den Boss über seine Seite `monsters` mit, der Client zog ihn ab. Das Schema bleibt deshalb unverändert — dieselbe akzeptierte JSON-Form, `CONTRACT_VERSION` bleibt 3 —, aber `STRINGMATRIX.md` nennt die Bedeutung von `monstersAlive` jetzt ausdrücklich (ohne den Boss), und `sim-core` liefert sie. v4 bleibt für das Rosterfeld reserviert, das die Stärke-/Generations-Goldformel braucht.

## 2026-09-27 — `useOptionalChain` in `combat-log.ts` behoben

`CombatLogSchema.superRefine` prüfte das letzte Ereignis mit `!last || last.type !== 'end'`; die Bedingung ist jetzt `last?.type !== 'end'`. Verhalten unverändert: bei fehlendem `last` liefert `last?.type` `undefined`, der Vergleich ist wahr und der Rest der Bedingung wird nicht ausgewertet. Der Grund ist die Umstellung von `pnpm run -s lint` auf `biome check --error-on-warnings`; weitere Dateien dieser Domäne sind unberührt.

## 2026-09-26 — Review-Nachgang: nutzloser Zell-Alias in `grid.ts` entfernt

- `packages/contracts/src/grid.ts`: `const cellTypeSchema = CellTypeSchema` war eine reine Weiterleitung mit genau einer Verwendung. Der Alias ist entfernt, `DungeonGridSchema` nutzt `CellTypeSchema` direkt. Import und Verhalten bleiben unverändert.

## 2026-09-25 — T1.1 Trail-Hash: Contract v3 mit `CombatTrailEntry` und `trail`

- `packages/contracts/src/trail.ts` neu: `CombatTrailEntrySchema` mit `x/y 0..63` und `cell 0..4` (`.strict()`).
- `packages/contracts/src/combat-log.ts`: `CombatLogSchema` trägt `trail: CombatTrailEntry[] 1..4096`; die sechs bestehenden Invarianten bleiben, zusätzlich gilt jede Pfadzelle als Pflichtfeld. `CONTRACT_VERSION 2→3`, `sim_version 0.0.1→0.0.2`.
- `packages/contracts/src/index.ts` re-exportiert `CombatTrailEntrySchema` und `CombatTrailEntry`. `LOC`-Cap in `combat-log.ts` durch Auslagerung gehalten.
- `packages/contracts/test/raid-fixtures.ts` liefert einen gültigen v3-Trail, `combat-log.test.ts`/`job.test.ts`/`raid-snapshot.test.ts`/`contracts.test.ts` an v3 angepasst; inkompatible Versionen werden weiterhin abgewiesen.

## 2026-09-25 — T1.3 Ergebnislog, Job-Union und Fehlercode-Vokabular

- `packages/contracts/src/combat-log.ts` ergänzt: strikte Schemas für `CombatConfig`, `CombatUnitSpec`, `CombatEvent`, `CombatLog` und `CombatSummary`. Invarianten: eindeutige Einheiten-IDs, schließendes `end`-Ereignis in der Ergebnisstufe, keine unbekannten Einheiten, kein Tick hinter dem Log-Ende.
- `CombatSummary` ersetzt das freie `record(json)` in `ResultPayloadSchema`. Ergebnislisten sind damit typisiert statt beliebig.
- `RaidLogPayloadSchema` trägt den vollständigen Log als eigenes Artefakt mit Envelope, Token, Etage und Hash; `ResultPayloadSchema` bleibt klein.
- `packages/contracts/src/job.ts` ergänzt: sechs Auftragsstatus, gerichteter Übergangsautomat und `RaidJobSchema` als Diskriminated Union. `completed` muss ein Ergebnis tragen, `failed`/`expired` einen Fehler, offene Zustände beides nicht.
- `ErrorCodeSchema` von drei auf fünf Codes erweitert: `invalid-request` (Schema-/Protokollfehler) und `timeout` (abgelaufene Auftragsfrist). `ErrorPayloadSchema` bekommt ein optionales `detail` mit stabilem Feldpfad.
- Kampf-Timeout und Auftrags-Timeout sind jetzt strukturell getrennt: Der Kampf-Timeout ist `summary.stage === 'timeout'` in einem erfolgreichen Ergebnis, der Auftrags-Timeout ist `status: 'expired'` mit `code: 'timeout'`.
- Tests decken Log-Invarianten, JSON-Roundtrip, die sechs Zustände, die Übergänge und die Fehler/Timeout-Trennung ab.
- `CONTRACT_VERSION` bleibt 2: keine bestehende Payload verliert eine Pflichtform, die akzeptierte Menge wird nur enger.

## 2026-09-25 — Vollständiger Raid-Freeze / Contract v2

- `RaidSnapshotSchema` für Ressourcen, exakt fünf Monster-Slots, aktive Helden mit temporärer Müdigkeit und Verletzung sowie Dungeon ergänzt.
- Upload und Match verlangen nun den vollständigen versionierten Snapshot; Taktiken bleiben außerhalb des persistierten Freeze.
- Contract auf v2 erhöht; v1 und inkompatible Folgestände werden abgewiesen.
- Contract-Fixtures und Tests für Vollständigkeit, unbekannte Felder, Slot-/Teamgrenzen und Kompatibilität ergänzt.
- Keine Balancing-Formeln, zusätzlichen Gameplay-Werte oder Runtime-Flows erfunden.

## 2026-09-25 — Contract-Grundlage

- Versionierte, strikte Zod-Schemas für das vorhandene 64×64-Grid und Pathfinding-Ergebnisse ergänzt.
- Dokumentierte Upload-, Match-, Result- und die drei Fehlerklassen mit Pflichtfeldern und exakten Grenzen typisiert.
- Contract-Tests für gültige/ungültige Payloads, Versionskonflikte, unbekannte Felder und Grid-/Pathfinding-Invarianten ergänzt.
- Keine D1-, Queue-, Client-, Server- oder End-to-End-Flows implementiert.

## 2026-09-25 — Init

- Domäne angelegt: `packages/contracts/src` (Zod-Schemas, sim_version kommt).
- Hygiene-Skelett erfüllt (5 Dokus aktiv, historisch/ vorhanden).
