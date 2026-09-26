# scripts/shinon/docs/CHANGELOG.md

## 2026-09-27 — promote-Gate schließt Entwürfe aus

Der Job `promote` in `.github/workflows/shinon.yml` verlangt jetzt `github.event.pull_request.draft == false`. `pull_request` feuert auch für Entwürfe, ein Entwurf mit grünem Gate wäre damit ein stiller Merge nach `main`. `tests/gate-parity.test.mjs` prüft die Bedingung, damit sie nicht still verschwindet.

## 2026-09-26 — Main-Watchdog meldet rote Push-Läufe auf main

Der Push-Zweig des Shinon-Workflows ist per Konstruktion fail-open: Branch-Protection prüft einen SHA, keinen Zustand, und die Pflichtprüfung für einen Push muss vor dem Push existieren, während ein Push-Workflow vom Push ausgelöst wird. Ein roter Push-Lauf auf `main` kann deshalb nichts mehr aufhalten, nur melden — und genau das ist einmal unbemerkt geblieben. `.github/workflows/main-watchdog.yml` hängt per `workflow_run` am Shinon-Workflow, filtert auf `branches: [main]` und schafft bei `conclusion != 'success'` einen offenen Issue mit dem Label `watchdog`, nachgetragen statt dupliziert, und wird selbst sichtbar rot. `tests/main-watchdog.test.mjs` sichert den Vertrag mit sechs Gegenproben, darunter der Verzicht auf einen kostenpflichtigen Runner und — nach einem Befund im ersten echten Lauf — das Verbot von `actions/checkout` im Watchdog: Ohne `GH_REPO` ermittelt `gh` das Repository über git, bricht ab und der Watchdog ist rot, aber stumm.

## 2026-09-26 — Next-Bump-Zähler mit Basis aus dem Online-Stand

`scripts/bump-version.mjs` zählte aus der lokalen Datei hoch und sah damit parallele Arbeit nicht. Zwei Branches von derselben Basis vergaben dieselbe Nummer, und weil die Rebase-Regel `VERSION` mit `git checkout --ours` auflöst, verschluckte ein anschließender Rebase den Bump des zweiten Branches zusätzlich: Der gelandete Commit trug exakt die Nummer seines Nachbarn. Auf `main` ist so am 2026-09-26 genau einmal 0.0.37 doppelt vergeben worden, auf `222d2a2` und `fb5f5bc`, wobei `fb5f5bc` ein direktes Kind von `222d2a2` ist — die Branches landeten also nacheinander, der Fehler ist deterministisch und keine Race-Condition. Der Zähler liest die Basis jetzt aus `origin/main`, meldet eine Abweichung zwischen Basis und lokalem Stand auf stderr und verweigert eine Nummer, die in den letzten fünfzig Bump-Commits der Basis bereits steht. Neu sind der reine Fragemodus `--next`, der die Zahl auf stdout schreibt und sonst nichts anfasst, sowie `--ref` für eine andere Basis. Ohne erreichbare Basis fällt der Zähler auf lokal zurück und sagt das vorher, statt still zu raten. `tests/bump-version.test.mjs` deckt Linearfall, Drift, Fragemodus, Kollisionsverweigerung, Offline-Rückfall, Manifest-Synchronität und den Carry ab. Der Historien-Scan läuft über `git cat-file --batch`, damit der Hook nicht fünfzig Prozesse für eine Versionsfrage braucht; gemessen sind rund sechshundert Millisekunden inklusive Node-Start.
## 2026-09-26 — push-Zweig auf main vom GITHUB_TOKEN entkoppelt

`tests/gate-parity.test.mjs` prüft jetzt den Deploy-Pfad auf `main`, nicht mehr nur die Parität der Gate-Schritte. Der Job `promote` schob mit dem mitgelieferten `GITHUB_TOKEN` nach `main`; GitHub startet für Events, die ein `GITHUB_TOKEN` ausgelöst hat, bewusst keinen neuen Workflow-Lauf, deshalb feuerte der push-Trigger nach der Einführung des Jobs kein einziges Mal. Sechs Merges auf `main` kamen durch, der letzte Workflow-Lauf mit `event: push` lag davor, und das `client-dist`-Artefakt wurde nicht mehr erzeugt — ohne dass ein Gate rot geworden wäre. Der stumme Ausfall wird jetzt durch drei Zusicherungen ausgeschlossen: `promote` muss `secrets.PROMOTE_TOKEN` verwenden, der Job darf keine Schreibberechtigung über den `GITHUB_TOKEN` behalten, und der push-Trigger muss am Deploy-Artefakt hängen. Dazu prüft der Test `persist-credentials: false`, damit der Checkout keine Zugangsdaten des mitgelieferten Tokens persistiert. Die Gegenproben sind gegen drei zurückgesetzte Varianten geprüft und fallen rot.

