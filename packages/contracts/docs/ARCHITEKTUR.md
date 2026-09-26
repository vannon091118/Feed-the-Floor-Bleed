# packages/contracts/docs/ARCHITEKTUR.md

## Rolle

Single Source of Truth für versionierte Schemas, Payloads und `sim_version`. Das Package enthält ausschließlich Zod-Schemas, Typinferenz und Konstanten; keine I/O- oder Geschäftslogik.

## Versionierung

- `CONTRACT_VERSION = 3` kennzeichnet das Wire-Format major.
- `sim_version = "0.0.2"` ist die einzige von v3 akzeptierte Simulationsversion.
- Upload, Match, Result, Ergebnislog, Auftrag, Fehler und jeder eigenständige Raid-Snapshot tragen beide Pflichtfelder `contractVersion` und `simVersion`.
- Ein v3-Empfänger akzeptiert nur exakt diese Kombination. v1/v2 und inkompatible Folgestände scheitern vor jeder Domänenverarbeitung.
- Inkompatible Form- oder Bedeutungsänderungen erhöhen `CONTRACT_VERSION`; Korrekturen ohne Änderung des akzeptierten JSON dürfen v3 erhalten. Unbekannte Felder werden nicht ignoriert.
- Grid- und Pathfinding-Schemas sind versionierte Runtime-Werte des v3-Vertrags, aber noch kein eigenständiges Transportformat.

## Kanonischer Raid-Freeze

`RaidSnapshotSchema` enthält ausschließlich die bestätigten Freeze-Daten:

- `resources`: sichere Ganzzahlen `gold` und `materials`.
- `monsterSlots`: exakt fünf Slots mit `monsterId: string | null`.
- `activeTeam`: ein bis fünf aktive Helden mit `heroId`, `temporaryFatigue` und `temporaryInjury` als sichere Ganzzahlen.
- `dungeon`: bestehender 64×64-Grid-Contract.

Der Contract legt keine Formeln, Grenzen, Umrechnungen oder Gameplay-Effekte für Ressourcen, Müdigkeit oder Verletzung fest. Taktiken gehören zum `UploadRequest`, werden aber nicht als Teil des eingefrorenen Raid-Snapshots persistiert.

## Vertragsumfang

- `PathResultSchema`: die drei bestehenden Modi sowie Pfad, Bewegungskosten und Umwegkosten.
- `UploadRequestSchema`: vollständiger `RaidSnapshot` plus `tactics`; genau eine Taktikliste je aktivem Helden.
- `MatchResponseSchema`: `seed`, `floor` und ein vollständiger versionierter `RaidSnapshot` als späteres Ziel.
- `ResultPayloadSchema`: `token`, `floor`, `hash` und typisiertes `CombatSummary`.
- `RaidLogPayloadSchema`: derselbe Hash plus der vollständige `CombatLog`. Eigenes Artefakt, damit `result_json` klein bleibt.
- `CombatLogSchema`: Config, Einheiten, Ereignisse, Stufe, Ticks, Hash und `trail` (jeder Schritt mit `x/y/cell`). Seit T1.1 fließt der Trail in `fingerprintCombatLog`; `verifyCombatLog` deckt ihn über den Hash-Vergleich ab. Invarianten erzwingen eindeutige IDs, ein schließendes `end`-Ereignis und Tick ≤ `log.ticks`.
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
