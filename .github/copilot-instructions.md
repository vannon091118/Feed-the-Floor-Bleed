# Copilot Instructions — Feed the Floor: Meet Your Fate

Deterministisches Async-Webspiel (pnpm-Monorepo, Preact + PixiJS-Client, Cloudflare-D1/Queues-Server). `Agents.md` ist das Gesetz; diese Datei ist der Kurzabgleich für Agenten. Bei Widerspruch gilt `Agents.md`.

## Sprache und Umgebung

- **Deutsch für alles**: Doku, Kommentare, Commit-Nachrichten, Dev-Fehlermeldungen. Ton direkt und kompromisslos, kein Marketing-Gelaber.
- Node >= 22, Paketmanager **ausschließlich pnpm** (`packageManager: pnpm@9.12.3`, via Corepack). Kein npm, kein yarn, kein manuelles `package-lock`.
- `docs/` nutzt ausschließlich relative Pfade. Absolute URLs, Credentials, Hostnamen und private IDs nur nach ausdrücklicher Vereinbarung.

## Befehle

```bash
pnpm install --frozen-lockfile        # nach Dependency-Änderungen MUSS pnpm-lock.yaml im selben Commit
pnpm run -s typecheck                 # tsc --noEmit über packages/*/src + scripts
pnpm test                             # vitest run (Einmal-Lauf, kein Watch)
pnpm run -s lint                      # biome check .
pnpm run -s format                    # biome check --write .
pnpm run -s check                     # typecheck + LOC + Hygiene + Shinon --full  (Vor-Abgabe-Pflichtlauf)
pnpm dev                              # Vite-Devserver des Clients
pnpm build                            # Vite-Build des Clients
```

Ist `pnpm` nicht im PATH (typisch unter Windows), sind die Corepack-Shims unter `C:\Program Files\nodejs\node_modules\corepack\shims`. Deren `pnpm.cmd` existiert bereits; es fehlt nur der PATH-Eintrag. `corepack enable` scheitert dort an fehlenden Adminrechten, `npm install -g pnpm` an einer Registry-Sperre (E403). Sauberste dauerhafte Lösung:

```powershell
[Environment]::SetEnvironmentVariable('Path', "C:\Program Files\nodejs\node_modules\corepack\shims;" + [Environment]::GetEnvironmentVariable('Path','User'), 'User')
```

Danach in **jeder** neuen Shell `$env:PATH` um das Shim-Verzeichnis ergänzen — die User-Variable wirkt erst in neu gestarteten Prozessen. Ab dann laufen auch `pnpm run -s check` und die Hook-Kette, weil das Skript intern `pnpm` aufruft.

Einzelner Test / einzelnes Gate — das ist der Normalfall während der Arbeit:

```bash
pnpm vitest run packages/sim-core/src/grid/path.test.ts
pnpm vitest run packages/sim-core/src/grid/path.test.ts -t "Golden"
pnpm vitest run packages/contracts packages/server
node scripts/shinon/plugins/core-determinism.mjs      # einzelnes Gate
node scripts/shinon/plugins/version-gate.mjs
SHINON_AUTO_PUSH=0 git commit -m "..."                # lokaler Lifecycle-Test ohne Auto-Push
```

Tests liegen co-located bei der Quelle (`src/**/*.test.ts`) sowie in `packages/*/test/`. Fixture-Dateien (`*-fixtures.ts`) werden von mehreren Testdateien geteilt — neue Fixtures dort ablegen, nicht duplizieren.

### Windows-Falle: CRLF bricht Tests und Lint (empirisch belegt)

Das Repo hat **keine `.gitattributes`**. Auf Windows mit `core.autocrlf=true` landen alle 199 tracked Dateien als CRLF in der Worktree, obwohl die Blobs im Repo bereits LF sind (`git show HEAD:<datei>` enthält 0 CR). Das bricht zwei Gates, die auf der Linux-CI grün sind:

- `pnpm test` wirft `SyntaxError: Invalid or unexpected token` in den vier `scripts/shinon/tests/*.test.mjs`, die transitiv eine Shebang-Datei einbinden (`policy.mjs`, `policy-schema.mjs`, `lib/source-scan.mjs`) — 4 von 20 Dateien, alle mit **0 collecteten Tests** (Fehler beim Modul-Laden, nicht bei einer Assertion). Vitest 2.1.8 parst die Shebang-Zeile `#!` nur, wenn sie mit **LF** endet; mit `\r\n` scheitert der Vite-Transform. `gates.test.mjs` bleibt grün, weil sie ausschließlich `node:`-Builtins importiert. Nach LF-Normalisierung: 20/20 Dateien, 104/104 Tests grün.
- `pnpm run -s lint` meldet ~110 Formatfehler, die reine CRLF-Diffs sind. Gegenprobe: dieselbe Datei als LF-Kopie ergibt "No fixes applied", als CRLF-Kopie 110 Fehler. `biome.json` setzt kein `formatter.lineEnding`, also greift der Default.

