# Agents.md — Feed the Floor: Meet Your Fate — Governance

> Leitender Systemarchitekt + Code-Enforcer. Diese Datei ist Gesetz. Wer hier pusht, hält sich dran oder fliegt aus dem Build.

## 1. Sprache & Kommunikation

- **Pflichtsprache:** Deutsch. Alles — Doku, Kommentare, Commits, Code-Docs, Fehlermeldungen für Devs.
- **Tonfall:** Direkt, informell (Discord-Bro-Style), lösungsorientiert, kompromisslos bei Fehlern. Kein Marketing-Gelaber, kein Zuckerguss. Sag was Sache ist, fix es, dokumentier es.
- **Commit-Nachrichten:** Deutsch. Titel = Conventional Commits (`feat:`, `fix:`, `arch:`, `docs:`, `chore:`). Body = Fließtext-Prosa, siehe §6.
- **Hardcode-Regel:** Absolute URLs, Credentials, private IDs, Hostnamen und maschinenbezogene Sonderwerte dürfen nur nach ausdrücklicher Vereinbarung hardcodiert werden. Repository-Dokumentation verwendet ausschließlich relative Pfade.

## 2. Anti-Doppelungs-Prinzip (DRY auf Architekturebene)

- Bevor du *irgendwas* Neues baust, suchst du im Repo nach existenten Patterns. `rg` ist Pflicht, nicht Kür.
- Gibt es schon eine Lösung für Grid, PRNG, Fixed-Point, Serialisierung, A*, Kampf-Tick — wiederverwenden, nicht neu erfinden.
- Doppelte Systeme = sofortiger Revert. Ein Pattern, ein Owner, eine Wahrheit.
- Neue Domäne nur nach Abgleich mit `docs/ARCHITEKTUR.md` und `docs/REPOINDEX.md`.

## 3. Modulare Architektur & Physische Ordner-Hierarchie

```
packages/
  contracts/          # Zod-Schemas, Protokoll-Versionen, Owner-Contracts
  sim-core/
    src/prng/         # Mulberry32, Seed-Ableitung
    src/math/         # Fixed-Point, int-sqrt, kein Float
    src/grid/         # 64x64 Grid, RLE+deflate, A* (+ Hard-Block)
    src/combat/       # Auto-Battler, 20 Ticks/s, 90s Limit
    src/genome/       # Zucht, Generation, Mutations-Seed
    src/items/        # Items, Essenzen, Steine (5/Boss)
    src/hash/         # Snapshot-Hash, Replay-Hash
    src/ghost/        # Ghost-Generator (deterministisch)
  client/
    src/dungeon-editor/ # PixiJS 8, Pinsel 1/2/4, Drag
    src/village/      # Gebäude, Attraktivität, Arbeiter
    src/inventory/    # Loot, Zerlegen, Ausrüstung (9 Slots)
    src/raid/         # Tactic-Board (3 Regeln/Held), Playback
    src/net/          # Upload/Results, Token, Retry
    src/storage/      # Dexie/IndexedDB, Editor-Stand lokal
    src/ui/           # Preact + Signals, PWA Shell, Tabs
  server/
    src/db/           # better-sqlite3, Snapshots, Scores
    src/matchmaking/  # Pool, Blind-Zuweisung, 7T Sperre
    src/sync/         # Defender-State, Replay-Validierung
scripts/
  shinon/             # Commit-Gate + Test-Suite + Plugin-Slices
  bump-version.mjs    # Mechanischer Version bump
VERSION               # Single Source of Truth (X.Y.Z, Patch 0..99)
docs/                 # Global Pflicht-Doku (aktiv)
packages/*/docs/      # Domain Pflicht-Doku (aktiv)
docs/historisch/      # Append-only Historie (nie kürzen)
```

- **Strikte Domain-Trennung:** Keine zirkulären Imports. `village` fasst `dungeon/grid` nicht an. `raid-sim` macht kein I/O. `matchmaking` ändert keine Kampfergebnisse.
- **Model Ownerships — wer besitzt was:**

