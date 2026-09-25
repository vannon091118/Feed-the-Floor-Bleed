# packages/server/docs/ARCHITEKTUR.md

## Rolle

Autoritative Instanz für Defender-State, Pool, Validierung und Progression-Tor (Attraktivität).

## Module

- `db` Snapshots (RLE+deflate, `sim_version`), Team, Defender-State (Moral, Schutz, Steinverluste, Loss-XP), Sperren, Scores, Log
- `matchmaking` Blind-Zuweisung im Score-Bracket (Team-Score vs Dungeon-Score), nie eigener Dungeon, 7T lokale Sperre, Ghost fallback
- `sync` Upload/Results, Token/Seed-Vergabe pro Etage, Replay-Validierung via sim-core Hash, sequenzieller Etagen-Loop

## Regeln

Validierung via eigener Rechnung (Hash), Loot aus Server-Rechnung. Vertrauen in v1 nur bei Steinen plausibilisiert (`Tier ≤ f(Gen,Score)`).
