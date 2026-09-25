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
- Bei fremden staged oder untracked Änderungen darf ein Commit-Amend über einen temporären `GIT_INDEX_FILE` laufen, der mit `git read-tree HEAD` initialisiert wurde; dadurch werden fremde Änderungen weder gestaged noch committed.
- Ein Rebase ist ein No-op, wenn `origin/main` bereits Ancestor von `HEAD` ist; erst `git rev-list --left-right --count origin/main...HEAD` prüfen, dann keinen Stash für einen unnötigen Rebase anlegen.
- GitHub kann einen gültig SSH-signierten Commit als unverifiziert ablehnen, wenn der Committer eine nicht verifizierte Adresse wie `vannon@local` nutzt; Repository-Identität auf die verifizierte Noreply-Adresse setzen und neu signieren.
- `git verify-commit --verbose HEAD` benötigt für SSH-Signaturen `gpg.ssh.allowedSignersFile`; ein gültiger Key allein beweist ohne Allowlist nicht die lokale Git-Verifikation.
- Ob ein öffentlicher SSH-Signing-Key bei GitHub registriert ist, lässt sich read-only mit `gh api user/ssh_signing_keys` prüfen; niemals den privaten Key hochladen.
- Ein lokaler Shinon-Pre-Push-Pass erfüllt keinen auf GitHub verlangten Status-Check; `GH013` bei geschütztem `main` bedeutet, dass der Remote-Stand vor dem Commit-Update nicht akzeptiert wurde.
- Nach `git push -u` immer `git branch -vv` prüfen, weil ein Push vom lokalen `main` versehentlich einen Feature-Branch als Upstream setzen kann; für `main` explizit `origin/main` als Upstream verwenden.
- Wenn der Nutzer ausdrücklich „alles lokal“ verlangt, keine Push-, PR- oder sonstige Remote-Aktion ausführen und die lokale Shinon-Verifikation als Ziel dokumentieren.