| Owner | Besitzt | Darf nicht |
|-------|---------|------------|
| `village` | Gebäude, Attraktivität, Arbeiter | Dungeon-Zellen ändern |
| `dungeon` | Layout, Slots, Bau-Kapazität | Ressourcen buchen |
| `genome` | Zucht, Stats, Gen-Seed | Kämpfe rechnen |
| `items` | Items, Essenzen, Steine | Monster-Stats setzen |
| `raid-sim` | Kampf, Hash, Tactic-Eval | I/O, Zeit, externer Zufall |
| `matchmaking` | Pool, Zuweisung, Sperren | Kampfergebnisse ändern |
| `sync` | Upload/Results, Schutz, Log | Spielregeln enthalten |

- **Single Responsibility:** Eine Datei = ein Job. Kein God-File, kein Util-Sumpf.

## 4. Harte LOC-Caps

Kommentare (`//`, `/* */`, `/** */`) und Leerzeilen zählen nicht. Gemessen wird Code. Check via `scripts/check-loc.mjs`.

| Ownership / Pfad | Cap | Begründung |
|------------------|-----|------------|
| `packages/contracts/src` | **120** | Schemas sind Deklarationen — kurz, versioniert |
| `packages/sim-core/src/prng` | **80** | PRNG = 1 Funktion + Ableitung, mehr ist Slop |
| `packages/sim-core/src/hash` | **80** | Hash = pure Funktion |
| `packages/sim-core/src/math` | **120** | Fixed-Point + int-sqrt, kein Bloat |
| `packages/sim-core/src/grid` | **150** | Grid + Serialisierung getrennt von A* |
| `packages/sim-core/src/combat` | **150** | State-Machine in kleine Ticks splitten |
| `packages/sim-core/src/genome` | **150** | Zucht in Seed/Stat/Trait splitten |
| `packages/sim-core/src/items` | **150** | Loot/Stein/Essenz je File |
| `packages/sim-core/src/ghost` | **150** | Generator = Seed → Snapshot |
| `packages/client/src/net` | **100** | Handshake pur, kein UI |
| `packages/client/src/storage` | **100** | Dexie-Wrapper minimal |
| `packages/client/src/dungeon-editor` | **150** | Editor pro Concern splitten |
| `packages/client/src/village` | **150** | Gebäude je File |
| `packages/client/src/inventory` | **120** | Inventar/Shop/Zerlegen getrennt |
| `packages/client/src/raid` | **150** | Tactic-Board + Playback getrennt |
| `packages/client/src/ui` | **120** | Komponenten klein halten |
| `packages/server/src/db` | **120** | Query-Module klein |
| `packages/server/src/matchmaking` | **150** | Pool/Sperre/Score getrennt |
| `packages/server/src/sync` | **150** | Upload/Results/Replay getrennt |
| `scripts/shinon` (je Plugin) | **150** | Plugin = 1 Slice, 1 Job |
| `scripts/shinon` (engine) | **200** | Slicer + Runner |
| `scripts/bump-version.mjs` | **200** | Version bump — deterministisch |

- **Doku-Split mechanisch:** Aktive Doku (`docs/*.md`, `packages/*/docs/*.md`) max **200 Zeilen**. Wächst sie drüber, wandert der älteste Teil nach `docs/historisch/YYYY-MM-DD_<topic>.md` (append-only, nie löschen). So bleibt die aktive Doku immer überfliegbare.
- `README.md` ist Vorstellung, keine Tech-Doku.
- CI + Pre-Commit brechen bei Überschreitung. Keine Ausnahme ohne Arch-Review.

## 5. Repo-Hygiene & Automatisierte Pflicht-Dokumentation

Jede Domäne + Root halten diese 5 Doku-Arten aktuell. `scripts/check-hygiene.mjs` erzwingt es.

- **Changelog** (`CHANGELOG.md`): Was wurde exakt geändert? Datum + Scope + Auswirkung.
- **Architektur** (`ARCHITEKTUR.md`): Wie greifen Module ineinander? Owner-Grenzen + Datenfluss.
- **Stringmatrix** (`STRINGMATRIX.md`): Feste IDs, Protokoll-Keys, Item-Traits, Gebäude-IDs, Fehlercodes.
- **Funktionsgraph** (`FUNKTIONSGRAPH.md`): Wer ruft wen? Logische Abhängigkeiten, kein Code-Dump.
- **Repoindex** (`REPOINDEX.md`): Verzeichnis aller Komponenten der Domäne, 1 Zeile pro File mit Job.

Regel: Keine Änderung ohne Doku-Touch. Wer Code ohne Doku pusht, pusht nicht.

## 6. Git-Hooks & Commit-Gating (Shinon)

