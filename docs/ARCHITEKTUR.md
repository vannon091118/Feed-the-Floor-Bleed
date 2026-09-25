# docs/ARCHITEKTUR.md — Global

## Ziel

Deterministisches Async-Spiel mit geteiltem Core. Client und Server nutzen denselben `sim-core` (Fixed-Point, PRNG, Grid, Kampf, Zucht). Client rendert, Server validiert.

## Schichten

- `contracts` besitzt Zod-Schemas, Protokoll-Versionen (`sim_version`), Hash-Verträge. Keine Logik.
- `sim-core` besitzt reine Funktionen ohne I/O/Zeit/Zufall von außen. PRNG via Seed, A* mit festem Tie-Break.
- `client` besitzt UI, Rendering (PixiJS 8), PWA, Dexie, Net (Upload/Results sequenziell pro Etage).
- `server` besitzt DB, Pool, Blind-Matchmaking, Defender-State, Replay-Validierung.
- `scripts/shinon` besitzt Commit-Gate + Test-Suite, slice-basiert nach `git diff`. Full-Run nur in `pre-push`.

## Datenfluss Etagen-Loop (sequenziell)

Client `Upload(Dungeon+Team+Tactics)` → Server vergibt `Seed1 + Etage1` → Client simuliert, sendet `Results(N, Hash)` → Server validiert (Replay) → `Weiter?` → Server gibt `Seed N+1 + Snapshot N+1`. Kein Pre-Leak tieferer Etagen.

## Versionierung

`VERSION` im Root ist Single Source of Truth (`X.Y.Z`, PATCH 0..99 → MINOR 0..99 → MAJOR). `scripts/bump-version.mjs` bumped mechanisch nach jedem erfolgreichen Commit (amend mit aktiven Hooks, Loop-Schutz `SHINON_SKIP_BUMP=1`) und schreibt `VERSION` + alle `package.json` synchron. Der erste Root-Commit bleibt `0.0.1`; `version-gate` prüft Sync. GitHub Actions erzwingt den vollständigen Check `Shinon Gate`; Branch-Protection auf `main` verlangt diesen Status vor Merge.

## Owner-Grenzen

Siehe `Agents.md` §3. `village` ↔ `dungeon` isoliert, `raid-sim` kein I/O, `sync` keine Spielregeln.
