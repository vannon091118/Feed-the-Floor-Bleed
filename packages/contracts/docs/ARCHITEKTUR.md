# packages/contracts/docs/ARCHITEKTUR.md

## Rolle

Single Source of Truth für versionierte Schemas, Payloads und `sim_version`. Das Package enthält ausschließlich Zod-Schemas, Typinferenz und Konstanten; keine I/O- oder Geschäftslogik.

## Versionierung

- `CONTRACT_VERSION = 7` kennzeichnet das Wire-Format major.
- `sim_version = "0.0.6"` ist die einzige von v7 akzeptierte Simulationsversion.
- Upload, Match, Result, Ergebnislog, Auftrag, Fehler und jeder eigenständige Raid-Snapshot tragen beide Pflichtfelder `contractVersion` und `simVersion`.
- Ein Empfänger akzeptiert nur exakt diese Kombination. Ältere und inkompatible Folgestände scheitern vor jeder Domänenverarbeitung.
- Inkompatible Form- oder Bedeutungsänderungen erhöhen `CONTRACT_VERSION`; Korrekturen ohne Änderung des akzeptierten JSON dürfen die laufende Version erhalten. Unbekannte Felder werden nicht ignoriert.
- Grid- und Pathfinding-Schemas sind versionierte Runtime-Werte des Vertrags, aber noch kein eigenständiges Transportformat.
- Ein Versionssprung zieht eine Datenmigration mit. Die Kette liegt in `packages/server/migrations/`: `002_contract_v4.sql`, `003_contract_v5.sql`, `004_contract_v6.sql` und `005_contract_v7.sql`. Seit v6 hebt sie den Bestand an, statt ihn zu löschen, wo die eingefrorene Eingabe in ihrer Form unverändert bleibt.

## Kanonischer Raid-Freeze

`RaidSnapshotSchema` enthält ausschließlich die bestätigten Freeze-Daten:

- `resources`: sichere Ganzzahlen `gold` und `materials`.
- `monsterSlots`: exakt fünf Slots mit `monsterId: string | null` und optional `generation` (fehlend heißt Generation 1, siehe v6).
- `activeTeam`: ein bis fünf aktive Helden mit `heroId`, `temporaryFatigue` und `temporaryInjury` als sichere Ganzzahlen.
- `dungeon`: bestehender 64×64-Grid-Contract.

Die Angreifer-Fassade `RaidPublicViewSchema` ist `.strict()` und trägt nur die Contract-Version und `dungeon`; ein Rohling mit `monsterSlots` scheitert dort. Die Maske tauscht ausschließlich Platzierungszellen gegen Boden — Spawn, Boss und Wände bleiben, die Route bleibt damit dieselbe.

Der Contract legt keine Formeln, Grenzen, Umrechnungen oder Gameplay-Effekte für Ressourcen, Müdigkeit oder Verletzung fest. Taktiken gehören zum `UploadRequest`, werden aber nicht als Teil des eingefrorenen Raid-Snapshots persistiert.

## Vertragsumfang

- `PathResultSchema`: `reachable` oder `unreachable`, dazu Pfad und Bewegungspunkte. Das Umwegbudget der Falle ist mit dem 2026-09-29 entfallen: Eine Platzierungsmarkierung kostet wie Boden.
- `UploadRequestSchema`: vollständiger `RaidSnapshot` plus `tactics`; genau eine Taktikliste je aktivem Helden.
- `MatchResponseSchema`: `seed`, `floor` und `RaidPublicViewSchema` — die **öffentliche** Sicht, die der Angreifer bekommen darf. Der volle `RaidSnapshot` bleibt privat und liegt beim Server; `toPublicView` ist der einzige erlaubte Weg von dort nach hier (siehe `raid-public.ts`).
- `ResultPayloadSchema`: `token`, `floor`, `hash` und typisiertes `CombatSummary` mit `defendersTotal` (eingefrorener Verteidiger-Roster inklusive Boss). Die Zahl der gefallenen Gegner ist damit ohne den Log ableitbar.
- `RaidLogPayloadSchema`: derselbe Hash plus der vollständige `CombatLog`. Eigenes Artefakt, damit `result_json` klein bleibt.
- `CombatLogSchema`: Config, Einheiten, Ereignisse, Stufe, Ticks, Hash und `trail` (jeder Schritt mit `x/y/cell/zoneId`). Seit T1.1 fließt der Trail in `fingerprintCombatLog`; `verifyCombatLog` deckt ihn über den Hash-Vergleich ab. Seit v7 trägt jede Einheit `ambushZoneId` und der Trail die Zone — deshalb ist der Log die einzige Ortsquelle, die ein Replay braucht. Invarianten erzwingen eindeutige IDs, ein schließendes `end`-Ereignis, Tick ≤ `log.ticks` und dass jede Einheit auf einer Trail-Zelle steht.
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
