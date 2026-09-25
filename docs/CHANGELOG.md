# docs/CHANGELOG.md — Global

## 2026-09-25 — Sichtbare visuelle Basis: Pixi, World, Observer, Window-Runtime

- `packages/client/package.json` und `pnpm-lock.yaml`: `pixi.js@^8` aufgenommen. Damit deckt sich `docs/ARCHITEKTUR.md` mit der Realität, die vorher eine PixiJS-8-Schicht behauptete, ohne dass sie installiert war. Dependency und Lockfile liegen im selben Slice.
- Neuer Client-Aufbau: `world` (Definitionen), `visual` (Observer, Deskriptoren), `render` (Pixi-Szene, Kamera, Depth, Terrain, Actors, FX, Filter), `input` (Pointer, Hit-Test, Drag), `window` (Preact-Fenster), `showcase` (sichtbare Referenzszene). `src/main.tsx` existiert wieder; der Client rendert im Browser.
- `Agents.md` §3: neuer Client-Baum, sechs zusätzliche Owner-Zeilen und die Regel, dass `worldToScreen`/`screenToWorld` genau einmal in `render/camera.ts` existieren. `Agents.md` §4: sechs neue LOC-Cap-Zeilen für die Client-Subdomänen.
- `scripts/shinon/policy.json`: sechs neue `locCaps`-Einträge (`world` 120, `render` 150, `visual` 150, `input` 100, `window` 120, `showcase` 150). Der Modularitäts-Gate bleibt auf Package-Ebene, der Determinismus-Gate weiterhin auf `sim-core`/`contracts` beschränkt — Pixi ist damit vertragskonform und wird nicht fälschlich als Core-Quelle gescannt.
- `docs/ROADMAP.md`: die visuelle Basis ist als eigener T1-Block verbucht, nicht als T2/T3-Feature. Damit bleibt die T1-Exklusivität gewahrt; der Trail-Hash bleibt offene Voraussetzung für autoritatives Playback.
- `docs/ARCHITEKTUR.md`, `docs/FUNKTIONSGRAPH.md` und `docs/REPOINDEX.md`: Client-Zeile korrigiert und um den Visual-Foundation-Datenfluss sowie die Fenster-/Pointer-Grenzen ergänzt.

## 2026-09-25 — Entwicklungsumgebung dokumentiert und Tooling-Typos behoben

- `docs/DEV_REQUIREMENTS.md` neu: verbindliche Toolchain-Voraussetzungen, Befehlstabelle, Gate-Matrix mit allen elf Shinon-Plugins, Arbeitsablauf eines Task-Slices, Skill-Bewertung und bekannte Stolperfallen. Aktiv und mit 81 Zeilen deutlich unter dem 200-Zeilen-Cap.
- `scripts/install-requirements.sh` und `scripts/install-requirements.cmd` neu: prüfen Node `>=22`, die in `package.json` gepinnte pnpm-Version, Git und optional Python, installieren mit `--frozen-lockfile` und beenden mit `pnpm run check`. Das Shell-Script läuft auf Linux und macOS, die cmd-Variante auf Windows.
- Drei Tippfehler korrigiert: `packages/sim-core/src/combat/fixture-job.test.ts` sprach von einem Kampf-Timeout als „Ergebnis“, obwohl es ein Auftrag mit Timeout-Abschluss ist; `packages/sim-core/docs/STRINGMATRIX.md` nannte die Hard-Block-Regel „nicht zumauerbar“, eine Wortbildung die es im Deutschen nicht gibt; `packages/sim-core/src/grid/serialize.ts` sprach davon, dass ein Snapshot „hinterher“ nicht verändert werden kann, gemeint war „nachträglich“.
- Drei Community-Skills installiert und nach `.agents/skills/` gelegt, Registry in `skills-lock.json`: `code-slop` für Lesbarkeits-Audits, `typescript-review` für die `any`-Disziplin, `code-quality` als Referenz für Typ-Modellierung. Keiner davon ersetzt ein Gate, alle sind unvettet.
- `docs/REPOINDEX.md` um beide Bootstrap-Skripte, das neue Doku-Archiv und das Skill-Verzeichnis ergänzt.

