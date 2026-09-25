# scripts/shinon/docs/REPOINDEX.md

| Pfad | Job |
|------|-----|
| `engine.mjs` | Slicer + Runner (Base immer, Core nach Bedarf, 200 Cap) |
| `install-hooks.mjs` | Hook-Installation (Husky, Kette slice→gate→bump→push) |
| `commit-msg.mjs` | Commit-Gate (Prosa 200, Bullets, Footer, Datei-Nennung) |
| `plugins/loc-gate.mjs` | LOC-Cap Plugin (Base) |
| `plugins/hygiene-gate.mjs` | Hygiene Plugin (Base) |
| `plugins/version-gate.mjs` | VERSION sync Plugin (Base) |
| `plugins/commit-gate.mjs` | Commit-Gate Shim (Base) |
| `plugins/core-determinism.mjs` | Determinismus Scan (Core, crypto+Math Ban) |
| `plugins/schema-contract.mjs` | Vertrags-Check (Core) |
| `plugins/false-positive.mjs` | Dead-Lock Smoke (Core) |
| `docs/*` | Pflicht-Doku dieser Domäne |
