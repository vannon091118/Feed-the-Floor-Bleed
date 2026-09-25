# packages/contracts/docs/FUNKTIONSGRAPH.md

```text
version/constants → RaidSnapshotSchema
RaidSnapshotSchema → UploadRequestSchema
RaidSnapshotSchema → MatchResponseSchema
version/constants → CombatLogSchema → CombatSummarySchema
CombatLogSchema → ResultPayloadSchema
CombatLogSchema → RaidLogPayloadSchema
ResultPayloadSchema + ErrorPayloadSchema → RaidJobSchema
version/constants + ErrorPayloadSchema + ResultPayloadSchema → job.ts (Automat)
contracts → sim-core/combat (Log-Erzeugung, Fixture-Auftrag)
contracts → server/db (Validierung, Persistenz, Übergänge)
contracts → client/raid (Payload-Bau, Anzeige)
```

`server/db` persistiert ausschließlich den kanonischen Raid-Freeze; Taktiken bleiben Uploaddaten. Status, Übergänge und Fehlercodes kommen seit T1.3 aus `job.ts` und `protocol.ts`, damit D1, Server und Client dieselben Strings benutzen. `sim-core` darf `@floor/contracts` importieren, niemals Client oder Server. Contracts selbst importieren nur Zod und lokale Dateien. Keine zyklischen Kanten.