## 2026-09-25 — Commit-Gate gegen Clone-Umgehung verankert

- Die lokale Hook-Kette war kein belastbarer Schutz, weil sie in einem Fresh Clone gar nicht existiert: `core.hooksPath` steht ausschließlich in der lokalen `.git/config`, das generierte Verzeichnis `.husky/_` ist nicht im Repo versioniert, und `pnpm install --ignore-scripts` überspringt den `prepare`-Schritt, der Husky überhaupt erst installiert. Wer das Gate umgehen wollte, brauchte damit keinen Exploit, nur einen normalen Clone.
- Die Commit-Regeln liegen jetzt genau einmal in `scripts/shinon/lib/commit-text.mjs` als reine Funktion ohne I/O. `scripts/shinon/commit-msg.mjs` wurde auf einen dünnen Shim für die lokalen Hook-Belange reduziert, und das neue `scripts/shinon/plugins/commit-integrity.mjs` teilt sich dieselbe Quelle. Damit können die lokale und die ferne Prüfung nicht mehr auseinanderlaufen.
- `commit-integrity` prüft die tatsächlich vorhandenen Commits einer Range direkt aus Git. Das ist notwendig, weil der Engine-Slicer in einem frischen CI-Checkout einen leeren Diff sieht und deshalb keine Range kennt. Der Workflow übergibt ihm deshalb `github.event.before` und stellt den Checkout auf `fetch-depth: 0`.
- Das Plugin ist bewusst fail-closed ausgelegt. Eine unauflösbare Referenz, ein `--from` ohne Wert und eine unlesbare Range führen zu Exit 1 statt zu einem grünen Durchwinken. Ohne diese Eigenschaft wäre das Gate exklusiv umgehbar gewesen, indem man die Range absichtlich kaputt macht.
- `required_status_checks` auf `main` verlangt jetzt den Kontext `Shinon Gate`. Dieser zweite Pfeiler ist der eigentliche Grund, warum `--no-verify` nichts mehr nützt: Ein lokaler Bypass ändert den Exit-Code eines Hooks, nicht den Status des Remote-Checks. GitHub lehnt den Push ab, solange der Lauf nicht abgeschlossen ist.
- `docs/REPOINDEX.md`, `Agents.md` §6.5 und die gesamte Pflicht-Doku der Domäne `scripts/shinon` wurden auf den neuen Aufbau nachgezogen. Die Aussage, ein Push sei ohne den Remote-Lauf sinnlos, ist jetzt empirisch gedeckt statt angenommen.
- Unverändert bleibt: Ein frischer Clone braucht für die lokale Hook-Kette weiterhin ein `pnpm install` ohne `--ignore-scripts`. Das ist gewollt und kein Loch — die verbindliche Grenze liegt remote.

## 2026-09-25 — Case-Kollision `AGENTS.md`/`Agents.md` und CRLF-Bruch unter Windows aufgelöst

