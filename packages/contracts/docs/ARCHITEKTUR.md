# packages/contracts/docs/ARCHITEKTUR.md

## Rolle

Single Source of Truth für versionierte Schemas, Payloads und `sim_version`. Das Package enthält ausschließlich Zod-Schemas, Typinferenz und Konstanten; keine I/O- oder Geschäftslogik.

## Versionierung

- `CONTRACT_VERSION = 2` kennzeichnet das Wire-Format major.
- `sim_version = "0.0.1"` ist die einzige von v2 akzeptierte Simulationsversion.
- Upload, Match, Result, Fehler und jeder eigenständige Raid-Snapshot tragen beide Pflichtfelder `contractVersion` und `simVersion`.
- Ein v2-Empfänger akzeptiert nur exakt diese Kombination. V1 und inkompatible Folgestände scheitern vor jeder Domänenverarbeitung.
- Inkompatible Form- oder Bedeutungsänderungen erhöhen `CONTRACT_VERSION`; Korrekturen ohne Änderung des akzeptierten JSON dürfen v2 erhalten. Unbekannte Felder werden nicht ignoriert.
- Grid- und Pathfinding-Schemas sind versionierte Runtime-Werte des v2-Vertrags, aber noch kein eigenständiges Transportformat.

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
- `ResultPayloadSchema`: `token`, `floor`, `hash` und verschachtelbares JSON-`summary`.
- `ErrorPayloadSchema`: ausschließlich `blocked`, `invalid-hash` und `protected`.

## Abhängigkeiten

Keine. `sim-core`, `client` und `server` importieren von hier — nie umgekehrt. Das Modularity-Gate erzwingt zusätzlich, dass `sim-core` weder Server noch Client importiert.
