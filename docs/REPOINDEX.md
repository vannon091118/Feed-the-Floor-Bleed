# docs/REPOINDEX.md — Global

| Pfad | Job |
| ------ | ----- |
| `.github/agents/critical-adversarial-reviewer.agent.md` | Freigegebenes schreibgeschütztes Aufgabenprofil für belegbasierte Tree- und Diff-Reviews |
| `.github/agents/berater.agent.md` | Freigegebenes schreibgeschütztes Second-Opinion-Profil: kurze, zynische Einschätzung zu Idee, Diff oder Gate-Ausgabe |
| `.github/agents/mia.agent.md` | Freigegebenes schreibgeschütztes Profil für Spielerperspektive, Produktkohärenz, visuelle Identität und Vision-Schutz |
| `.github/agents/camilla.agent.md` | Freigegebenes Profil für Grafik, UI und PixiJS-Fachgebiet; einziges Profil mit `edit`, begrenzt auf die sichtbaren Owner, und im Audit schreibgeschützt |
| `.github/skills/camilla/SKILL.md` | Verbindliche Arbeitsweise jeder sichtbaren Änderung: Beobachter-Gesetz, keine Technik im Spielbild, Absicht vor Dekoration, Prüfschritte |
| `.github/skills/camilla/references/beobachter.md` | Begründung und Naht-Signaturen des Beobachter-Prinzips in diesem Repo, erlaubte Schreibpfade der Sichtbarkeit und der Naht-Test |
| `.github/skills/camilla/references/pixijs.md` | PixiJS-v8-Kurzfassung für die Szene dieses Repos: Aufbau, Ebenen, Depth, Texturen, Draw Calls, Zerstörung, Leistung, v8-Fallen |
| `.github/skills/camilla/references/oberflaeche.md` | DOM-Oberfläche: Tokens, Szenen/DOM-Trennung, Fenster, Textquellen, Zahlen, Icons, Tastatur, Screenreader, reduzierte Bewegung |
| `.github/skills/fuenf-perspektiven-audit/SKILL.md` | Verbindet LEX, Kritischen Adversarial Reviewer, Contexti, Camilla und Mia zum festen, sequenziellen 5-Perspektiven-Audit über Tree, Diff oder PR; löst Perspektivkollisionen nicht selbst auf |
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
| `docs/ENTWICKLERMAP.md` | **Entwicklermap:** rekursiv aus der Roadmap abgeleiteter Baum aus Track, Slice und Pruefpunkt mit aktueller Position, Legende, Freigabe-Sperren und Ort jeder Zahl |
| `docs/LORE.md` | **Die Spielwelt in ein paar Saetzen:** Boden, Wächter und Fremder, der Boss als einziges Wesen ohne Genetik, Moral, Zucht — erklärt die vorhandene Mechanik, erfindet keine |
| `docs/assets/banner-zeitachse.svg` | **Versionstimeline als Abtauchung:** 26 Sprossen an fuenf Etagen, von 0.0.1 auf der Oberflaeche bis 0.0.90 als JETZT, mit den neun Contract- und Sim-Spruengen an der Achse; die offene Etage 0.1.0 als gestricheltes Ende. Abgeleitet aus `git log -- VERSION` und `docs/ENTWICKLERMAP.md`; jede Sprosse steht belegbar im Commit-Log, keine ist erfunden |
| `docs/CONCEPT_REVIEW.md` | Kanonische ODT-Festlegungen (`[N]`/`[K]`/`[O]`) zu Sync, Snapshot, Matching, Beute und Pathfinding |
| `docs/PLAN_T2_3.md` | **Arbeitsstand, kein Bestand:** Erfahrung nach verursachtem Schaden (auch für Sterbende), ungecapptes Level mit flach beginnender, kallierend exponentieller Kurve, genau ein vom Spieler verteilter Statuspunkt, automatische HP-Skalierung, 4 EP = 1 Extraktionsmaterial, getrennter Bosskampf in der vorhandenen Zone `boss-chamber` statt Platzhalter. Fünf Slices mit Abhängigkeiten und vier offene Entscheidungen; alle unbelegten Zahlen stehen als `[K]` an ihrer Quelle |
| `docs/CONCEPT_REVIEW_SECURITY.md` | Abgegrenzte manuelle Invalid-Request-/Account-Prüfmarke |
| `docs/ROADMAP.md` | Aktives Fenster der Produkt- und Technik-Roadmap: offene Blöcke, offene Punkte mit Besitzer, Prioritätsregel; seit dem 2026-09-29 ist der bisherige T2-Track der aktive T1-Track |
| `docs/VISUAL_GRUNDSATZ.md` | Freigegebene E1–E6-Visual-/Asset-Grundsätze, Expeditionsregeln, Balancefreigaben und serielle Sprintfolge |
| `docs/DEV_REQUIREMENTS.md` | Toolchain-Voraussetzungen, Befehle, Gate-Matrix, Arbeitsablauf und Skills |
| `docs/GOLDFORMEL.md` | **Freigegebene** Goldformel der Run-Beute: `goldJeGegner = 40 · Stärke · (1 + 0,25 · (Generation − 1))`, summiert über gefallene Gegner, mit Grenzfällen und Beispieltabelle. Die Rechnung ist `[N]`; offen bleibt, ob sie Stärke und Generation im Contract trägt oder der Client sie auflöst |
| `docs/historisch/` | Append-only Archiv, u. a. `2026-09-25_roadmap-t1-abgeschlossen.md` mit den abgeschlossenen T1.0/T1.2/T1.3/T1.3b-Blöcken, `2026-09-25_changelog-backend-und-initialstand.md` mit Backend- und Initialphase, `2026-09-25_changelog-t1-kern-und-governance.md` mit T1-Kern und Governance, `2026-09-25_changelog-sichtbare-basis-und-tooling.md` mit sichtbarer Basis, Entwicklungsumgebung und Governance-Härtung sowie `2026-09-26_changelog-agenten-und-visuelle-foundation.md` mit den Agent-Profilen, der `Agents.md`-Entlastung und der visuellen Foundation sowie `2026-09-26_changelog-promote-und-roadmap.md` mit dem Promote-Job und der Roadmap-Nummerierung und `2026-09-26_changelog-konsistenz-und-foundation.md` mit dem Verankerungs-Pass, der T1.2-Abnahme und dem Foundation-Audit sowie `2026-09-26_roadmap-t1-blocks.md` mit den abgeschlossenen T1.1-/T1.2-Blöcken und `2026-09-27_roadmap-t2-1.md` mit dem abgeschlossenen T2.1-Block und `2026-09-26_changelog-dependabot-und-devcontainer.md` mit dem Dependabot- und Devcontainer-Eintrag sowie `2026-09-26_changelog-konsistenz-pass.md` mit dem Konsistenz-Pass nach den fünf Merges sowie `2026-09-26_changelog-toolchain-pins.md` mit den Toolchain-Pins und ihren Grenzen sowie `2026-09-26_changelog-archiv-und-autopush.md` mit dem zweiten Archiv-Umzug und der Auto-Push-Begründung und `2026-09-29_roadmap-altfassung.md` mit der vollständigen Roadmap vor der Neunummerierung sowie `2026-09-26_changelog-toolchain-und-reviewer.md` mit den Toolchain-Pins und der Werkzeug-Erweiterung des Reviewer-Profils. Alle Changelog-Archive sind wortgleich aus `docs/CHANGELOG.md` gewandert, die Roadmap-Altfassung wortgleich aus `docs/ROADMAP.md` |
| `packages/contracts/src` | Zod-Schemas, sim_version, Trail, Ergebnislog, Auftragsunion |
| `packages/sim-core/src/*` | Deterministischer Core (PRNG, Math, Grid, Combat, Genome, Items, Hash, Ghost) |
| `packages/client/src/*` | PWA Client: `world`/`visual`/`render`/`input`/`window`/`showcase` als sichtbare visuelle Basis, `dungeon-editor` als Grid-Owner, `village` als einziger Owner der Tag/Nacht/Raid-Phase, des Dorfbestands und der Dorfwirtschaft samt der einen Zahlenquelle `balance.ts`, der reinen Regeln in `economy.ts` und der ausführenden Kommandos in `commands.ts`, `ui` als Shell und Pixi-Host, `raid` als lokaler Fixture-Auftrag; Route-Index-Mapping und Actor-Varianten sind visuell konsistent |
| `packages/client/tools/*` | Selbst erzeugte Spriteblätter: PNG-Encoder über `node:zlib`, Farb- und Kachelwerkzeuge, Generator und eine unversionierte Vorschau. Läuft als `.mjs` außerhalb der Simulationsdomäne; Variante, Wandhöhe und Zellmaß werden aus `src/world/` **gelesen**, nicht wiederholt |
| `packages/client/public/assets/*` | Die sechs ausgelieferten Dungeon-Blätter (Boden je Material, Steinwand). Herkunft und Freigabe im Asset-Register von `docs/VISUAL_GRUNDSATZ.md` |
| `packages/server/src/*` | Server: `db` als Persistenz- und Zustands-Owner, `worker.ts` als schmaler HTTP-Rand (`/api/health`, `/api/sync/checkpoint`, `/api/sync/job/:id`), `matchmaking` und `sync` noch leer |
| `scripts/bump-version.mjs` | Next-Bump-Zähler mit Basis aus `origin/main` (PATCH→MINOR→MAJOR, verweigert doppelte Nummern) |
| `.agents/skills/` | Installierte Review-Skills (`code-slop`, `typescript-review`, `code-quality`), Registry in `skills-lock.json` |
| `scripts/shinon/engine.mjs` | Shinon Slicer + Runner: Standard-Slice, `--full` (alle Plugins, Job `Shinon Gate`) und `--local` (kurze Menge aus `policy.engine.local`, beide Hooks) |
| `scripts/shinon/lib/commit-text.mjs` | Einzige Quelle der Commit-Regeln, geteilt von lokalem Hook und CI-Plugin |
| `scripts/shinon/plugins/*` | Blockierende Governance-Module (global-loc, contract, modularity, dead-code, redundancy, commit-integrity) plus Slice-Plugins |
| `scripts/shinon/tests/gate-parity.test.mjs` | Paritätsvertrag: vergleicht die `run:`-Befehle des `gate`-Jobs mit `gate:full`, hält `gate` als Teilmenge, verlangt das lokale Minimal-Gate als Teilmenge von `always`, verbannt Engine `--full`, Tests und Lint aus dem lokalen Weg und verbietet kostenpflichtige Runner |
| `scripts/shinon/tests/main-writer.test.mjs` | Einziger Schreiber nach `main`: fährt den echten `pre-push`-Hook mit einer `main`-Refspec, verlangt Ablehnung vor der Suite, Durchlass für Feature-Branches, ausdrückliche Freigabe für den Notfallweg und die Sperre auch im Generator `install-hooks.mjs` |
| `scripts/watchdog-classify.mjs` | Einzige Wahrheit, ob ein abgeschlossener Shinon-Lauf ein Vorfall ist: meldet rote Push-Läufe auf `main` und gescheiterte `promote`-Läufe, schweigt bei rotem Gate und Feature-Branch-Pushes; liefert Titel, Label und Fließtext |
| `scripts/shinon/tests/watchdog-classify.test.mjs` | Zusicherung für den Watchdog-Klassifizierer inklusive Gegenproben: rotes Gate und roter Feature-Branch-Push dürfen keinen Vorfall erzeugen, und `renderIssue` darf für keinen Nicht-Vorfall einen Text erfinden |
| `scripts/check-loc.mjs` | LOC-Cap Check |
| `scripts/break-glass-main.mjs` | Notfallweg bei Ausfall von GitHub Actions: serialisiert den Protection-Zustand, lockt minimal nur `required_status_checks` und stellt wieder her; `--dry-run` verändert nichts |
| `scripts/check-hygiene.mjs` | Hygiene Check |
| `scripts/install-requirements.sh` | Bootstrap unter Linux/macOS: prüft Node, pnpm, Git, Python, installiert Dependencies, ruft Gate |
| `scripts/install-requirements.cmd` | Derselbe Bootstrap unter Windows |