- Git trackte zwei Pfade, die sich nur im Groß-/Kleinschreibungsfall unterscheiden: `AGENTS.md` als Session-Learning-Stub und `Agents.md` als kanonische Governance. Auf case-insensitiven Dateisystemen überlebt nur einer; Folge war ein `git status`, der dauerhaft einen Diff zeigte, den niemand geschrieben hatte, und ein `commit-msg`-Gate, das die Datei namentlich im Commit-Body verlangte. `AGENTS.md` ist jetzt aus dem Index entfernt.
- Der Stub behauptete, `Agents.md` enthalte die relevanten Erkenntnisse bereits. Das traf nicht zu: neun Learnings fehlten, darunter der Commit-Amend über einen temporären `GIT_INDEX_FILE`, der SSH-Signatur-Nachweis über `gpg.ssh.allowedSignersFile` sowie die read-only-Abfrage von `gh api user/ssh_signing_keys`. Sie sind jetzt in `Agents.md` §6.9 zusammengeführt.
- `.gitattributes` neu: erzwingt LF je Dateityp und für `VERSION`, `.env.example` sowie `.husky/*`. Ohne diese Regeln schrieb `core.autocrlf=true` unter Windows CRLF in die Worktree. Empirisch belegt: CRLF ließ vier `scripts/shinon/tests/*.test.mjs` beim Modul-Laden mit `SyntaxError: Invalid or unexpected token` und null collecteten Tests scheitern, weil Vitest 2.1.8 die Shebang-Zeile nur bei LF-Zeilenende parst, und erzeugte rund 110 reine CRLF-Fehler in Biome. Nach LF-Normalisierung: 20 von 20 Testdateien und 104 von 104 Tests grün, `lint` und `check` ohne Befund.
- `* text=auto` ist bewusst mit `*.fixture -text` und Binär-Markern kombiniert, weil die Test-Fixtures unter `scripts/shinon/tests/fixtures/` byteweise verglichen werden und keine Normalisierung vertragen.
- Der Changelog-Eintrag vom selben Tag behauptete, die parallele Session-Learning-Datei sei bereits entfernt worden. Das war falsch; der Eintrag ist durch diesen hier überholt.

## 2026-09-25 — T1.3 Contract-v2-Ergebnislog und lokale Fixture-Job-Ausführung

- `packages/contracts/src/combat-log.ts` und `src/job.ts` neu: strikte Wire-Form für Config, Einheiten, Events, Log und Summary sowie ein Auftrag als Diskriminated Union über `status`. Ergebnis, Fehler und Auftrags-Timeout sind damit nicht verwechselbar.
- `ResultPayloadSchema.summary` war ein freies `record(json)` und ist jetzt typisiert. `RaidLogPayloadSchema` trägt den vollständigen Log als eigenes Artefakt, damit `result_json` klein bleibt.
- `ErrorCodeSchema` von drei auf fünf Codes erweitert. `timeout` war in D1 möglich, im Contract aber nicht darstellbar — genau diese Drift ist jetzt geschlossen.
- `packages/sim-core/src/grid/serialize.ts` und `src/combat/{summary,resolve-snapshot,fixture-job}.ts` neu: Contract-Payload zu Grid, typisierte Summary, Snapshot-Auflösung und lokale Auftragsausführung ohne Netz, ohne Uhr und ohne Zufall von außen.
- `runFixtureRaid` prüft Upload-Schema, Auftragsfrist, Route und Replay-Hash, bevor er `completed` meldet. Der Rückgabewert ist durch `RaidJobSchema` validiert.
- `packages/server/src/db/job-state.ts` übernimmt Status, TTL, Übergänge und Fehlercodes aus dem Contract. `raid-store.ts` erzwingt Übergänge vor dem Schreibzugriff.
- `packages/client/src/raid/` neu: Fixture-Upload, Ergebnis-Panel und Team-Panel. `ui/shell.tsx` wurde unter seinem LOC-Cap gehalten, indem die Teamanzeige herausgelöst wurde.
- Ein Client-Test pinnt die bekannte Lücke: Aus dem Grid fließt nur die Routenlänge in den Hash, daher erzeugen gleich lange Umwege denselben Wert. Der Folgeblock führt den Pfad als Trail in den Hash ein.
- 24 neue Tests, Gesamtstand 20 Testdateien und 104 Tests. `CONTRACT_VERSION` bleibt 2.

## 2026-09-25 — T1.2 deterministischer Combat-, Hash- und Replay-Core

