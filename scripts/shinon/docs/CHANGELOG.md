# scripts/shinon/docs/CHANGELOG.md

## 2026-09-25 — Offizieller Initialstand

- `Shinon Gate` läuft als verpflichtender GitHub-Check für Pull Requests und Pushes auf `main`.
- Der Root-Commit startet mit Version `0.0.1`, enthält eine echte Contracts-Quelle für den Typecheck und versioniert `package-lock.json` für reproduzierbare `npm ci`-Läufe.
- Governance bleibt in `Agents.md` kanonisch; Mirrors und Session-Learning enthalten keine konkurrierenden Regeln.

## 2026-09-25 — Lifecycle-Gate-Härtung

- Der Post-Commit-Amend läuft mit aktiven Hooks; der frühere `--no-verify`-Pfad ist entfernt.
- Staging-, Amend- und Push-Fehler beenden den Hook mit Exit ungleich null, damit Versionszustand und Commit nicht auseinanderlaufen.

## 2026-09-25 — Gate-Fehlerstatus

- Post-Commit-Hook beendet Bump- und Version-Gate-Fehler jetzt mit Exit ungleich null.
- Installer- und Runtime-Hook bleiben synchron.

## 2026-09-25 — Init

- Shinon Engine (Slicer + Runner), 5 Plugins (loc-gate, hygiene-gate, core-determinism, schema-contract, false-positive).
- Hooks: pre-commit (slice), commit-msg (200 Wörter, Bullets, Footer, Datei-Nennung), post-commit (Auto-Push), pre-push (full).
