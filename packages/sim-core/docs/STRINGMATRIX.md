# packages/sim-core/docs/STRINGMATRIX.md

| Schlüssel | Bedeutung |
|-----------|-----------|
| `prng/mulberry32` | Seed → Zufallsstrom |
| `prng/derive` | seed + index + salt → Sub-Stream |
| `math/fixed` | Fixed-Point-Skala 1000 |
| `hash/fnv1a` | 32-Bit-Hash-Kette über Wörter und Text |
| `genome/trait` | `toughHide`, `keenEdge`, `deepLungs`, `heavyTread`, `restless`, `focused` |
| `genome/bonus` | `bulwark`, `frenzy`, `endurance`, `swiftness`, `precision`, `vitality` |
| `genome/element` | Drei Elemente je Monster, ganzzahlig in Permille, Grenze `1000` (1,00) bis `10000` (10,00) |
| `genome/generation` | `1` beim Basis-Monster, jede Zucht oder Mutation erhöht um `1` |
| `combat/stage` | `heroes-win`, `monsters-win`, `timeout`, `extracted`; `extracted` setzt der Auftrag, die Engine liefert ihn nicht |
| `combat/event` | `move`, `attack`, `death`, `ambush`, `ability`, `reveal`, `end` |
| `combat/class` | `none`, `vanguard`, `breaker`, `scout`, `medic`, `controller`, `guardian` — Vokabular aus `@floor/contracts/abilities.ts`, hier nur gelesen |
| `combat/ability` | `shield`, `shatter`, `reveal`, `mend`, `frost`, `hold` — je eine pro Klasse, `reveal` gehört dem Späher |
| `combat/tactic-when` | `immediate`, `allyBelow`, `selfBelow`, `bossNear`; `thresholdPermille` (0..1000) ist bei den beiden `Below`-Arten Pflicht und sonst verboten |
| `combat/condition` | Nachwirkung eines Helden auf die Initiative: eine Wunde 20 %, eine Stufe Erschöpfung 10 %, verkettet gerechnet und bei fünf Stufen gekappt; die `[K]`-Werte stehen in `src/combat/conditions.ts` |
| `combat/role` | `hero`, `monster`, `boss` |
| `combat/side` | `heroes`, `monsters` |
| `grid/64x64` | Etagen-Größe, Zellen-Array |
| `grid/hard-block` | Letzte freie Route darf nicht zugemauert werden |
| `combat/tick-rate` | Vorläufig 20 Ticks/s, 1800 Ticks maximal (`[K]`) |
| `combat/timeout` | Kampf-Timeout: `stage: 'timeout'` in einem erfolgreichen Ergebnis |
| `job/timeout` | Auftrags-Timeout: `status: 'expired'` mit `code: 'timeout'` |
| `job/status` | `accepted`, `queued`, `running`, `completed`, `failed`, `expired` |
| `job/failure-code` | `blocked`, `invalid-hash`, `invalid-request`, `protected`, `timeout` |
| `job/detail` | Stabiler Feldpfad des ersten fehlgeschlagenen Upload-Feldes |
| `summary/*` | Stufe, Ticks, Hash, Ereignisse, Angriffe, Schaden, Überlebende, Boss |
| `grid/serialize` | Contract-Payload ↔ `Uint8Array`, 4096 Zellen, kopierend |