- `packages/sim-core` implementiert `prng` (Mulberry32 plus Seed-Ableitung), `math` (Fixed-Point, isqrt), `hash` (FNV-1a) und `combat` (bounded Tick-Simulation, Event-Log, kanonischer Log-Hash, Replay).
- Gleicher Seed und Snapshot liefern denselben Hash und identischen Log; `resolveCombat`, `simulateCombat`, `replayCombat` und `verifyCombatLog` sind öffentlich.
- Balancing bleibt provisorisch zentral in `PROVISIONAL_RULES` und ist `[K]` in `docs/CONCEPT_REVIEW.md`, keine Nutzerentscheidung.
- 20 neue Core-Tests; Gesamtstand 16 Testdateien und 80 Tests. `docs/ROADMAP.md` rückt T1.3 als nächsten Block nach.

## 2026-09-25 — Konzept-Realignment auf ODT-Stand

- `docs/CONCEPT_REVIEW.md` neu strukturiert: `[N]` Nutzerfestlegung, `[K]` KI-Vorschlag, `[O]` offen; nur `[N]` ist fix.
- Grid verbindlich 64×64 Logikzellen bei 16×16 sichtbaren Tiles; die ODT-Formulierung „4 Logiken pro Tile“ ist damit supersediert.
- Phantom-Kopie als Beute-Regel bestätigt; MMR-/XP-/Shield-Zahlen, der globale Vier-Stunden-Shield und der Session-Lock sind als KI-Vorschläge `[K]` markiert.
- `packages/sim-core/src/grid/path.ts` fällt wieder auf wenigste Tiles zurück; Golden-Test in `packages/sim-core/src/grid/path.test.ts` und `packages/sim-core/docs/CHANGELOG.md` angepasst.
- `README.md` von der nicht belegten Extraktions-/Gier-Mechanik bereinigt.
- Die frühere Formulierung „vier bestätigte Entscheidungen“ war zu weitgehend; fix ist nur, was im ODT belegt oder in dieser Session abgenickt wurde.

## 2026-09-25 — Lifecycle-Bug des Versionsbump behoben

- `scripts/bump-version.mjs` erhält beim mechanischen Bump die bestehende JSON-Formatierung und verhindert damit, dass der Post-Commit-Hook den Biome-formatierten `package.json`-Zustand wieder zerstört.
- Der erste Remote-pnpm-Lauf hatte den Fehler sichtbar gemacht; der nächste Task-Commit dokumentiert und schließt diese Kette.

## 2026-09-25 — main-only Governance und pnpm-CI

- `pnpm-lock.yaml` als reproduzierbare Workspace-Auflösung eingeführt und das veraltete `package-lock.json` entfernt.
- Root-Check auf pnpm umgestellt; `.github/workflows/shinon.yml` führt Typecheck, Tests, Biome und Full-Shinon für jeden Push auf `main` aus.
- `Agents.md` verschärft die main-only-Regel: lokale Gates bleiben vor Commit/Push verpflichtend, Remote-`Shinon Gate` ist der zweite Pflichtlauf, Review vor jedem Task-Commit und Commit-Body-Pflicht bleiben hart.
- Die Roadmap markiert T1.0 als abgeschlossen; T1.1 ist der nächste aktive Block.

## 2026-09-25 — Vollständiger Audit und priorisierte Roadmap

- Vollständigen Ist-Stand mit `pnpm`, Typecheck, Vitest, Shinon, Biome, `jq` und Dependency-Audit geprüft; 55 Tests sowie Typecheck und Full-Gate waren grün, Biome meldete nur die Formatierung von `package.json`.
- `docs/ROADMAP.md` als gepflegte T1/T2/T3-Produkt- und Technik-Roadmap ergänzt. T1 ist der exclusive playable Core; nach T1 wird T2 zu T1 und T3 zu T2 promoted.
- Aktuelle Lücken dokumentiert: fehlender Client, fehlender End-to-End-Raid-Flow, uneinheitliche pnpm/npm-Toolchain und stale `package-lock.json` mit Version `0.0.1`.
- Root-Repoindex um die Roadmap ergänzt; Pflegeprotokoll für Status, Changelog, Repoindex und erneute Checks festgeschrieben.

## 2026-09-25 — Cloudflare-first Backendentscheidung

