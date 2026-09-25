# packages/client/docs/STRINGMATRIX.md

| Schlüssel | Bedeutung |
|-----------|-----------|
| `ui/tabs` | Dorf, Dungeon, Zucht, Raid, Inventar |
| `ui/phase` | Lokale Tagesphase `'day' \| 'night'` der Shell |
| `editor/brush1-2-4` | Pinselgrößen (4 = sichtbares Tile) |
| `editor/brush` | Aktiver Pinsel `'empty' \| 'wall' \| 'trap'` |
| `raid/tactics3` | 3 Regeln/Held, If-Then |
| `raid/job-id` | `fixture-raid-1` — Job-ID und Token des Probelaufs |
| `raid/seed` | `4242` — fester Fixture-Seed, keine Uhr, kein Zufall |
| `raid/floor` | `1` — Etage des Fixture-Auftrags |
| `raid/created-at` | `0` — feste Auftragszeit, Fristprüfung im Core |
| `raid/observed-at` | `1` — feste Beobachtungszeit |
| `raid/hero-id` | `hero-mara`, `hero-bram`, `hero-nell` |
| `raid/monster-id` | `monster-frost-1`, `monster-frost-2`, sonst `null` |
| `raid/status` | `completed`, `failed`, `expired` — lokaler Probelauf |
| `net/token` | Server-Token für Seed-Vergabe |
| `storage/dexie` | IndexedDB Name/Version |