## 2026-09-26 — commit-integrity repariert, Gate-Parität als Test verankert

`plugins/commit-integrity.mjs` baute die Bereichsauflösung als `git rev-parse --verify <sha>^{commit}` ohne Anführungszeichen. Unter Windows ruft `execSync` `cmd.exe`, und dort ist `^` das Escape-Zeichen; git bekam `<sha>{commit}` und antwortete mit `Needed a single revision`, wodurch der Bereich als nicht prüfbar galt. In CI unter `/bin/sh` blieb der Fehler unsichtbar, der Weg ohne `--from` war nicht betroffen. Der Aufruf ist jetzt gequotet, `tests/gates.test.mjs` deckt den Fall mit einem echten SHA in einem temporären Repository ab, und `tests/gate-parity.test.mjs` stellt den Workflow gegen die lokalen Script-Ketten.

## 2026-09-26 — Befund: Hook-Texte doppelt gehalten

Keine Codeänderung. Aus dem Befund-Review: `install-hooks.mjs` schreibt die Inhalte der fünf Hook-Dateien (`pre-commit`, `prepare-commit-msg`, `commit-msg`, `post-commit`, `pre-push`) als Stringliterale in `.husky/`, statt sie zu importieren oder aus einer gemeinsamen Quelle zu ziehen. Ein Edit an einem Hook muss derzeit an zwei Orten nachgezogen werden, sonst laufen der installierte und der eingecheckte Hook auseinander. Die Auflösung ist ein Code-Thema und keine Doku-Aufgabe; hier nur als Beobachtung festgehalten.

## 2026-09-25 — Merge- und Pull-Request-Pfad gate-fähig

- Der Workflow triggerte ausschließlich auf `push: [main]`. Verlangt die Branch-Protection den Kontext `Shinon Gate`, entsteht für einen Pull Request damit nie ein Check, und über diesen Weg kann nichts landen. Der Workflow hat jetzt zusätzlich `pull_request` gegen `main`; die Range kommt per `github.event.pull_request.base.sha`.
- `commit-integrity` scheiterte an GitHubs synthetischem Test-Merge `refs/pull/N/merge`, der keinen Body besitzt. Die Range wird nun mit `git log --no-merges` gelesen: Ein Merge trägt keinen eigenen Inhalt, geprüft werden die Inhalts-Commits, und der Merge bleibt über seine Eltern im Geltungsbereich.
- `.husky/prepare-commit-msg` in Verbindung mit `lib/integration-text.mjs` erzeugt für Merge- und Squash-Vorgänge einen gate-konformen Body. `lib/integration-text.mjs` ist rein, ohne Git-Zugriff, und prüft seine eigene Erzeugung über dieselbe `checkMessage`-Funktion, die auch `commit-msg` und `commit-integrity` verwenden.
- `scripts/shinon/install-hooks.mjs` installiert den zusätzlichen Hook, damit die Kette nach einem Fresh Clone vollständig ist und nicht nur auf dem Entwicklerrechner existiert.
- Ein Rebase über fremde ungestagte Änderungen läuft mit `--autostash`, sonst verweigert Git den Start und fremde Arbeit müsste von Hand gesichert werden.

## 2026-09-25 — Gate gegen Clone-Umgehung verankert

- Der lokale `commit-msg`-Hook allein war kein Schutz: `core.hooksPath` liegt nur in `.git/config`, `.husky/_` ist nicht im Repo, und `pnpm install --ignore-scripts` überspringt den `prepare`-Pfad, der Husky erst installiert. Ein Fresh Clone war damit gate-frei.
- Die Commit-Regeln sind nach `lib/commit-text.mjs` ausgelagert, einer reinen Funktion ohne I/O. `commit-msg.mjs` ist nur noch Shim für die lokalen Hook-Belange, das neue `plugins/commit-integrity.mjs` teilt sich dieselbe Quelle. Damit können lokale und ferne Prüfung nicht auseinanderlaufen.
- `plugins/commit-integrity.mjs` prüft die tatsächlichen Commits einer Range aus Git, nicht den Slicer-Diff, der in einem frischen CI-Checkout leer ist. Der Workflow übergibt deshalb `github.event.before` explizit und stellt den Checkout auf `fetch-depth: 0`.
- Das Plugin ist bewusst fail-closed: unauflösbare Referenz, fehlender Wert nach `--from` und unlesbare Range sind Hard-Fails statt eines grünen Nichts. Ohne diese Eigenschaft wäre exklusives Umgehen möglich, indem man die Range kaputt macht.
- `required_status_checks` auf `main` verlangt den Kontext `Shinon Gate`. Erst dieser zweite Pfeiler macht `--no-verify` wirkungslos, weil der lokale Bypass den Exit-Code des Hooks ändert, nicht den Status des Remote-Checks.

## 2026-09-25 — Versionsbump formatstabil

