# docs/REPOINDEX.md — Global

| Pfad | Job |
|------|-----|
| `.github/agents/critical-adversarial-reviewer.agent.md` | Freigegebenes schreibgeschütztes Aufgabenprofil für belegbasierte Tree- und Diff-Reviews |
| `.github/agents/berater.agent.md` | Freigegebenes schreibgeschütztes Second-Opinion-Profil: kurze, zynische Einschätzung zu Idee, Diff oder Gate-Ausgabe |
| `.github/copilot-instructions.md` | Kurzer Arbeitswegweiser mit Verweisen auf kanonische Regelwerke |
| `Agents.md` | Verbindlicher Einstieg für Sprache, Grundsätze und Regelwerkszuständigkeit |
| `docs/REGELWERK_ARCHITEKTUR.md` | Verbindliche Domain-, Ownership-, Datenwahrheits- und LOC-Regeln |
| `docs/REGELWERK_DOKUMENTATION.md` | Verbindliche Pflichtdoku-, Pflege-, Hygiene- und Archivregeln |
| `docs/REGELWERK_GIT.md` | Verbindliche Shinon-, Commit-, Versions- und Lifecycle-Regeln |
| `.gitattributes` | Erzwingt LF-Zeilenenden je Dateityp; Fixtures und Binaries ausgenommen |
| `VERSION` | Repo-Version (X.Y.Z, PATCH 0..99), Single Source of Truth |
| `pnpm-lock.yaml` | Reproduzierbare pnpm-Auflösung für alle Workspace-Projekte |
| `.github/workflows/shinon.yml` | Pflichtprüfung `Shinon Gate` bei Push auf `main` und PR; Job `promote` schiebt den geprüften PR-Kopf per Fast-Forward nach `main` |
| `docs/*` | Globale Pflicht-Doku und verbindliche Regelwerke (aktiv ≤200 Zeilen) |
| `.github/dependabot.yml` | Wöchentliche Dependency-Updates für das pnpm-Workspace (npm-Ökosystem) und den Devcontainer |
| `.devcontainer/devcontainer.json` | Devcontainer mit TypeScript-Node-Image und pnpm über Corepack |
| `docs/CONCEPT_REVIEW.md` | Kanonische ODT-Festlegungen (`[N]`/`[K]`/`[O]`) zu Sync, Snapshot, Matching, Beute und Pathfinding |
| `docs/CONCEPT_REVIEW_SECURITY.md` | Abgegrenzte manuelle Invalid-Request-/Account-Prüfmarke |
| `docs/ROADMAP.md` | Audit-basierte Produkt- und Technik-Roadmap mit T1/T2/T3-Promotion |
| `docs/DEV_REQUIREMENTS.md` | Toolchain-Voraussetzungen, Befehle, Gate-Matrix, Arbeitsablauf und Skills |
| `docs/historisch/` | Append-only Archiv, u. a. `2026-09-25_roadmap-t1-abgeschlossen.md` mit den abgeschlossenen T1.0/T1.2/T1.3/T1.3b-Blöcken |
| `packages/contracts/src` | Zod-Schemas, sim_version, Trail, Ergebnislog, Auftragsunion |
| `packages/sim-core/src/*` | Deterministischer Core (PRNG, Math, Grid, Combat, Genome, Items, Hash, Ghost) |
| `packages/client/src/*` | PWA Client: `world`/`visual`/`render`/`input`/`window`/`showcase` als sichtbare visuelle Basis, `dungeon-editor` als Grid-Owner, `village` als einziger Owner der Tag/Nacht/Raid-Phase, `ui` als Shell und Pixi-Host, `raid` als lokaler Fixture-Auftrag; Route-Index-Mapping und Actor-Varianten sind visuell konsistent |
| `packages/server/src/*` | Server (DB, Matchmaking, Sync) |
| `scripts/bump-version.mjs` | Mechanischer Version bump (PATCH→MINOR→MAJOR) |
| `.github/workflows/shinon.yml` | Pflichtprüfung für Pull Requests und `main`; Job `promote` schiebt den geprüften PR-Kopf per Fast-Forward nach `main` |
| `packages/contracts/src/index.ts` | Öffentliche Contract-v3-Exports mit Raid-Freeze, Grid, Handshakes, Trail und `sim_version` |
| `.agents/skills/` | Installierte Review-Skills (`code-slop`, `typescript-review`, `code-quality`), Registry in `skills-lock.json` |
| `scripts/shinon/engine.mjs` | Shinon Slicer + Runner (Base immer, Core nach Bedarf) |
| `scripts/shinon/lib/commit-text.mjs` | Einzige Quelle der Commit-Regeln, geteilt von lokalem Hook und CI-Plugin |
| `scripts/shinon/plugins/*` | Blockierende Governance-Module (global-loc, contract, modularity, dead-code, redundancy, commit-integrity) plus Slice-Plugins |
| `scripts/check-loc.mjs` | LOC-Cap Check |
| `scripts/check-hygiene.mjs` | Hygiene Check |
| `scripts/install-requirements.sh` | Bootstrap unter Linux/macOS: prüft Node, pnpm, Git, Python, installiert Dependencies, ruft Gate |
| `scripts/install-requirements.cmd` | Derselbe Bootstrap unter Windows |
