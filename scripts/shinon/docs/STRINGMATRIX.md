# scripts/shinon/docs/STRINGMATRIX.md

| Schlüssel | Bedeutung |
|-----------|-----------|
| `shinon/slice` | Diff-basierte Plugin-Auswahl (Base immer, Core nach Bedarf) |
| `shinon/full` | `--full` flag für alle Plugins (nur pre-push) |
| `shinon/test-suite` | Jede Prüfung ist ein Plugin — Shinon ist die Test-Suite |
| `engine/always` | Immer laufende Gate-Plugins aus `policy.json` |
| `engine/slice` | Diff-Trigger für Core-Plugins aus `policy.json` |
| `gate/loc` | Ownership-LOC-Cap Check (Base) |
| `gate/global-loc` | Globaler Datei-Cap; Gesamtgröße wird berichtet, aber nicht künstlich begrenzt (Base) |
| `gate/hygiene` | Doku-Pflicht Check (Base) |
| `gate/contracts` | Zod, sim_version und Contract-Grenzen (Base) |
| `gate/modularity` | Domain-Grenzen, Deep-Imports und Import-Zyklen (Base) |
| `gate/dead-code` | TypeScript-NoUnused und Dead-Code-Muster (Base) |
| `gate/redundancy` | Duplizierte Codeblöcke in Package-Quellen (Base) |
| `gate/version` | VERSION sync + 0..99 Range (Base) |
| `gate/commit` | Commit-Gate Shim (Base, Detail in commit-msg) |
| `gate/commit-integrity` | Fail-closed Fernprüfung der echten Inhalts-Commits einer Range (Base, CI) |
| `gate/commit-integrity/merges` | Merge-Commits werden übersprungen, weil sie keinen eigenen Inhalt tragen |
| `gate/commit-integrity/--from` | Range-Basis der Fernprüfung; Push `github.event.before`, PR `github.event.pull_request.base.sha` |
| `hook/prepare-commit-msg` | Ersetzt zu dünne Merge-/Squash-Bodies, normale Commits bleiben unberührt |
| `shinon/integration` | Rebase-, Merge- und PR-Nachrichten aus `lib/integration-text.mjs` |
| `gate/integration-text` | Generierte Integrations-Nachrichten werden über `checkMessage` nachgeprüft |
| `ci/pull_request` | Der Workflow triggert auch auf PRs gegen `main`, sonst entsteht nie ein Status-Check |
| `gate/determinism` | Bannt Math.random, crypto.random, Date, sin/pow (Core) |
| `gate/prosa200` | ≥200 Wörter im Body |
| `gate/bullet-ban` | Kein `* `, `- `, `• ` im Body |
| `gate/footer-ban` | Blockt KI-Werbung |
| `gate/file-mention` | Jede geänderte Datei im Body |
| `version/bump` | PATCH 0..99 → MINOR 0..99 → MAJOR |
