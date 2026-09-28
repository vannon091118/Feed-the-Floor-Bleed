# docs/historisch/2026-09-26_changelog-toolchain-pins.md — Toolchain-Pins und Grenzen

Abgelegt aus `docs/CHANGELOG.md` am 2026-09-28, weil der aktive Changelog an die 200-Zeilen-Cap kam. Inhaltlich unverändert.

## 2026-09-26 — Biome 2.5.14, TypeScript 6.0.3 und Vitest 5.0.1 übernommen

Drei der vier offenen Dependabot-Bumps sind gelandet, der vierte ist bewusst nicht. `@biomejs/biome` geht von `1.9.4` auf `2.5.14`, `typescript` von `5.6.3` auf `6.0.3` und `vitest` von `2.1.8` auf `5.0.1`.

TypeScript 7 ist dabei nicht übernommen worden. Die 7er-Linie liefert nur noch eine native Binärdatei aus und exportiert `createScanner`, `createSourceFile`, `SyntaxKind` und `isIfStatement` nicht mehr; `scripts/shinon/lib/source-scan.mjs` und `scripts/shinon/plugins/dead-code-gate.mjs` bauen auf dieser API auf und laufen ohne Neuaufbau der Gates nicht. Stattdessen ist die höchste 6er-Version gewählt. Die damit verbundene `baseUrl`-Entfernung ist in `tsconfig.json` umgesetzt: das Feld ist weg, alle acht Aliase in `paths` sind jetzt relativ mit führendem `./`. `packages/sim-core/src/combat/fixture-job.ts` hatte eine eigene Issue-Form mit `readonly (string | number)[]`, die auf `readonly PropertyKey[]` gewachsen ist.

Vitest 5 hat den `basic`-Reporter und den Default-Timeout-Verhalten geändert. Der `basic`-Reporter existiert nicht mehr, und `scripts/shinon/tests/engine-slicing.test.mjs` braucht unter Parallel-Last rund acht Sekunden, weil der Test ein echtes Git-Repository anlegt und die Engine als Kindprozess startet; `vitest.config.ts` setzt deshalb `testTimeout: 30_000`. Dieselbe Datei schließt jetzt `.freebuff/` aus, weil Vitest `.gitignore` nicht respektiert und sonst die Tests der Feature-Worktrees ein zweites Mal mitzählt.

Biome 2 verlangt in `biome.json` `rules.preset` statt `rules.recommended`, und das `$schema` zeigt auf die 2.5.14-Version. Die neuen Regeln haben drei unbenutzte Importe, zwei unbenutzte Variablen und einen überflüssigen Backslash in `scripts/shinon/install-hooks.mjs` gefunden; die Fixes sind angewandt. Die Formatierung von `packages/client/src/ui/styles.css` hat sich durch den Biome-2-Formatter geändert.

Zod bleibt bewusst auf `3.23.8`. Der `schema-contract`-Gate pinnt die Version in `scripts/shinon/policy.json`, weil Contracts, Client und Server eine Zod-Instanz teilen. Die v4-Migration war durchführbar und ist im Laufe dieses Durchgangs erarbeitet worden, sie wird aber nicht übernommen. `docs/DEV_REQUIREMENTS.md` führt die Gründe für alle drei Pins jetzt in einem eigenen Abschnitt und nennt die konkreten v4-Umbrüche, damit der Bump als eigene Task mit Freigabe behandelt werden kann.
