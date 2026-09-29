# packages/contracts/docs/ARCHITEKTUR.md

## Rolle

Single Source of Truth für versionierte Schemas, Payloads und `sim_version`. Das Package enthält ausschließlich Zod-Schemas, Typinferenz und Konstanten; keine I/O- oder Geschäftslogik.

Die festen Wörter des Kampfs liegen in `src/combat-vocabulary.ts`: Stufen, Ereignisarten, Seiten, Rollen und Verhaltensprofile samt ihren Schemas. `combat-log.ts` beschreibt ausschließlich ihre Verwendung; die Auslagerung hat denselben 120-Zeilen-Cap gehalten wie vorher bei `trail.ts` und `combat-summary.ts`.

`src/abilities.ts` ist das einzige Vokabular der Helden (Klassen, Fähigkeiten, Taktikregeln). Es liegt hier und nicht im Core, weil beide Seiten dieselben Wörter brauchen: `sim-core` rechnet mit ihnen, der Angreifer darf sie sehen, der Server prüft sie. Der Core liest von hier, nie umgekehrt; jede Zahl hinter einem Namen ist `[K]` und steht an ihrer Quelle im Core.

## Versionierung

- `CONTRACT_VERSION = 9` kennzeichnet das Wire-Format major.
- `sim_version = "0.0.8"` ist die einzige von v9 akzeptierte Simulationsversion.
- Upload, Match, Result, Ergebnislog, Auftrag, Fehler und jeder eigenständige Raid-Snapshot tragen beide Pflichtfelder `contractVersion` und `simVersion`.
- Ein Empfänger akzeptiert nur exakt diese Kombination. Ältere und inkompatible Folgestände scheitern vor jeder Domänenverarbeitung.
- Inkompatible Form- oder Bedeutungsänderungen erhöhen `CONTRACT_VERSION`; Korrekturen ohne Änderung des akzeptierten JSON dürfen die laufende Version erhalten. Unbekannte Felder werden nicht ignoriert.
- Grid- und Pathfinding-Schemas sind versionierte Runtime-Werte des Vertrags, aber noch kein eigenständiges Transportformat.
- Ein Versionssprung zieht eine Datenmigration mit. Die Kette liegt in `packages/server/migrations/`: `002_contract_v4.sql`, `003_contract_v5.sql`, `004_contract_v6.sql`, `005_contract_v7.sql`, `006_contract_v8.sql` und `007_contract_v9.sql`. Seit v6 hebt sie den Bestand an, statt ihn zu löschen, wo die eingefrorene Eingabe in ihrer Form unverändert bleibt.

## Kanonischer Raid-Freeze

`RaidSnapshotSchema` enthält ausschließlich die bestätigten Freeze-Daten:

- `resources`: sichere Ganzzahlen `gold` und `materials`.
- `monsterSlots`: exakt fünf Slots mit `monsterId: string | null` und optional `generation` (fehlend heißt Generation 1, siehe v6).
- `activeTeam`: ein bis fünf aktive Helden mit `heroId`, `temporaryFatigue` und `temporaryInjury` als sichere Ganzzahlen.
- `escrow`: optional der gesicherte, noch nicht übergebene Beute-Zwischenstand (`gold`, `materials`, beide `[K]`); fehlend heißt „noch nichts gesichert“ und nicht „unbekannt“.
- `dungeon`: bestehender 64×64-Grid-Contract.

Die Angreifer-Fassade `RaidPublicViewSchema` ist `.strict()` und trägt die Contract-Version, `dungeon` und `revealed` (die vom Späher beantworteten Zellnummern); ein Rohling mit `monsterSlots` scheitert dort. Die Maske tauscht ausschließlich Platzierungszellen gegen Boden — Spawn, Boss und Wände bleiben, die Route bleibt damit dieselbe.

Der Contract legt keine Formeln, Grenzen, Umrechnungen oder Gameplay-Effekte für Ressourcen, Müdigkeit oder Verletzung fest. Taktiken gehören zum `UploadRequest`, werden aber nicht als Teil des eingefrorenen Raid-Snapshots persistiert.

## Vertragsumfang

