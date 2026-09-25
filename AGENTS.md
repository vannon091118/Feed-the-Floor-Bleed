# AGENTS.md — Session-Learnings

Die vollständige, kanonische Repo-Governance steht in [`Agents.md`](Agents.md). Diese Datei enthält nur nicht offensichtliche, sessionübergreifende Erkenntnisse; vor jeder Arbeit muss zuerst `Agents.md` gelesen werden.

- Leere `historisch/`- und Source-Domänenordner brauchen `.gitkeep`, sonst scheitern Fresh-Clone-Hygiene und `schema-contract`.
- Runtime-Hooks kommen aus `.husky/_`; Änderungen müssen `scripts/shinon/install-hooks.mjs` und `.husky/*` gemeinsam treffen.
- `SHINON_SKIP_BUMP=1` schützt den Post-Commit-Loop; `SHINON_AUTO_PUSH=0` ist der sichere lokale Lifecycle-Test.
- Leere Core-Source kann Shinon-Plugins grün, aber noch ohne echte Testabdeckung machen.
- `npm run -s typecheck` prüft die minimale `packages/contracts/src/index.ts`-Quelle und muss im offiziellen Initialstand TS18003 vermeiden.
- GitHub-Branch-Protection auf `main` verlangt den Status-Check `Shinon Gate`; lokale Hooks allein schützen nicht vor erzwungenen Direkt-Pushes.
- Post-Commit-Bump- und Version-Gate-Fehler müssen als Exit ungleich null sichtbar bleiben; `SHINON_SKIP_BUMP=1` ist nur der Recursion-Schutz.
- README bleibt reine Verkaufsbühne; technische Wahrheit gehört in `docs/` und `Agents.md`.
- `Agents.md` ist die einzige kanonische Shinon-Governance; diese Datei und der GitHub-Spiegel dürfen keine eigenständigen Duplikate enthalten.
