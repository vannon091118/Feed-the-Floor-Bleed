# Regelwerk: Dokumentation und Hygiene

Verbindlich für Root und alle Domänen. `Agents.md` ist der Einstieg; dieses Dokument definiert Inhalt und Pflege der Dokus.

## Pflichtdokus pro Domäne

`scripts/check-hygiene.mjs` erzwingt in `docs/`, `packages/{contracts,sim-core,client,server}/docs/` und `scripts/shinon/docs/` jeweils:

| Datei | Inhalt |
|-------|--------|
| `CHANGELOG.md` | Datum, konkreter Scope und Auswirkung der Änderung |
| `ARCHITEKTUR.md` | Module, Owner-Grenzen und Datenfluss |
| `STRINGMATRIX.md` | Feste IDs, Protokoll-Keys, Traits und Fehlercodes |
| `FUNKTIONSGRAPH.md` | Logische Aufruf- und Abhängigkeitsbeziehungen, kein Code-Dump |
| `REPOINDEX.md` | Komponentenverzeichnis, eine Zeile pro Datei mit ihrem Job |

Jede Domäne benötigt außerdem ein `historisch/`-Verzeichnis. Das Root-README ist Vorstellung, keine technische Referenz.

## Pflege-Regeln

- Keine Code-, Contract-, Architektur- oder Governance-Änderung ohne Aktualisierung der betroffenen Pflichtdokus.
- Änderungen an einer Domain werden mindestens im zugehörigen Changelog beschrieben. Neue oder entfernte Dateien werden im Repoindex erfasst. Owner- oder Datenflussänderungen aktualisieren Architektur und Funktionsgraph; neue feste IDs oder Protokollwerte aktualisieren die Stringmatrix.
- Aussagen müssen den tatsächlich implementierten Zustand beschreiben. Geplante Funktionen als geplant markieren, nicht als Bestand.
- Historische Einträge sind append-only. Nichts aus `historisch/` löschen oder kürzen.
- Aktive Dokumente dürfen höchstens 200 Zeilen haben. Bei Wachstum den ältesten noch relevanten Abschnitt in `historisch/YYYY-MM-DD_<thema>.md` verschieben und einen knappen Verweis stehen lassen.
- Globale Doku verwendet relative Repository-Pfade. Keine geheimen Werte, privaten IDs oder unnötigen Maschinenpfade.

## Prüfung

`pnpm run -s check:hygiene` prüft Existenz und Längen der Pflichtdokus. Das Gate prüft keine inhaltliche Wahrheit; Änderungen müssen zusätzlich fachlich gegen Code, Contracts und Tests gelesen werden. Nach einem Doku-Touch mindestens Hygiene-Gate ausführen; vor Abschluss gelten die vollen Checks aus `docs/REGELWERK_GIT.md`.