Shinon ist die lokale **Gate-Engine und Test-Suite in einem**. Jeder Test ist ein modulares Plugin, Shinon separiert die Test-Notwendigkeit dynamisch nach Commit-Slices. Full-Run ist NICHT der Standard — wir arbeiten sicher und performant mit Base + Core Tests.

### 6.1 Verbotene Footer (Hard-Fail)

Commit-Text wird gescannt. Sofortiger Fail bei Match (case-insensitive):

- `co-authored-by`
- `generated by`
- `powered by chatgpt|claude|gemini|openai|anthropic`
- `co-authored-by: codebuff`, `noreply@codebuff.com` — auch unser eigener Footer wird geblockt, Transparenz hin oder her. Kein Werbe-Müll im Log.

### 6.2 Minimale Prosa (Hard-Fail)

- Commit-Body (alles nach der ersten Leerzeile) muss **≥ 200 Wörter** Fließtext enthalten.
- Wort = `\S+` getrennt durch Whitespace. Gezählt wird nach Strip von Titeln und Kommentaren (`#`).
- Bullet-Verbot: Zeilen die mit `* `, `- ` oder `• ` beginnen = Fail. Keine Aufzählungen, nur Prosa. Fließtext heißt Sätze, nicht Listen.

### 6.3 Namentliche Nennung (Hard-Fail)

- Jede per `git diff --cached --name-only` modifizierte Datei muss namentlich im Body vorkommen (exakter Pfad oder Basename). Fehlt eine, Fail.
- Begründung im Fließtext, warum die Datei angefasst wurde.

### 6.4 Versionierung (mechanisch, bei jedem Push)

- **Single Source of Truth:** `VERSION` im Root (Format `X.Y.Z`, z. B. `0.0.1`).
- **Schema:** `PATCH` 0..99, `MINOR` 0..99, `MAJOR` offen. Nach `0.0.99` → `0.1.0`, nach `0.1.99` → `0.2.0`, nach `0.99.99` → `1.0.0` und so weiter. Streng `PATCH 0..99` dann `MINOR 0..99` dann `MAJOR+1`.
- **Bump:** `scripts/bump-version.mjs` — deterministisch, kein manueller Eingriff, schreibt `VERSION` + alle `package.json` (`root`, `contracts`, `sim-core`, `client`, `server`) synchron.
- **Trigger:** `post-commit` nach jedem erfolgreichen Commit automatisch (mechanisch) via `git commit --amend` mit aktiven Hooks (mit `SHINON_SKIP_BUMP=1` Loop-Schutz), danach Auto-Push. Der erste Root-Commit bleibt als Initialrelease `0.0.1` und löst keinen Bump aus.
- **Gate:** `version-gate` Plugin prüft `VERSION` vs alle `package.json` + 0..99 Range. Fail = Push geblockt.
- Manuelles Editieren von `VERSION` oder `package.json:version` ohne `bump-version.mjs` = Fail im `version-gate`.

### 6.5 Shinon-Mandat & Test-Suite — Plugin-Slices

Shinon ist die lokale Gate-Engine und testende Test-Suite in einem: Sie analysiert `git diff --cached`, startet nur die für den Slice notwendigen Plugins und behandelt jedes Gate als Hard-Fail. Fehler in Contracts, Determinismus, Doku, Versionierung, Commit-Nachricht oder Lifecycle blockieren den Commit beziehungsweise den Push; ein sichtbarer Fehlerpfad ist ein Ergebnis, kein Grund zum Umgehen. Full-Run nur in `pre-push` und im verpflichtenden GitHub-Check `Shinon Gate`.

**Base-Tests (laufen IMMER, bei jedem Commit):**

| Plugin | Triggert bei | Prüft |
|--------|--------------|-------|
| `loc-gate` | **immer** | LOC-Caps pro File (Kommentare ignoriert) |
| `hygiene-gate` | **immer** | Pflicht-Dokus vorhanden & ≤200 Zeilen aktiv |
| `version-gate` | **immer** | `VERSION` synchron + 0..99 Range |
| `commit-gate` | **immer** | Commit-Gate Shim (Detail in `commit-msg` Hook) |

**Core-Tests (laufen nur bei relevantem Slice — sicher + performant):**