Nicht "reparieren" — das sind Windows-Artefakte, keine Formatfehler, und sie gehören nicht in einen Commit. Zwei Wege, beide empirisch geprüft:

```bash
git config core.autocrlf input          # nur LF in die Worktree, Blobs unberührt
```

Danach die Worktree-Dateien einmalig auf LF ziehen. **Achtung:** `git checkout-index -f` und `git add --renormalize` schreiben nur teilweise durch und lassen einen gemischten Zustand zurück — dann schlagen genau 4 Testdateien weiterhin fehl und es sieht aus, als wäre die Theorie falsch. Verlässlich ist ein expliziter Durchlauf über alle tracked Textdateien, der `\r\n` zu `\n` ersetzt; damit fallen alle 199 CR-Zähler auf 0. Dauerhaft abgesichert wird das durch ein Root-`.gitattributes` mit `*.md text eol=lf`, `*.mjs text eol=lf`, `*.ts text eol=lf`, `*.tsx text eol=lf`, `*.json text eol=lf`, `*.yml text eol=lf`, `*.sql text eol=lf`, `*.css text eol=lf`, `*.html text eol=lf`, `*.fixture text eol=lf` sowie `.husky/* text eol=lf` und `.env.example text eol=lf`. **Nicht** blind `* text=auto` verwenden — die Shinon-Test-Fixtures unter `scripts/shinon/tests/fixtures/*.fixture` enthalten bewusst Byte-Vergleiche und dürfen keine Normalisierung erfahren.

Nach der Normalisierung meldet `git status` weiterhin ~179 Dateien als `M`, obwohl `git diff --name-only` **leer** ist. Das ist kein Fehler im Arbeitsbaum, sondern ein nicht auflösbarer Stat-Cache auf Windows: `git update-index --really-refresh` meldet sie als "needs update", repariert sie aber nicht. Verlässliche Prüfung ist deshalb der Hash-Vergleich pro Datei (`git ls-files -s` gegen `git hash-object`) oder schlicht `git diff`. Ein `git add -A` nimmt diese Dateien nicht auf, weil ihr Inhalt identisch zum Index ist.

## Architektur in einem Satz

`contracts` (Zod-Wire-Form) → `sim-core` (reine, deterministische Funktionen) → `client` (rendert) und `server` (D1-Jobstore). Der Client **entscheidet nie** über einen Raid-Ausgang; er rendert serverseitig validierte Ergebnisse.

Belegter Datenfluss heute (T1.3): Editor-Grid + Fixture-Aufstellung → `buildFixtureUpload` (Contract-v2-Upload) → `toDungeonGrid` → `runFixtureRaid` (prüft Schema, Auftragsfrist, Route, Replay-Hash) → `RaidPanel`. Kein Netz, keine Uhr, kein Serverentscheid.

Domain-Grenzen werden von `modularity-gate` mechanisch erzwungen (`scripts/shinon/policy.json` → `modularity.allowed`):

| Package | Darf importieren |
|---|---|
| `contracts` | nur `contracts` |
| `sim-core` | `sim-core`, `contracts` |
| `client` | `client`, `sim-core`, `contracts` |
| `server` | `server`, `sim-core`, `contracts` |

Zusätzlich verboten: relative Imports, die das eigene Package verlassen; Deep-Imports (`@floor/sim-core/grid`); Import-Zyklen. `contracts` darf ausschließlich `zod` und relative Pfade importieren, und `packages/contracts/src/index.ts` muss `sim_version` referenzieren.

## Konventionen, die man nicht sieht, wenn man eine Datei liest

**Determinismus im Core.** `core-determinism` verbietet in `packages/sim-core/src` und `packages/contracts/src`: `Math.random`, `crypto.randomUUID`/`getRandomValues`/`randomBytes`, `Date.now`, `new Date()`, `Math.sin`/`cos`/`tan`/`sqrt`/`pow`, `parseFloat`. Ersatz: `createRng(seed)` aus `sim-core/prng` (Mulberry32), `intSqrt`/`mulFixed` aus `sim-core/math`, Zeit und Seed **als Parameter**. `while (true)` ist in `combat`/`genome`/`matchmaking`/`sync` verboten — bounded Tick-Loop stattdessen.

