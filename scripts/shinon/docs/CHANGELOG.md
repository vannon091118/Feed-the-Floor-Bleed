# scripts/shinon/docs/CHANGELOG.md

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
