# scripts/shinon/docs/STRINGMATRIX.md

| Schlüssel | Bedeutung |
|-----------|-----------|
| `shinon/slice` | Diff-basierte Plugin-Auswahl (Base immer, Core nach Bedarf) |
| `shinon/full` | `--full` flag für alle Plugins (nur pre-push) |
| `shinon/test-suite` | Jede Prüfung ist ein Plugin — Shinon ist die Test-Suite |
| `gate/loc` | LOC-Cap Check (Base) |
| `gate/hygiene` | Doku-Pflicht Check (Base) |
| `gate/version` | VERSION sync + 0..99 Range (Base) |
| `gate/commit` | Commit-Gate Shim (Base, Detail in commit-msg) |
| `gate/determinism` | Bannt Math.random, crypto.random, Date, sin/pow (Core) |
| `gate/prosa200` | ≥200 Wörter im Body |
| `gate/bullet-ban` | Kein `* `, `- `, `• ` im Body |
| `gate/footer-ban` | Blockt KI-Werbung |
| `gate/file-mention` | Jede geänderte Datei im Body |
| `version/bump` | PATCH 0..99 → MINOR 0..99 → MAJOR |
