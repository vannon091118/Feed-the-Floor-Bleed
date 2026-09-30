# packages/contracts/docs/CHANGELOG.md

## 2026-09-30 — Die Kurzfassung nennt, wer den Schaden verursacht hat

**Scope:** geändert `src/combat-summary.ts` (zwei Felder und ihr Schema). Kein Versionssprung, kein Feld entfernt, keine bestehende Form geändert.

**Die Gesamtzahl beantwortet die falsche Frage.** `damage` sagt, wie viel Schaden gefallen ist, nicht wer ihn verursacht hat. Für die Erfahrung zählt genau das — ein Wesen erfahrnt nach dem Schaden, den es angerichtet hat, auch dann, wenn es dabei stirbt. Ohne die Aufteilung müsste der Client den Log selbst auswerten, und damit eine zweite Wahrheit über denselben Lauf haben.

**Zwei Felder statt einer Map.** `damageByHero` und `damageByMonster` sind Listen aus `unitId` und `damage`, getrennt nach Seite, weil beide Seiten derselben Regel folgen, aber getrennt gelesen werden: die Heldenseite in der Beschaedigung des Teams, die Monster-Seite in der Beute. Eine `z.record`-Map hätte beliebige Schlüssel erlaubt, und ein unbekannter Schlüssel wäre eine Einheit, die der Log nicht kennt.

**Kein Sprung, weil nichts Bestehendes kippt.** Das Schema ist `.strict()`, beide Felder sind neu, und kein Leser existierte für die alte Form — sie kann nicht brechen, was es nicht gab. `sim_version` und `CONTRACT_VERSION` stehen unverändert.

**Beleg:** 540 Tests in 81 Dateien, typecheck 0, Lint 0, der Golden Pin unangetastet (`261cd39a`, `ee21afc5`).

## 2026-09-29 — `sim_version 0.0.8→0.0.9`, ohne Contract-Sprung

**Scope:** geändert `src/version.ts`. `CONTRACT_VERSION` bleibt 9. Keine Migration.

**Warum die Simulationsversion steigt und der Contract nicht.** Die Kampfbalance ist am 2026-09-29 freigegeben und mit `BOSS_RULES` 132000/12000/1000/500 gebaut; das verschiebt den Hash jedes gespeicherten Replays. `raid_snapshots.sim_version` ist genau das Feld, an dem ein alter Lauf als fremd erkannt wird — `packages/server/src/db/raid-queries.ts` gleicht darüber ab, das Replay-Gate ist T3.2. Eine Zahl der Simulation, die einen Lauf entscheidet, ist deshalb ein Versionssprung. Die **Form** des Wire-Formats bleibt unberührt: kein Feld, kein Schema, keine Migration, nur ein anderer Wert in derselben Spalte.

**Die Migration `007_contract_v9.sql` bleibt unangetastet.** Sie stempelt weiter `'0.0.8'`, weil sie laut eigenem Kommentar „eine Momentaufnahme des Sprungs 8→9" ist. Ihr Test `raid-migration-v9.test.mjs` prüft darum nicht mehr die laufende Konstante, sondern die Zahl, die die Migration setzt.

## 2026-09-29 — Contract v9: Heldenklasse, Taktikregel und der gesicherte Lauf

**Scope:** neu `src/abilities.ts`, `src/combat-vocabulary.ts` und `test/abilities.test.ts`. Geändert `src/combat-log.ts`, `src/combat-summary.ts`, `src/raid-public.ts`, `src/raid-snapshot.ts`, `src/protocol.ts`, `src/version.ts`, `src/index.ts` sowie `test/raid-fixtures.ts`, `test/combat-log.test.ts`, `test/raid-public.test.ts` und `test/raid-snapshot.test.ts`. `CONTRACT_VERSION 8→9`, `sim_version 0.0.7→0.0.8`.

