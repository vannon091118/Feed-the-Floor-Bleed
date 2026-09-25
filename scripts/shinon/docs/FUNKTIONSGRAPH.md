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
commit-msg → commit-msg.mjs (Prosa/Footer/Bullet/Datei-Nennung)
post-commit → git push (wenn SHINON_AUTO_PUSH=1)
```

Kein Plugin kennt ein anderes. Engine orchestriert.
