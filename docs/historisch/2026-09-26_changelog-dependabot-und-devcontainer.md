# docs/historisch/2026-09-26_changelog-dependabot-und-devcontainer.md

Append-only Archiv aus `docs/CHANGELOG.md`. Enthält den Eintrag vom 2026-09-26 zu Dependabot und Devcontainer. Verschoben am 2026-09-27, damit der aktive Changelog nach dem Worker-Log-Eintrag unter dem Cap von 200 Zeilen bleibt. Der Text ist wortgleich unverändert.

## 2026-09-26 — Dependabot und Devcontainer aus dem Vorlagenzustand geholt

`.github/dependabot.yml` war die unveränderte GitHub-Vorlage und aktualisierte ausschließlich `devcontainers`; für das pnpm-Workspace gab es damit keine Dependency-Updates. Die Datei führt jetzt das npm-Ökosystem auf `/`, das `package.json` und `pnpm-lock.yaml` liest und die Workspace-Pakete über das Root-Manifest mitzieht, behält den devcontainers-Eintrag und ist auf zwei Leerzeichen eingerückt. Ein Kommentar hält fest, dass Dependabot-PRs die Commit-Regeln aus `docs/REGELWERK_GIT.md` nicht erfüllen und vor dem Merge einen gate-konformen Commit brauchen.

`.devcontainer/devcontainer.json` war ebenfalls Roh-Template mit einer Vielzahl auskommentierter Beispielblöcke und ohne pnpm. Die Vorlage ist auf das Nötige reduziert, das TypeScript-Node-Image bleibt und erfüllt die `engines`-Vorgabe `>=22`; neu ist `postCreateCommand` mit `corepack enable && pnpm install --frozen-lockfile`, sodass Corepack pnpm in der über `packageManager` gepinnten Version aktiviert und die Dependencies wie in der CI installiert. `docs/REPOINDEX.md` registriert beide Dateien, die zuvor dort fehlten.
