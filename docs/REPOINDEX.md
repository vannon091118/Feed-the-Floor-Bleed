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
| `.github/workflows/shinon.yml` | Pflichtprüfung `Shinon Gate` bei Push auf `main` und PR; Job `promote` schiebt den geprüften PR-Kopf per Fast-Forward mit `PROMOTE_TOKEN` nach `main` |
| `.github/workflows/main-watchdog.yml` | Meldet zwei Arten von Vorfall als offenen Issue: roter Push-Lauf auf `main` (Label `watchdog`) und am `promote` gescheiterter Pull-Request-Lauf (Label `promote-blocked`); der Push-Pfad ist per Konstruktion fail-open |
| `wrangler.jsonc` | Konfiguration für `feed-the-floor-bleed.vannon-fs.workers.dev`, gelesen von der installierten App `cloudflare-workers-and-pages` bei jedem Push auf `main`: Worker-Einstieg `packages/server/src/worker.ts`, Assets aus `packages/client/dist`, `run_worker_first: ["/api/*"]`, persistente Worker-Logs über `observability.logs`, D1-Bindung auskommentiert. Kein Deploy-Schritt und kein Cloudflare-Secret im Repo |
| `scripts/shinon/tests/cloudflare-deploy.test.mjs` | Vertragstest für Worker-Konfiguration, `run_worker_first`, Bündel-Probe, das Fehlen eines eigenen Deploy-Schritts und kostenfreie Runner |
| `docs/*` | Globale Pflicht-Doku und verbindliche Regelwerke (aktiv ≤200 Zeilen) |
| `.github/dependabot.yml` | Wöchentliche Dependency-Updates für das pnpm-Workspace (npm-Ökosystem) und den Devcontainer |
| `.devcontainer/devcontainer.json` | Devcontainer mit TypeScript-Node-Image und pnpm über Corepack |
| `docs/CONCEPT_REVIEW.md` | Kanonische ODT-Festlegungen (`[N]`/`[K]`/`[O]`) zu Sync, Snapshot, Matching, Beute und Pathfinding |
| `docs/CONCEPT_REVIEW_SECURITY.md` | Abgegrenzte manuelle Invalid-Request-/Account-Prüfmarke |
| `docs/ROADMAP.md` | Audit-basierte Produkt- und Technik-Roadmap mit T1/T2/T3-Promotion |
| `docs/VISUAL_GRUNDSATZ.md` | Freigegebene E1–E6-Visual-/Asset-Grundsätze, Expeditionsregeln, Balancefreigaben und serielle Sprintfolge |
| `docs/DEV_REQUIREMENTS.md` | Toolchain-Voraussetzungen, Befehle, Gate-Matrix, Arbeitsablauf und Skills |
| `docs/historisch/` | Append-only Archiv, u. a. `2026-09-25_roadmap-t1-abgeschlossen.md` mit den abgeschlossenen T1.0/T1.2/T1.3/T1.3b-Blöcken, `2026-09-25_changelog-backend-und-initialstand.md` mit Backend- und Initialphase, `2026-09-25_changelog-t1-kern-und-governance.md` mit T1-Kern und Governance, `2026-09-25_changelog-sichtbare-basis-und-tooling.md` mit sichtbarer Basis, Entwicklungsumgebung und Governance-Härtung sowie `2026-09-26_changelog-agenten-und-visuelle-foundation.md` mit den Agent-Profilen, der `Agents.md`-Entlastung und der visuellen Foundation sowie `2026-09-26_changelog-promote-und-roadmap.md` mit dem Promote-Job und der Roadmap-Nummerierung und `2026-09-26_changelog-konsistenz-und-foundation.md` mit dem Verankerungs-Pass, der T1.2-Abnahme und dem Foundation-Audit sowie `2026-09-26_roadmap-t1-blocks.md` mit den abgeschlossenen T1.1-/T1.2-Blöcken und `2026-09-27_roadmap-t2-1.md` mit dem abgeschlossenen T2.1-Block und `2026-09-26_changelog-dependabot-und-devcontainer.md` mit dem Dependabot- und Devcontainer-Eintrag sowie `2026-09-26_changelog-konsistenz-pass.md` mit dem Konsistenz-Pass nach den fünf Merges. Alle Changelog-Archive sind wortgleich aus `docs/CHANGELOG.md` gewandert |
| `packages/contracts/src` | Zod-Schemas, sim_version, Trail, Ergebnislog, Auftragsunion |
| `packages/sim-core/src/*` | Deterministischer Core (PRNG, Math, Grid, Combat, Genome, Items, Hash, Ghost) |
| `packages/client/src/*` | PWA Client: `world`/`visual`/`render`/`input`/`window`/`showcase` als sichtbare visuelle Basis, `dungeon-editor` als Grid-Owner, `village` als einziger Owner der Tag/Nacht/Raid-Phase, `ui` als Shell und Pixi-Host, `raid` als lokaler Fixture-Auftrag; Route-Index-Mapping und Actor-Varianten sind visuell konsistent |
| `packages/server/src/*` | Server: `db` als Persistenz- und Zustands-Owner, `worker.ts` als schmaler HTTP-Rand (`/api/health`, `/api/sync/checkpoint`, `/api/sync/job/:id`), `matchmaking` und `sync` noch leer |
| `scripts/bump-version.mjs` | Next-Bump-Zähler mit Basis aus `origin/main` (PATCH→MINOR→MAJOR, verweigert doppelte Nummern) |
| `.agents/skills/` | Installierte Review-Skills (`code-slop`, `typescript-review`, `code-quality`), Registry in `skills-lock.json` |
| `scripts/shinon/engine.mjs` | Shinon Slicer + Runner (Base immer, Core nach Bedarf) |
| `scripts/shinon/lib/commit-text.mjs` | Einzige Quelle der Commit-Regeln, geteilt von lokalem Hook und CI-Plugin |
| `scripts/shinon/plugins/*` | Blockierende Governance-Module (global-loc, contract, modularity, dead-code, redundancy, commit-integrity) plus Slice-Plugins |
| `scripts/shinon/tests/gate-parity.test.mjs` | Paritätsvertrag: vergleicht die `run:`-Befehle des `gate`-Jobs mit dem lokalen `gate`-Script, prüft `gate:quick` als Teilmenge und verbietet kostenpflichtige Runner |
| `scripts/shinon/tests/main-writer.test.mjs` | Einziger Schreiber nach `main`: fährt den echten `pre-push`-Hook mit einer `main`-Refspec, verlangt Ablehnung vor der Suite, Durchlass für Feature-Branches, ausdrückliche Freigabe für den Notfallweg und die Sperre auch im Generator `install-hooks.mjs` |
| `scripts/watchdog-classify.mjs` | Einzige Wahrheit, ob ein abgeschlossener Shinon-Lauf ein Vorfall ist: meldet rote Push-Läufe auf `main` und gescheiterte `promote`-Läufe, schweigt bei rotem Gate und Feature-Branch-Pushes; liefert Titel, Label und Fließtext |
| `scripts/shinon/tests/watchdog-classify.test.mjs` | Zusicherung für den Watchdog-Klassifizierer inklusive Gegenproben: rotes Gate und roter Feature-Branch-Push dürfen keinen Vorfall erzeugen, und `renderIssue` darf für keinen Nicht-Vorfall einen Text erfinden |
| `scripts/check-loc.mjs` | LOC-Cap Check |
| `scripts/break-glass-main.mjs` | Notfallweg bei Ausfall von GitHub Actions: serialisiert den Protection-Zustand, lockt minimal nur `required_status_checks` und stellt wieder her; `--dry-run` verändert nichts |
| `scripts/check-hygiene.mjs` | Hygiene Check |
| `scripts/install-requirements.sh` | Bootstrap unter Linux/macOS: prüft Node, pnpm, Git, Python, installiert Dependencies, ruft Gate |
| `scripts/install-requirements.cmd` | Derselbe Bootstrap unter Windows |
