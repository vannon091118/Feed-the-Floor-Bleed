# docs/REPOINDEX.md — Global

| Pfad | Job |
|------|-----|
| `Agents.md` | Governance (Gesetz) |
| `.github/agents/Agents.md` | Governance-Mirror für GitHub Agents |
| `VERSION` | Repo-Version (X.Y.Z, PATCH 0..99), Single Source of Truth |
| `docs/*` | Globale Pflicht-Doku (aktiv ≤200 Zeilen) |
| `docs/historisch/` | Append-only Archiv |
| `packages/contracts/src` | Zod-Schemas, sim_version |
| `packages/sim-core/src/*` | Deterministischer Core (PRNG, Math, Grid, Combat, Genome, Items, Hash, Ghost) |
| `packages/client/src/*` | PWA Client (Editor, Village, Raid, Inventory, Net, Storage, UI) |
| `packages/server/src/*` | Server (DB, Matchmaking, Sync) |
| `scripts/bump-version.mjs` | Mechanischer Version bump (PATCH→MINOR→MAJOR) |
| `.github/workflows/shinon.yml` | Pflichtprüfung für Pull Requests und `main` |
| `packages/contracts/src/index.ts` | Minimaler Contracts-Einstieg mit `sim_version` |
| `scripts/shinon/engine.mjs` | Shinon Slicer + Runner (Base immer, Core nach Bedarf) |
| `scripts/shinon/plugins/*` | Slice-Plugins (loc, hygiene, version, commit, determinism, contract, false-positive) |
| `scripts/check-loc.mjs` | LOC-Cap Check |
| `scripts/check-hygiene.mjs` | Hygiene Check |
