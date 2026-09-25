# docs/REPOINDEX.md — Global

| Pfad | Job |
|------|-----|
| `Agents.md` | Einzige kanonische Governance für Agenten und Contributor (Gesetz) |
| `VERSION` | Repo-Version (X.Y.Z, PATCH 0..99), Single Source of Truth |
| `pnpm-lock.yaml` | Reproduzierbare pnpm-Auflösung für alle Workspace-Projekte |
| `.github/workflows/shinon.yml` | Pflichtprüfung `Shinon Gate` bei jedem Push auf `main` |
| `docs/*` | Globale Pflicht-Doku (aktiv ≤200 Zeilen) |
| `docs/CONCEPT_REVIEW.md` | Kanonische allgemeine Sync-/Snapshot-/Matching-/Wett-/XP-/Pfadregeln |
| `docs/CONCEPT_REVIEW_SECURITY.md` | Abgegrenzte manuelle Invalid-Request-/Account-Prüfmarke |
| `docs/ROADMAP.md` | Audit-basierte Produkt- und Technik-Roadmap mit T1/T2/T3-Promotion |
| `docs/historisch/` | Append-only Archiv |
| `packages/contracts/src` | Zod-Schemas, sim_version |
| `packages/sim-core/src/*` | Deterministischer Core (PRNG, Math, Grid, Combat, Genome, Items, Hash, Ghost) |
| `packages/client/src/*` | PWA Client (Editor, Village, Raid, Inventory, Net, Storage, UI) |
| `packages/server/src/*` | Server (DB, Matchmaking, Sync) |
| `scripts/bump-version.mjs` | Mechanischer Version bump (PATCH→MINOR→MAJOR) |
| `.github/workflows/shinon.yml` | Pflichtprüfung für Pull Requests und `main` |
| `packages/contracts/src/index.ts` | Öffentliche Contract-v2-Exports mit Raid-Freeze, Grid, Handshakes und `sim_version` |
| `scripts/shinon/engine.mjs` | Shinon Slicer + Runner (Base immer, Core nach Bedarf) |
| `scripts/shinon/plugins/*` | Blockierende Governance-Module (global-loc, contract, modularity, dead-code, redundancy) plus Slice-Plugins |
| `scripts/check-loc.mjs` | LOC-Cap Check |
| `scripts/check-hygiene.mjs` | Hygiene Check |
