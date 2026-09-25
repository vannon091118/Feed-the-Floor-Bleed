# docs/historisch/2026-09-25_roadmap-t1-abgeschlossen.md — Abgeschlossene T1-Blöcke

Abgelegt aus `docs/ROADMAP.md` am 2026-09-25. Aktive Roadmap danach nachgerutscht auf kanonische T1.1–T1.3.

## T1.0 — pnpm als einziger Paketmanager, reproduzierbarer Lockfile-Stand und angepasste CI

Abgeschlossen 2026-09-25. `pnpm install --frozen-lockfile`, `pnpm-lock.yaml` vorhanden, `package-lock.json` entfernt, `packageManager` und Workspace auf pnpm, CI nutzt pnpm, alle Checks laufen mit derselben Toolchain.

## T1.2 — Deterministischer Combat-, Hash- und Replay-Core

Abgeschlossen 2026-09-25. `packages/sim-core` besitzt `prng` (Mulberry32 plus Seed-Ableitung), `math` (Fixed-Point, isqrt), `hash` (FNV-1a) und `combat` (bounded Tick-Simulation, Event-Log, kanonischer Log-Hash, Replay). Gleicher Seed plus Snapshot liefern denselben Hash und identischen Log. `resolveCombat`, `simulateCombat`, `replayCombat`, `verifyCombatLog` öffentlich. 20 neue Core-Tests, Gesamt 16 Testdateien und 80 Tests.

## T1.3 — Contract-v2-Ergebnislog und lokale Fixture-Job-Ausführung

Abgeschlossen 2026-09-25. `packages/contracts/src/combat-log.ts` und `src/job.ts` mit strikten Schemas für Config, Einheiten, Events, Log, typisierte Summary und Auftrag als Diskriminated Union über `status`. `ResultPayloadSchema.summary` typisiert, `RaidLogPayloadSchema` trägt vollständigen Log separat, `ErrorCodeSchema` auf fünf Codes erweitert. `packages/sim-core/src/grid/serialize.ts` und `src/combat/{summary,resolve-snapshot,fixture-job}.ts` übersetzen Payload zu Grid und führen Aufträge lokal ohne Netz, ohne Uhr und ohne Zufall aus. `runFixtureRaid` prüft Schema, Frist, Route und Replay-Hash. `packages/server/src/db/job-state.ts` und `raid-store.ts` übernehmen Status, TTL und Übergänge aus dem Contract. `packages/client/src/raid/` zeigt Fixture-Ergebnis. 24 neue Tests, Gesamt 20 Testdateien und 104 Tests, `CONTRACT_VERSION` bleibt 2.

## T1.3b — Sichtbare visuelle Basis

Abgeschlossen 2026-09-25. `pixi.js@^8` in `packages/client/package.json` und `pnpm-lock.yaml`, neuer Aufbau `world` (Definitionen), `visual` (Observer, Deskriptoren), `render` (Pixi-Szene, Kamera, Depth, Terrain, Actors, FX, Filter), `input` (Pointer, Hit-Test, Drag), `window` (Preact-Fenster), `showcase` (Referenzszene), `src/main.tsx` rendert im Browser. `Agents.md` §3 und §4 sowie `scripts/shinon/policy.json` um sechs Owner- und Cap-Zeilen ergänzt. Szene rechnet lokalen Fixture-Lauf aus `resolveSnapshotRaid`, entscheidet nichts. `pnpm --filter @floor/client dev` lauffähig. Trail-Hash bleibt offen und wird vor Playback nachgezogen.

Quelle: `docs/ROADMAP.md` Stand 2026-09-25 vor dem Nachrutschen, `docs/CHANGELOG.md` und `docs/ARCHITEKTUR.md` belegen denselben Stand.