**Drei Flächen, ein Grund: Phase 3 braucht Wörter, bevor sie Zahlen braucht.** `src/abilities.ts` ist neu und führt das Wire-Vokabular der Helden — `HERO_CLASSES`, `ABILITY_IDS`, `TACTIC_WHEN_KINDS` und `TacticRuleSchema` (`{ ability, when? }`, `.strict()`). Es liegt im Contract und nicht im Core, weil `sim-core` damit rechnet, der Angreifer es sehen darf und der Server es prüft; zwei Listen wären zwei Wahrheiten, und die Drift fiele erst beim Upload auf. `log.units[]` trägt `class` als Pflichtfeld aus genau demselben Grund wie `behavior` ein Feld vorher: `replayCombat` und `verifyCombatLog` lesen ausschließlich den Log, und eine Klasse, die nur im Speicher läge, müsste das Replay neu erfinden.

**Die Bedingung entscheidet wann, nie wie viel.** `thresholdPermille` ist Pflicht, sobald die Bedingung sie liest (`allyBelow`, `selfBelow`), und verboten, wo sie nichts bedeutete (`immediate`, `bossNear`): ein unbenutzter Wert wäre eine Zahl ohne Leser. Die Opaque-Strings in `UploadRequest.tactics` sind damit tot — was ein Mensch als `'guard'` schrieb, ist jetzt eine Regel aus Fähigkeit und optionaler Bedingung, und der Angreifer kann in sie hineinsehen.

**Fog und Ausstieg bekommen ihre Felder, ihre Mechanik noch nicht.** `RaidPublicView` führt `revealed` (die Zellen, die der Späher beantwortet hat; leer ist der heutige Stand), der Freeze führt optional `escrow`, und `COMBAT_STAGES` kennt `extracted` — kein Kampfergebnis, sondern das Ende eines gesicherten Laufs, das der Auftrag setzt. Alle drei sind Form ohne Rechnung: `toPublicView` reicht die Menge durch, die Ableitung aus Route und Späherin gehört in den Nebel-Slice. Das ist ausgesprochen und nicht als fertig ausgegeben.

**Ein Cap hat eine Datei geteilt, und der Grund steht in der Datei.** Mit `extracted`, `ability` und `reveal` riss `combat-log.ts` den 120-Zeilen-Cap der Domäne. Statt Kommentare zu kürzen und Code auf eine Zeile zu quetschen, ist das **Vokabular** ausgezogen: `src/combat-vocabulary.ts` hält die fünf Wortlisten samt Schemas, `combat-log.ts` ihre Verwendung — derselbe Zug, mit dem `trail.ts` und `combat-summary.ts` den Cap vorher gehalten haben. Die Form ist unverändert, `sim-core` und `combat-summary.ts` lesen dieselben Schemas an einem neuen Ort.

**Was der Sprung anfasst und was nicht.** Die eingefrorene Eingabe bleibt in ihrer Form lesbar; `escrow` ist optional, `class` und `revealed` sind abgeleitet, und die Taktiken stehen im Upload und nicht im Snapshot. `packages/server/migrations/007_contract_v9.sql` hebt v8-Zeilen auf `sim_version 0.0.8` und `contractVersion 9` an, statt sie zu löschen. Der Hash jedes Laufs verschiebt sich trotzdem — `class` steht im `specHash` —, obwohl sich an den Zahlen der Läufe nichts ändert, weil die Engine bis zum Klassen-Slice ausschließlich `none` schreibt; der Golden-Pin belegt beide Hashes neu und nennt den Grund ausdrücklich.

## 2026-09-29 — Contract v8: das Verhaltensprofil steht im Log

**Scope:** geändert `src/combat-log.ts`, `src/version.ts`, `src/index.ts` sowie `test/raid-fixtures.ts` und `test/combat-log.test.ts`. `CONTRACT_VERSION 7→8`, `sim_version 0.0.6→0.0.7`.