| Plugin | Triggert bei | Prüft |
|--------|--------------|-------|
| `core-determinism` | `packages/sim-core/**`, `packages/contracts/**` | Bannt `Math.random`, `crypto.randomUUID`, `crypto.getRandomValues`, `Date.now`, `Math.sin/pow/cos/tan/sqrt`, `parseFloat` — deterministisch brechende Pattern |
| `schema-contract` | `packages/contracts/**`, `packages/**/sync/**`, `packages/**/net/**` | Zod-Schemata, `sim_version`, Protokoll-Keys in Stringmatrix |
| `false-positive` | `**/combat/**`, `**/genome/**`, `**/matchmaking/**`, `**/sync/**` | Edge-Case/Mutant-Smoke, Dead-Lock im Etagen-Loop |

Ablauf: Diff-Analyse → Slice-Run (Base immer + Core nur bei Bedarf) → Prosa/Footer-Scan → Verdict → bei Pass: `post-commit` bumped Version + amended Commit + Auto-Push. Fail = Commit geblockt, kein Push.

### 6.6 Hooks & Kette

- `.husky/pre-commit`: Shinon Slicer — slice-basierte Test-Suite (Base immer, Core nach Bedarf)
- `.husky/commit-msg`: Commit-Gate — Prosa 200, Bullet-Verbot, Footer-Block, Datei-Nennung
- `.husky/post-commit`: **Version bump** (`bump-version.mjs`) + `version-gate` Check + `amend` + **Auto-Push** (wenn `SHINON_AUTO_PUSH=1`, Loop-Schutz `SHINON_SKIP_BUMP=1`)
- `.husky/pre-push`: Full Test-Suite — alle Plugins (letzte Sicherung)
- GitHub Actions führt `Shinon Gate` bei Pull Requests und Pushes auf `main` aus; Branch-Protection verlangt diesen Status-Check, damit Direkt-Pushes ohne erfolgreichen Shinon-Lauf abgewiesen werden.

Kein `--no-verify` ohne Arch-Freigabe. Wer bypassed, schreibt im nächsten Commit warum.

### 6.7 Session-Learnings

- Leere `historisch/`- und Source-Domänenordner brauchen `.gitkeep`; Git tracked keine leeren Ordner, sonst brechen Fresh-Clone-Hygiene und `schema-contract` vor dem Commit.
- Runtime-Hooks kommen aus `.husky/_`; Hooktext-Änderungen müssen `scripts/shinon/install-hooks.mjs` und die generierten `.husky/*` gemeinsam treffen.
- `SHINON_SKIP_BUMP=1` verhindert Post-Commit-Recursion; `SHINON_AUTO_PUSH=0` ist der sichere lokale Lifecycle-Test, `1` ist der Default-Push.
- `schema-contract` und `false-positive` können bei leerer Core-Source grün werden; ein grüner Full-Run ist erst mit echter Source-Abdeckung aussagekräftig.
- `npm run -s typecheck` prüft die minimale `packages/contracts/src/index.ts`-Quelle und muss im offiziellen Initialstand TS18003 vermeiden.
- GitHub-Branch-Protection auf `main` verlangt den Status-Check `Shinon Gate`; lokale Hooks allein sind keine ausreichende Absicherung gegen erzwungene Direkt-Pushes.
- `.husky/post-commit` beendet Bump- oder Version-Gate-Fehler jetzt mit Exit != 0; `SHINON_SKIP_BUMP=1` bleibt ausschließlich der Recursion-Schutz.
- Der Post-Commit-Amend läuft mit aktiven Hooks und ohne `--no-verify`; bei Staging-, Amend- oder Push-Fehlern muss der Hook sichtbar fehlschlagen.
- README bleibt reine Verkaufsbühne; technische Verträge und Governance gehören in `docs/` bzw. `Agents.md`.

## 7. Umsetzung & Durchsetzung

- Verstöße werden im Pre-Commit geblockt, nicht erst in CI. CI wiederholt alle Gates (kein Vertrauen in lokalen Bypass).
- `pnpm check` bündelt `check-loc`, `check-hygiene`, `typecheck`, `shinon --full` (full = alle Plugins).
- Änderungen an dieser Datei (`Agents.md`) brauchen selbst 200-Wörter-Begründung. Meta-Governance gilt auch für sich selbst.

Legende: `[V]` = Vorschlag des Assistenten (streichbar), `[G]` = Gemini-Idee (nicht abgenickt). Ohne Markierung = deine Aussage.

— Architektur steht, Slop hat hier keinen Platz. Bau sauber oder bau nicht.
