# Agents.md — Verbindlicher Einstieg

Dieses Repository folgt verbindlichen Regeln. Diese Datei ist der Einstieg und legt Sprache, Grundsätze und Zuständigkeit der Regelquellen fest; sie soll keine Detailregelwerke duplizieren.

## Autorität und Profile

- Alle Contributor und Agenten befolgen diese Datei sowie die jeweils einschlägigen Regelwerke unter `docs/REGELWERK_*.md`.
- Diese Datei setzt repoweite Grundsätze. Die verlinkten Regelwerke sind für ihre jeweiligen Fachdetails verbindlich. Bei Widerspruch gilt diese Datei; maschinelle Gates sind die technische Durchsetzung, keine Ersatz-Regelquelle.
- Freigegeben sind genau zwei schreibgeschützte Custom-Agent-Profile, beide ohne Kopie der Repo-Regeln: `.github/agents/critical-adversarial-reviewer.agent.md` prüft belegbasiert Trees und Diffs und repariert nichts; `.github/agents/berater.agent.md` liefert kurze, zynische Second Opinions zu Idee, Diff oder Gate-Ausgabe und ändert nichts. Weitere Profile oder Änderungen an diesen Ausnahmen brauchen ausdrückliche Freigabe und Doku-Touch.

## Sprache und Umgang

- Deutsch für Kommunikation, Doku, Kommentare, Dev-Fehlermeldungen und Commit-Nachrichten. Direkt, klar, ohne Marketington.
- Commit-Titel nutzen Conventional Commits (`feat:`, `fix:`, `arch:`, `docs:`, `chore:`); verbindliche Body-Regeln stehen in `docs/REGELWERK_GIT.md`.
- Absolute URLs, Credentials, private IDs, Hostnamen und maschinenbezogene Sonderwerte nur nach ausdrücklicher Vereinbarung hardcodieren. Repo-Dokumentation nutzt relative Pfade.

## Arbeitsgrundsätze

- Vor neuen Funktionen, Abstraktionen und Dateien mit `rg` nach vorhandenen Patterns suchen. Bestehende Owner-Lösungen wiederverwenden; keine parallelen Systeme.
- Eine Datei hat einen klaren Job. Domain-Grenzen und Zuständigkeiten stehen in `docs/REGELWERK_ARCHITEKTUR.md`.
- Änderungen brauchen einen passenden Doku-Touch. Pflichtdokus und Archivregeln stehen in `docs/REGELWERK_DOKUMENTATION.md`.
- Vor Abschluss passende Tests und Gates ausführen. Commit-, Hook-, Versions- und Push-Regeln stehen in `docs/REGELWERK_GIT.md`.
- Keine Commits, Pushes, Deployments oder sonstigen externen Aktionen ohne ausdrücklichen Auftrag. Fremde Änderungen bleiben unangetastet.

## Verbindliche Detailquellen

| Regelwerk | Zuständigkeit |
|-----------|---------------|
| `docs/REGELWERK_ARCHITEKTUR.md` | Domain-Owner, Abhängigkeitsgrenzen, Datenwahrheit und LOC-Caps |
| `docs/REGELWERK_DOKUMENTATION.md` | Pflichtdokus, Hygiene-Gate, Pflege, Längen und Historisierung |
| `docs/REGELWERK_GIT.md` | Shinon, Hooks, Commit-Format, Versionierung und Lifecycle |

Die maschinelle Hygiene-Prüfung liegt in `scripts/check-hygiene.mjs`, die LOC-Policy in `scripts/shinon/policy.json` und die Commit-Text-Regeln in `scripts/shinon/lib/commit-text.mjs`. Änderungen an diesen Ownern müssen ihre passenden Tests und Dokus mitziehen.
