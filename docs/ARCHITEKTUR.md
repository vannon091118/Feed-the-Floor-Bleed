# docs/ARCHITEKTUR.md — Global

## Ziel

Deterministisches Async-Spiel mit geteiltem Core. Der Server nutzt `sim-core` (Fixed-Point, PRNG, Grid, Kampf, Zucht) für Berechnung und Validierung; der Client rendert und spielt serverseitig validierte Ergebnisse ab.

## Schichten

- `contracts` besitzt Zod-Schemas, Protokoll-Versionen (`sim_version`), Hash-Verträge. Keine Logik.
- `sim-core` besitzt reine Funktionen ohne I/O/Zeit/Zufall von außen. PRNG via Seed, A* mit festem Tie-Break.
- `client` besitzt UI, Rendering (PixiJS 8), PWA, Dexie, Net (Upload/Results sequenziell pro Etage).
- `server` besitzt D1, Queues, Pool, MMR-Band-Matching, Ghost-Fallback, Defender-State und Replay-Validierung; es gibt keine Live-Warteschlange.
- `scripts/shinon` besitzt Commit-Gate + Test-Suite, slice-basiert nach `git diff`. Full-Run nur in `pre-push`.

## Datenfluss Etagen-Loop (sequenziell)

Client `Upload(v2-Raid-Freeze + Taktiken)` → Server friert den vollständigen eigenen Snapshot in D1 ein → Server wählt MMR-Band-Ziel oder Ghost → Queue übergibt den Job → Headless-Worker berechnet den Kampf serverseitig → D1 speichert Ergebnis oder Timeout-Verlust → Client erhält Status/Playback. Kein Pre-Leak tieferer Etagen.

## Versionierung

`VERSION` im Root ist Single Source of Truth (`X.Y.Z`, PATCH 0..99 → MINOR 0..99 → MAJOR). `scripts/bump-version.mjs` bumped mechanisch nach jedem erfolgreichen Commit (amend mit aktiven Hooks, Loop-Schutz `SHINON_SKIP_BUMP=1`) und schreibt `VERSION` + alle `package.json` synchron. Der erste Root-Commit bleibt `0.0.1`; `version-gate` prüft Sync. GitHub Actions erzwingt den vollständigen Check `Shinon Gate`; Branch-Protection auf `main` verlangt diesen Status vor Merge.

## Owner-Grenzen

Siehe `Agents.md` §3. `village` ↔ `dungeon` isoliert, `raid-sim` kein I/O, `sync` keine Spielregeln.
