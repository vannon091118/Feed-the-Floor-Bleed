# packages/contracts/docs/ARCHITEKTUR.md

## Rolle

Single Source of Truth für alle Protokoll-Typen, Payloads und `sim_version`.

## Besitz

- Schemas für `proto/upload`, `proto/results`, `proto/match`, Snapshot (RLE+deflate), Steine (Tier-Grenze).
- Keine Logik, keine I/O, nur Zod + Konstanten.

## Abhängigkeiten

Keine. `sim-core`, `client`, `server` importieren von hier — nie umgekehrt.
