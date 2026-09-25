# docs/ARCHITEKTUR.md — Global

## Ziel

Deterministisches Async-Spiel mit geteiltem Core. Der Server nutzt `sim-core` (Fixed-Point, PRNG, Grid, Kampf, Zucht) für Berechnung und Validierung; der Client rendert und spielt serverseitig validierte Ergebnisse ab.

## Schichten

- `contracts` besitzt Zod-Schemas, Protokoll-Versionen (`sim_version`), Hash-Verträge, Ergebnislog und den Auftragsautomaten. Keine Logik.
- `sim-core` besitzt reine Funktionen ohne I/O/Zeit/Zufall von außen. PRNG via Seed, A* mit festem Tie-Break, Combat-Ticks, kanonischer Log-Hash, Replay und die lokale Fixture-Ausführung eines Auftrags.
- `client` besitzt UI, Rendering (PixiJS 8), PWA, Dexie, Net (Upload/Results sequenziell pro Etage). T1.3 zeigt dort einen echten Core-Lauf, entscheidet aber nichts selbst.
- `server` besitzt D1, Queues, Pool, Defender-State und Replay-Validierung; MMR-Matching und Ghost-Fallback sind geplante Zielmodule, aber keine bestätigten Spielregeln (siehe `docs/CONCEPT_REVIEW.md`).
- `scripts/shinon` besitzt Commit-Gate + Test-Suite, slice-basiert nach `git diff`. Full-Run nur in `pre-push`.

## Datenfluss T1.3 (belegter Ist-Stand)

Editor-Grid plus Fixture-Aufstellung → `buildFixtureUpload` erzeugt einen Contract-v2-Upload → `toDungeonGrid` übersetzt die 4096 Zellen in das Laufzeit-Grid → `runFixtureRaid` prüft Schema, Auftragsfrist und Route, rechnet den Kampf, replayt den geparsten Log und gibt einen durch `RaidJobSchema` validierten Auftrag zurück → `RaidPanel` rendert Stufe, Hash und Kennzahlen. Kein Netz, keine Uhr, kein Serverentscheid.

Ergebnis und vollständiger Log sind zwei Payloads: `ResultPayloadSchema` trägt `token`, `floor`, `hash` und die typisierte Summary, `RaidLogPayloadSchema` zusätzlich den Log. Das hält die D1-Zeile klein und lässt den Log bei Bedarf nachladen.

## Datenfluss Etagen-Loop (geplanter Zielpfad, technisch)

Client `Upload(v2-Raid-Freeze + Taktiken)` → Server friert den vollständigen eigenen Snapshot in D1 ein → Server wählt MMR-Band-Ziel oder Ghost → Queue übergibt den Job → Headless-Worker berechnet den Kampf serverseitig → D1 speichert Ergebnis oder Timeout-Verlust → Client erhält Status/Playback. Kein Pre-Leak tieferer Etagen.

## Versionierung

`VERSION` im Root ist Single Source of Truth (`X.Y.Z`, PATCH 0..99 → MINOR 0..99 → MAJOR). `scripts/bump-version.mjs` bumped mechanisch nach jedem erfolgreichen Commit (amend mit aktiven Hooks, Loop-Schutz `SHINON_SKIP_BUMP=1`) und schreibt `VERSION` + alle `package.json` synchron. Der erste Root-Commit bleibt `0.0.1`; `version-gate` prüft Sync. GitHub Actions wiederholt den vollständigen Check `Shinon Gate` bei jedem Push auf `main`; der lokale Pre-Push-Gate bleibt die erste Sperre.

## Owner-Grenzen

Siehe `Agents.md` §3. `village` ↔ `dungeon` isoliert, `raid-sim` kein I/O, `sync` keine Spielregeln. Der Auftragsstatus liegt seit T1.3 im Contract; Server und D1 dürfen ihn nur durchsetzen, nicht neu erfinden.
