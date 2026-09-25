# scripts/shinon/docs/FUNKTIONSGRAPH.md

```
git diff --cached → engine:slicer → shouldRun(plugin)
engine → lib/source-scan → gemeinsamer Scanner + LOC-Zähler
engine → policy.json → zentrale Gate- und Dependency-Policies
engine → plugins/loc-gate → check-loc.mjs
engine → plugins/global-loc-gate → global LOC-Budget
engine → plugins/hygiene-gate → check-hygiene.mjs
engine → plugins/schema-contract (Zod+sim_version+Grenzen)
engine → plugins/modularity-gate (Domain-Grenzen+Zyklen)
engine → plugins/dead-code-gate (NoUnused+Dead-Code)
engine → plugins/redundancy-gate (Duplikatblöcke)
engine → plugins/core-determinism (Scan)
engine → plugins/false-positive (Dead-Lock Smoke)
commit-msg → commit-msg.mjs → lib/commit-text.mjs (Prosa/Footer/Bullet/Datei-Nennung)
prepare-commit-msg → prepare-commit-msg.mjs → lib/integration-text.mjs (Merge-/Squash-Body)
lib/integration-text.mjs → lib/commit-text.mjs (checkMessage prüft die Erzeugung nach)
plugins/commit-integrity → lib/commit-text.mjs (dieselben Regeln, echte Inhalts-Commits)
workflow Shinon Gate (push) → commit-integrity --from <before> → required_status_checks auf main
workflow Shinon Gate (pull_request) → commit-integrity --from <pull_request.base.sha> → derselbe Status-Kontext
post-commit → git push (wenn SHINON_AUTO_PUSH=1)
```

Kein Plugin kennt ein anderes. Engine orchestriert. `lib/commit-text.mjs` ist die einzige Stelle, an der Commit-Regeln definiert sind; Hook und Plugin teilen sie sich bewusst, damit lokale und ferne Prüfung nicht auseinanderlaufen können. `lib/integration-text.mjs` erzeugt Integrations-Nachrichten und prüft sie über dieselbe `checkMessage`-Funktion nach, damit Rebase, Merge und Pull Request keinen zweiten Regelpfad bekommen. `commit-integrity` liest die Range mit `git log --no-merges`, weil ein Merge-Commit keinen eigenen Inhalt trägt und GitHubs synthetischer Test-Merge nie einen Body besitzt; geprüft werden genau die Commits, die Dateien verändern.