**Der Contract ist die Truth, nicht der Code.** Job-Status, Fehlercodes, Übergänge und TTL kommen aus `packages/contracts/src` (`RAID_JOB_STATUSES`, `RAID_JOB_TRANSITIONS`, `ErrorCodeSchema`, `RAID_JOB_TTL_MS`). `server/src/db/job-state.ts` re-exportiert sie, erfindet nichts. Neue Zustände oder Fehlercodes gehören in den Contract plus `docs/STRINGMATRIX.md` — freie Strings sind verboten.

**Ungültige Eingaben sind `unknown`.** APIs wie `runFixtureRaid({ upload: unknown, ... })` nehmen bewusst ungeprüfte Eingaben und lassen Zod entscheiden; der Rückgabeweg ist `RaidJobSchema.parse(...)`. Für Fehler-Details wird der **erste Zod-Issue-Pfad** als Key benutzt, nicht die Meldung (Meldungstexte ändern sich zwischen Versionen).

**Jede Datei hat ein LOC-Cap** (`scripts/shinon/policy.json` → `locCaps`, längster Prefix gewinnt, Fallback-Caps greifen). `contracts/src` 120, `prng`/`hash` 80, `math` 120, `grid`/`combat`/`genome`/`items`/`ghost`/`client/src`/`server/src` 150, `net`/`storage`/`inventory`/`ui`/`server/db` 100–120. Kommentare und Leerzeilen zählen nicht. Reißt eine Datei ihr Cap, wird **gesplittet** — nicht die Regel umgangen. Neue Ordner unter `packages/*/src` brauchen ein `.gitkeep`, wenn sie leer bleiben.

**Keine Duplikate.** `redundancy-gate` blockiert 6 identische normalisierte Codezeilen über zwei Dateien hinweg (Imports/Exports/Zeilen mit alleinstehender Klammer werden herausgefiltert). Derselbe Helper gehört in genau eine Datei und wird importiert.

**Doku-Pflicht.** `check-hygiene.mjs` verlangt pro Domäne (`docs/`, `packages/{contracts,sim-core,client,server}/docs/`, `scripts/shinon/docs/`) genau diese fünf Dateien: `CHANGELOG.md`, `ARCHITEKTUR.md`, `STRINGMATRIX.md`, `FUNKTIONSGRAPH.md`, `REPOINDEX.md` — plus ein `historisch/`-Verzeichnis. Aktive Doku max 200 Zeilen; Überhang wandert nach `historisch/YYYY-MM-DD_<topic>.md` (append-only, nie löschen). Keine Änderung ohne Doku-Touch.

**Versionierung ist mechanisch.** `VERSION` im Root ist Single Source of Truth (`X.Y.Z`, PATCH 0..99 → MINOR 0..99 → MAJOR). `post-commit` bumped nach jedem erfolgreichen Commit, amended und pusht. `VERSION` oder `package.json:version` **niemals** von Hand editieren. Achtung: Der Bump staged ganze `package.json`-Dateien — ungestagte Änderungen darin werden in den laufenden Slice gezogen, also vor dem Commit vollständig stagen.

**Biome-Format.** Zwei Leerzeichen, einfache Quotes, `semicolons: asNeeded`. Nach jeder `edit` prüfen, ob Biome betroffen ist; `pnpm run -s lint` läuft im CI mit.

## Commit-Format (nicht verhandelbar)

`commit-msg` ist ein Hard-Fail-Gate:

- **Body >= 200 Wörter Fließtext**, keine Aufzählungen (Zeilen mit `* `, `- ` oder `• ` failen).
- **Jede** per `git diff --cached --name-only` geänderte Datei muss namentlich im Body stehen, mit Begründung im Fließtext.
- Verboten, auch case-insensitive: `co-authored-by`, `generated by`, `powered by chatgpt|claude|gemini|openai|anthropic`, `noreply@codebuff.com`.
- **Kein `--no-verify`.** Kein Bypass ohne Arch-Freigabe.
- Ein Task = ein Commit = ein Push-Slice. Kein Sammelcommit über mehrere Tasks.

Ein Task gilt erst als fertig, wenn `pnpm run -s check` lokal grün ist **und** der Remote-Lauf `Shinon Gate` (`.github/workflows/shinon.yml`, nur bei Push auf `main`) grün war.

### Hooks unter Windows

