# Copilot — Feed the Floor

`Agents.md` ist der verbindliche Einstieg für alle Contributor und Agenten. Lies vor Änderungen die dafür zuständigen Regelwerke; bei Widerspruch gilt `Agents.md`.

## Quellen nach Aufgabe

- `docs/REGELWERK_ARCHITEKTUR.md`: Domain-Owner, Grenzen, räumliche Datenwahrheit und LOC-Caps.
- `docs/REGELWERK_DOKUMENTATION.md`: Pflichtdokus, Hygiene, Aktualisierung und Archivierung.
- `docs/REGELWERK_GIT.md`: Shinon, Tests, Commit-Format, Versionierung und Lifecycle.
- `docs/ARCHITEKTUR.md`, `docs/ROADMAP.md` und die jeweilige `packages/*/docs/`: aktueller Systemzustand und Feature-Scope.

## Toolchain und Prüfungen

Node- und pnpm-Version stehen in `package.json` (`engines` und `packageManager`). Ausschließlich pnpm verwenden.

```bash
pnpm install --frozen-lockfile
pnpm run -s lint
pnpm exec tsc --noEmit
pnpm test
pnpm run -s check
pnpm --filter @floor/client build
```

`pnpm run -s check` ist der vollständige Abschlusslauf. Während der Arbeit dürfen passende Einzeltests und einzelne Shinon-Plugins gezielt ausgeführt werden; der Abschluss braucht die volle Prüfung gemäß `docs/REGELWERK_GIT.md`.

## Arbeitsweise

- Vor neuer Logik oder Abstraktion per `rg` nach bestehendem Owner und Pattern suchen.
- Bestehende fremde Änderungen nicht umordnen, zurücksetzen oder einem Task zuschreiben.
- Änderungen fachlich dokumentieren und die Doku-Gates laufen lassen.
- Keine Commits, Pushes, PRs oder Deployments ohne ausdrücklichen Auftrag.