**Ein neues Pflichtfeld, und der Grund ist der Replay.** `log.units[]` trägt `behavior` mit den vier Werten aus `MONSTER_BEHAVIORS` (`'none' \| 'tank' \| 'hunter' \| 'control'`). Das Profil entsteht aus dem Trait der Art (`sim-core/src/genome/behavior.ts`) und ändert ausschließlich die Zielentscheidung — aber genau die Entscheidung bestimmt Ereignisfolge und Hash. `replayCombat` und `verifyCombatLog` lesen ausschließlich den Log, und ein Profil, das nur im Speicher läge, müsste die Zielwahl im Replay neu erfinden. Deshalb ist das Feld Pflicht und das Schema `.strict()`: fehlt es, scheitert der Log; ein erfundenes Profil wie `'swarm'` scheitert ebenfalls, solange die Mechanik dahinter nicht gebaut ist.

**Was der Sprung nicht anfasst.** Die eingefrorene Eingabe bleibt in ihrer Form unverändert, der Kampf wird beim Lesen neu gerechnet. `packages/server/migrations/006_contract_v8.sql` hebt v7-Zeilen auf `sim_version 0.0.7` und `contractVersion 8` an, statt sie zu löschen — dieselbe Haltung wie in v6 und v7, und dieselbe Begründung: die Epoche markiert das Versionsfeld, nicht die Löschung.

## 2026-09-29 — Contract v7: die Zone am Trail, der Hinterhalt am Verteidiger, die Summary in eigener Datei

**Scope:** neu `src/combat-summary.ts`. Geändert `src/combat-log.ts`, `src/trail.ts`, `src/protocol.ts`, `src/version.ts`, `src/index.ts`, `test/raid-fixtures.ts` und `test/combat-log.test.ts`. `CONTRACT_VERSION 6→7`, `sim_version 0.0.5→0.0.6`.

**Drei Felder, und jedes hat einen Leser.** `log.trail[]` trägt `zoneId` (die Zone der Zelle, `-1` für „keine"), `log.units[]` trägt `ambushZoneId` (die Zone der Platzierungsgruppe, in der der Verteidiger aufgestellt ist, `-1` sonst), und `COMBAT_EVENT_TYPES` kennt `ambush`. Alle drei sind Pflicht und werden `sim-core` geschrieben: der Hinterhalt ist eine Regel, die im Log stehen muss, weil ein Replay ausschließlich den Log liest. Ein `ambush`-Ereignis trägt in `amount` die durchdrungene Rüstung.

**Eine neue Invariante schützt den Replay-Pfad.** `CombatLogSchema` verlangt jetzt, dass jede Einheit auf einer Trail-Zelle steht (`unit.routeIndex < trail.length`). Ohne sie stürzte der Zustandsaufbau beim Replay in einen Indexfehler statt in einen Contract-Fehler, und dieselbe Naht hat `combat-log.test.ts` als Gegenprobe. Das ist dieselbe Art Zusage wie das schließende `end`-Ereignis: eine Form, die der Leser voraussetzt.

**Warum die Summary umgezogen ist.** `CombatSummarySchema` liegt in `src/combat-summary.ts` und wird von `src/index.ts` re-exportiert; `src/protocol.ts` importiert sie von dort. Der Log beschreibt den Lauf, die Kurzfassung sein Ergebnis — zwei Wire-Formen, zwei Dateien. Mit dem neuen Feld wäre `combat-log.ts` über den 120-Zeilen-Cap der Domäne gelaufen, und eine Auslagerung hat genau diesen Cap vorher schon für `trail.ts` gehalten.

**Was der Sprung nicht anfasst.** Die eingefrorene Eingabe (`RaidSnapshotSchema`) bleibt in ihrer Form unverändert; der Kampf wird beim Lesen und beim Replay gerechnet. Die Migration `packages/server/migrations/005_contract_v7.sql` hebt v6-Zeilen deshalb an, statt sie zu löschen.

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
