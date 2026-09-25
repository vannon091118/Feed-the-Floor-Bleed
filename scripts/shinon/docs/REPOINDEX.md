# scripts/shinon/docs/REPOINDEX.md

| Pfad | Job |
|------|-----|
| `engine.mjs` | Slicer + Runner (Base immer, Core nach Bedarf, 200 Cap) |
| `install-hooks.mjs` | Hook-Installation (Husky, Kette slice→gate→bump→push) |
| `commit-msg.mjs` | Commit-Gate Shim für den lokalen Hook (Prosa 200, Bullets, Footer, Datei-Nennung) |
| `lib/commit-text.mjs` | Einzige Quelle der Commit-Regeln, pure Funktion ohne I/O, geteilt von Hook und Plugin |
| `lib/source-scan.mjs` | Gemeinsamer Source-Scanner, Ignore-Regeln und LOC-Zählung |
| `lib/engine-policy.mjs` | Reine Slicer-Entscheidung für Always- und Slice-Trigger |
| `policy.json` / `policy.mjs` | Versionierte Gate-, LOC-, Ignore- und Dependency-Policies |
| `policy-schema.mjs` | Strikter Zod-Validator und formatierte Policy-Fehler |
| `plugins/loc-gate.mjs` | Ownership-LOC-Cap Plugin (Base) |
| `plugins/global-loc-gate.mjs` | Globaler Datei-Cap-Gate ohne künstliches Gesamtbudget (Base) |
| `plugins/hygiene-gate.mjs` | Hygiene Plugin (Base) |
| `plugins/version-gate.mjs` | VERSION sync Plugin (Base) |
| `plugins/commit-gate.mjs` | Commit-Gate Shim (Base) |
| `plugins/commit-integrity.mjs` | Fail-closed Fernprüfung der echten Commits einer Range (Base, CI) |
| `plugins/schema-contract.mjs` | Zod- und Contract-Grenzen-Gate (Base) |
| `plugins/modularity-gate.mjs` | Domain-Grenzen und Import-Zyklen-Gate (Base) |
| `plugins/dead-code-gate.mjs` | NoUnused- und Dead-Code-Gate (Base) |
| `plugins/redundancy-gate.mjs` | Redundanz-Gate für Package-Code (Base) |
| `plugins/core-determinism.mjs` | Determinismus Scan (Core, crypto+Math Ban) |
| `plugins/false-positive.mjs` | Dead-Lock Smoke (Core) |
| `tests/gates.test.mjs` | Positive und negative Governance-Gate-Fixtures |
| `tests/engine-policy.test.mjs` | Schnelle Policy-Matching-Unit-Tests |
| `tests/engine-slicing.test.mjs` | Ein echter Engine-Smoke-Test für gemischte Slices |
| `tests/fixtures/*` | Isolierte Testdaten für Gate-Validierung |
| `docs/*` | Pflicht-Doku dieser Domäne |