- `scripts/bump-version.mjs` ersetzt das vorhandene JSON-Version-Feld nun ohne vollständiges Reserialisieren der Package-Dateien. Dadurch bleibt Biome-Formatierung nach jedem Post-Commit-Amend erhalten.
- Der Remote-Fehler des ersten pnpm-CI-Laufs wurde damit als reproduzierbarer Lifecycle-Bug behoben: lokale Formatierung darf nicht durch den Versionsbump wieder entfernt werden.

## 2026-09-25 — main-only Remote-Gate

- GitHub Actions auf den verpflichtenden `main`-Push-Workflow umgestellt; der lokale Pre-Push-Full-Gate bleibt unverändert die erste Sperre.
- pnpm wird als Installations- und Ausführungswerkzeug verwendet; `package-lock.json` ist nicht mehr Teil des aktuellen Toolchain-Pfads.
- Review vor jedem Task-Commit, Body-Pflicht und das Verbot von Ausweichpfaden sind als kanonische Governance in `Agents.md` festgeschrieben.

## 2026-09-25 — Slicer-Grenzfälle gehärtet

- `shouldRun` behandelt einen leeren Diff-Slice wie "kein relevanter Slice": Skip-Gates laufen im Commit nicht leer, Full-Run in Pre-Push und CI bleibt die letzte Instanz.
- Min-Heap im Core trennt Steps-First und Cost-First-Ordering; der Fallback-Suchpfad optimiert jetzt wirklich Minimalkosten statt Minimalschritte.
- Golden-Tests decken den Fallback-Ordering-Fall ab und rotieren gegen den alten Always-Steps-First-Heap.

## 2026-09-25 — Globale Governance-Gates

- Shinon prüft jetzt global LOC-Budgets, Contracts, Modularität, Dead Code und Redundanz als blockierende Base-Module.
- Der Contract-Gate erzwingt Zod, sim_version und reine Contract-Grenzen; Modularity-Gate verbietet Domain-Leaks und Zyklen; Dead-Code-Gate nutzt TypeScript-NoUnused.
- Globaler LOC-Gate erzwingt einen dynamisch aus den Ownership-Caps abgeleiteten Datei-Cap; es gibt kein künstliches Gesamtbudget.
- Die Modularity-Fixtures prüfen jetzt sowohl verbotene Zyklen als auch die erlaubten Contracts-, Sim-Core-, Client- und Server-Abhängigkeiten.
- Source-Erkennung, Ignore-Regeln und LOC-Zählung sind in `lib/source-scan.mjs` zentralisiert; versionierte Gate-, LOC-, Ignore- und Dependency-Policies liegen in `policy.json`/`policy.mjs` und werden strikt über `policy-schema.mjs` validiert.
- Policy-Versionierung ist explizit: Nur Version 1 wird geladen; inkompatible oder fehlerhafte Policies lösen keinen stillen Fallback, sondern einen Hard-Fail mit Feldpfad aus.
- `engine.mjs` lädt seine Always- und Slice-Trigger aus `policy.json`; der doppelte `schema-contract`-Slicer-Fall wurde entfernt.
- Integrationstests prüfen Policy-Matching direkt und starten die echte Engine nur noch in einem Smoke-Test mit gemischten Slices.
- Engine-Policies werden zusätzlich gegen die tatsächlich vorhandenen Plugin-Dateien geprüft; unbekannte oder unkonfigurierte Plugin-Namen blockieren den Loader.

## 2026-09-25 — Offizieller Initialstand

- `Shinon Gate` läuft als verpflichtender GitHub-Check für Pull Requests und Pushes auf `main`.
- Der Root-Commit startet mit Version `0.0.1`, enthält eine echte Contracts-Quelle für den Typecheck und versioniert `package-lock.json` für reproduzierbare `npm ci`-Läufe.
- Governance bleibt vollständig in `Agents.md` kanonisch; eigenständige Agent-Dokumente und Session-Learning-Duplikate werden nicht gepflegt.

## 2026-09-25 — Lifecycle-Gate-Härtung

- Der Post-Commit-Amend läuft mit aktiven Hooks; der frühere `--no-verify`-Pfad ist entfernt.
- Staging-, Amend- und Push-Fehler beenden den Hook mit Exit ungleich null, damit Versionszustand und Commit nicht auseinanderlaufen.

## 2026-09-25 — Gate-Fehlerstatus

- Post-Commit-Hook beendet Bump- und Version-Gate-Fehler jetzt mit Exit ungleich null.
- Installer- und Runtime-Hook bleiben synchron.

## 2026-09-25 — Init

- Shinon Engine (Slicer + Runner), 5 Plugins (loc-gate, hygiene-gate, core-determinism, schema-contract, false-positive).
- Hooks: pre-commit (slice), commit-msg (200 Wörter, Bullets, Footer, Datei-Nennung), post-commit (Auto-Push), pre-push (full).
