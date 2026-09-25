# packages/contracts/docs/FUNKTIONSGRAPH.md

```text
version/constants → RaidSnapshotSchema
RaidSnapshotSchema → UploadRequestSchema
RaidSnapshotSchema → MatchResponseSchema
contracts → sim-core/types (Typen)
contracts → server/db (Validierung und Persistenz)
contracts → client/net (Payload-Bau)
```

`server/db` persistiert ausschließlich den kanonischen Raid-Freeze; Taktiken bleiben Uploaddaten. `sim-core` darf `@floor/contracts` importieren, niemals Client oder Server. Contracts selbst importieren nur Zod und lokale Dateien. Keine zyklischen Kanten.