- D1 hält Raid-Jobstatus und 15-Minuten-Frist; Cloudflare Queues übergeben den Job an den Headless-Worker.
- Die alte Node-/Fastify-/better-sqlite3-Zielnotiz bleibt als historischer Initialstand, wird aber nicht als aktuelle Architektur behandelt.
- Die vier bestätigten Entscheidungen zu Upload-Reihenfolge, Shield, 3:1-Beitrag und +5-Bewegungspunkten sind in `docs/CONCEPT_REVIEW.md` festgehalten.

## 2026-09-25 — Governance-Konsolidierung

- Die parallele Session-Learning-Datei und der GitHub-Governance-Spiegel wurden entfernt; `Agents.md` bleibt die einzige kanonische Agent-Governance und enthält die relevanten Erkenntnisse bereits.
- `docs/REPOINDEX.md` und die Shinon-Dokumentation verweisen nicht mehr auf eigenständige Governance-Duplikate.

## 2026-09-25 — Offizieller Initialstand

- Der gesamte aktuelle Projektbaum startet als Root-Commit mit Version `0.0.1`; `.freebuff`-Laufzeitdaten bleiben außen vor.
- `package-lock.json` ist versioniert, damit `npm ci` im GitHub-Check und in einem frischen Clone reproduzierbar bleibt.
- `packages/contracts/src/index.ts` liefert eine echte TypeScript-Quelle für den Typecheck und exportiert `sim_version`.
- `.github/workflows/shinon.yml` erzwingt den vollständigen Check `Shinon Gate`; Branch-Protection auf `main` muss diesen Status verlangen.
- `Agents.md` bündelt die kanonische Shinon-Governance; Agent-Dokumente verwenden relative Pfade und hardcodieren keine privaten oder maschinenbezogenen Werte.

## 2026-09-25 — Lifecycle-Gate-Härtung

- Der Post-Commit-Amend läuft mit aktiven Hooks; der frühere `--no-verify`-Pfad ist entfernt.
- Staging-, Amend- und Push-Fehler beenden den Hook mit Exit ungleich null, damit Versionszustand und Commit nicht auseinanderlaufen.

## 2026-09-25 — Gate-Fehlerpfade

- `npm run check` bricht nach einem fehlgeschlagenen Typecheck ab; nachfolgende Gates werden nicht als Erfolg getarnt.
- `.husky/post-commit` meldet Bump- und Version-Gate-Fehler jetzt mit Exit ungleich null und führt danach kein Amend oder Auto-Push aus.

## 2026-09-25 — GitHub-Freigabehärtung

- Leere `historisch/`- und Source-Domänenordner werden über `.gitkeep` versioniert, damit `hygiene-gate` und `schema-contract` auch in einem frischen Clone grün bleiben.
- Hook-Lifecycle isoliert geprüft: zu kurze Commit-Bodies und Werbe-Footer werden blockiert; ein gültiger Commit bumped atomar auf die nächste Version.

## 2026-09-25 — Initialisierung

- Monorepo angelegt: `packages/contracts`, `packages/sim-core`, `packages/client`, `packages/server`, `scripts/shinon`.
- Governance fixiert: kanonische Agent-Governance in `Agents.md` (Sprache Deutsch, DRY, Owner-Contracts, LOC-Caps, Hygiene, Shinon Gates).
- Hygiene-Domänen angelegt: root, contracts, sim-core, client, server, shinon — je 5 Pflicht-Dokus + historisch/.
- Shinon Engine: Slicer nach `git diff`, Plugin-Slices (loc-gate, hygiene-gate, core-determinism, schema-contract, false-positive), Auto-Push via post-commit.

## Vorher

- Spiel-Design gelockt (8 V-Entscheidungen, 3 G-Entscheidungen, Etagen-Loop sequenziell). Die frühere „halbe Beute bei Gier-Tod“-Notiz ist nicht durch das ODT gedeckt und wurde am 2026-09-25 aus README/Konzept entfernt.
