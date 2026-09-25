# packages/sim-core/docs/STRINGMATRIX.md

| Schlüssel | Bedeutung |
|-----------|-----------|
| `prng/mulberry32` | Seed → Zufallsstrom |
| `prng/derive` | seed + index + salt → Sub-Stream |
| `math/fixed` | Fixed-Point-Skala 1000 |
| `hash/fnv1a` | 32-Bit-Hash-Kette über Wörter und Text |
| `combat/stage` | `heroes-win`, `monsters-win`, `timeout` |
| `combat/event` | `move`, `attack`, `death`, `end` |
| `combat/role` | `hero`, `monster`, `boss` |
| `combat/side` | `heroes`, `monsters` |
| `grid/64x64` | Etagen-Größe, Zellen-Array |
| `grid/hard-block` | Letzte freie Route nicht zumauerbar |
| `combat/tick-rate` | Vorläufig 20 Ticks/s, 1800 Ticks maximal (`[K]`) |