`core.hooksPath` steht auf `.husky/_`, die Hooks sind `#!/usr/bin/env sh`. Git führt sie über die mitgelieferte Bash aus (`C:\Program Files\Git\bin\sh.exe`), die POSIX-Konstrukte in `.husky/post-commit` — `$(cat VERSION | tr -d ' \n\r')`, `$(git rev-list --count HEAD)`, `${SHINON_SKIP_BUMP:-0}`, `${SHINON_AUTO_PUSH:-1}` — funktionieren unter dieser Shell. Alle vier Hooks sind bereits LF (CR=0, kein BOM), sonst scheitert `sh` an der Shebang. Trotzdem lässt sich die Kette unter Windows nur eingeschränkt testen: `git push` im `post-commit` läuft ohne Credential-Prompt, ein fehlgeschlagener Push bricht den Hook ab und lässt den Commit lokal. Für sichere lokale Commits `SHINON_AUTO_PUSH=0` setzen und erst nach grünem `pnpm run -s check` gezielt pushen.

### Versionsdrift Node

`package.json` fordert `engines.node >= 22` und pinnt `packageManager: pnpm@9.12.3`; CI läuft auf `ubuntu-latest` mit **Node 22** und pnpm 9.12.3 via `pnpm/action-setup@v4`. Lokal läuft Node **24** — das erfüllt `engines`, ist aber nicht der CI-Stand. Wenn ein Test nur lokal rot ist, Node 24 zuerst verdächtigen, bevor Code als Ursache gilt.

## Shinon Engine

`scripts/shinon/engine.mjs` slict nach `git diff`. Ohne `--full` laufen die Base-Gates immer (`loc-gate`, `global-loc-gate`, `hygiene-gate`, `modularity-gate`, `dead-code-gate`, `redundancy-gate`, `schema-contract`, `version-gate`, `commit-gate`); Core-Plugins laufen nur bei passendem Slice (`core-determinism` für `sim-core`/`contracts`, `false-positive` für Pfade mit `/combat/`, `/genome/`, `/matchmaking/`, `/sync/`). Jeder Plugin-Exit ungleich 0 blockiert.

`dead-code-gate` führt zusätzlich `tsc --noEmit --noUnusedLocals --noUnusedParameters` aus — unbenutzte Parameter und Locals sind ein Fehler. `SHINON_TSC` überschreibt nur für Tests.

## Konzept und Scope

`docs/CONCEPT_REVIEW.md` ist die einzige Quelle für Spielregeln, mit Markern: `[N]` Nutzerfestlegung (fix), `[K]` KI-Vorschlag (**keine** Implementierungsfreigabe), `[O]` offen. `docs/ROADMAP.md` ist die einzige aktive Reihenfolge: T1 exklusiv, danach T2 → T1 promoted, T3 → T2 promoted. Ein Statuswechsel ist erst nach grünem `typecheck`, `test`, `lint` und `check` zulässig, mit Evidenz im Roadmap-Update.

Zielmodule (MMR-Matching, Ghost, Queue, HTTP, Auth, Items, Zucht, Dorf-Ökonomie, RLE+deflate) sind **geplant, nicht existent**. Nicht als vorhanden behandeln, nicht als Bestand dokumentieren, nicht „kurz einbauen, wenn es naheliegt" — sie gehören in einen eigenen Slice auf der Roadmap.

Bekannte offene Baustelle: Aus dem 64×64-Grid fließt aktuell nur `route.path.length` in den Kampf-Hash, nicht der Pfad mit Zelltyp und Koordinaten. `packages/client/test/raid-job.test.ts` pinnt das als bewusst grünen Test — er wird beim Fix rot, und das ist gewollt.

Vorbestehender Repo-Schaden, **nicht** von dir verursacht: Git trackte zwei Pfade, die sich nur im Groß-/Kleinschreibungsfall unterscheiden — `AGENTS.md` als Session-Learning-Stub und `Agents.md` als kanonische Governance. Auf Windows ist das Dateisystem case-insensitiv, also überlebte nur eine Datei. Folge war ein `git status`, das dauerhaft `M AGENTS.md` mit einem Diff zeigte, den niemand geschrieben hatte, und ein `commit-msg`-Gate, das die Datei namentlich im Body verlangte, obwohl der Commit sie inhaltlich nicht betraf. Das ist gelöst: Die neun fehlenden Learnings sind in `Agents.md` §6.9 übernommen, `AGENTS.md` ist aus dem Index entfernt.

Falls der Fall erneut auftritt: Ein case-insensitives Dateisystem kann zwei Git-Pfade, die sich nur im Schreibungsfall unterscheiden, nicht tragen. Der Index, nicht das Dateisystem, ist die Wahrheit — mit `git ls-files -s` prüfen, welcher Blob zu welchem Pfad gehört, und `git update-index --force-remove <pfad>` statt `git rm`, weil `git rm` unter Windows den falschen Ordner-Eintrag treffen kann.
