# scripts/shinon/docs/FUNKTIONSGRAPH.md

```
git diff --cached → engine:slicer → shouldRun(plugin)
engine → plugins/loc-gate → check-loc.mjs
engine → plugins/hygiene-gate → check-hygiene.mjs
engine → plugins/core-determinism (Scan)
engine → plugins/schema-contract (Matrix+Version)
engine → plugins/false-positive (Dead-Lock Smoke)
commit-msg → commit-msg.mjs (Prosa/Footer/Bullet/Datei-Nennung)
post-commit → git push (wenn SHINON_AUTO_PUSH=1)
```

Kein Plugin kennt ein anderes. Engine orchestriert.