- `PathResultSchema`: `reachable` oder `unreachable`, dazu Pfad und Bewegungspunkte. Das Umwegbudget der Falle ist mit dem 2026-09-29 entfallen: Eine Platzierungsmarkierung kostet wie Boden.
- `UploadRequestSchema`: vollständiger `RaidSnapshot` plus `tactics: TacticRule[][]`; genau eine Taktikliste je aktivem Helden, höchstens drei Regeln je Liste. Eine Regel ist `{ ability, when? }` — Form und Auswertung sind getrennt: der Contract trägt das Wire-Vokabular, die deterministische Auswertung gehört in den Core (`raid-sim`).
- `MatchResponseSchema`: `seed`, `floor` und `RaidPublicViewSchema` — die **öffentliche** Sicht, die der Angreifer bekommen darf. Der volle `RaidSnapshot` bleibt privat und liegt beim Server; `toPublicView` ist der einzige erlaubte Weg von dort nach hier (siehe `raid-public.ts`).
- `ResultPayloadSchema`: `token`, `floor`, `hash` und typisiertes `CombatSummary` mit `defendersTotal` (eingefrorener Verteidiger-Roster inklusive Boss). Die Zahl der gefallenen Gegner ist damit ohne den Log ableitbar.
- `RaidLogPayloadSchema`: derselbe Hash plus der vollständige `CombatLog`. Eigenes Artefakt, damit `result_json` klein bleibt.
- `CombatVocabulary` in `src/combat-vocabulary.ts`: `COMBAT_STAGES` (inkl. `extracted`, das der Auftrag nach dem Sichern setzt und nicht die Engine), `COMBAT_EVENT_TYPES` (inkl. `ability` und `reveal`), `COMBAT_SIDES`, `COMBAT_ROLES` und `MONSTER_BEHAVIORS`.
- `CombatLogSchema`: Config, Einheiten, Ereignisse, Stufe, Ticks, Hash und `trail` (jeder Schritt mit `x/y/cell/zoneId`). Seit T1.1 fließt der Trail in `fingerprintCombatLog`; `verifyCombatLog` deckt ihn über den Hash-Vergleich ab. Seit v7 trägt jede Einheit `ambushZoneId` und der Trail die Zone — deshalb ist der Log die einzige Ortsquelle, die ein Replay braucht. Seit v8 trägt jede Einheit `behavior`: das Verhaltensprofil aus dem Genom, das die Zielentscheidung trifft, ebenfalls nur aus dem Log lesbar. Seit v9 trägt sie zusätzlich `class` (die Heldenklasse aus `abilities.ts`) und die Ereignisarten kennen `ability` und `reveal`; `extracted` erweitert die Stufenliste um das Sichern nach dem Boss-Sieg, das der Auftrag setzt und nicht die Engine. Invarianten erzwingen eindeutige IDs, ein schließendes `end`-Ereignis, Tick ≤ `log.ticks` und dass jede Einheit auf einer Trail-Zelle steht.
- `CombatSummarySchema` liegt in `src/combat-summary.ts` und beschreibt dasselbe Ergebnis für Listen und Anzeige; `src/index.ts` re-exportiert sie, `src/protocol.ts` liest sie von dort.
- `ErrorPayloadSchema`: `blocked`, `invalid-hash`, `invalid-request`, `protected`, `timeout` plus optionales `detail`.
- `RaidJobSchema`: Diskriminated Union über `status` mit Übergangsautomat.

## Auftrag statt Zustandsstring

Der Auftrag trägt Ergebnis, Fehler und Frist in der Form, nicht in einer
Konvention. `completed` *muss* ein `ResultPayload` haben, `failed` und
`expired` *müssen* ein `ErrorPayload` haben, und `expired` akzeptiert
ausschließlich `code: 'timeout'`. Damit kann weder ein Typ noch ein
validiertes JSON einen Auftrag ohne Ergebnis als abgeschlossen ausgeben.

Der Kampf-Timeout ist davon bewusst getrennt: Er ist ein *erfolgreiches*
Ergebnis mit `summary.stage === 'timeout'`. Ein abgelaufener Auftrag ist ein
Fehler. Beide heißen in der Oberfläche ähnlich, im Vertrag nicht.

## Übergangsautomat als einzige Wahrheit

`RAID_JOB_STATUSES`, `RAID_JOB_TRANSITIONS` und `canTransitionRaidJob` liegen
im Contract. Server, Datenbank-Check-Constraint, Client-Anzeige und die
lokale Fixture-Ausführung lesen dieselben Werte. Die D1-Trigger bleiben als
Datenbanksperre bestehen, sind aber nicht mehr die einzige Definition.

## Abhängigkeiten

Keine. `sim-core`, `client` und `server` importieren von hier — nie umgekehrt. Das Modularity-Gate erzwingt zusätzlich, dass `sim-core` weder Server noch Client importiert. `sim-core` nutzt den Contract in `combat/resolve-snapshot.ts` und `combat/fixture-job.ts`, um Payloads zu erzeugen und zu validieren.
