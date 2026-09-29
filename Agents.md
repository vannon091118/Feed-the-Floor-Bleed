# Agents.md — Verbindlicher Einstieg

Dieses Repository folgt verbindlichen Regeln. Diese Datei ist der Einstieg und legt Sprache, Grundsätze und Zuständigkeit der Regelquellen fest; sie soll keine Detailregelwerke duplizieren.

## Inhalt

| Abschnitt | Beantwortet |
|-----------|-------------|
| **Autorität und Profile** | Welche Datei gilt, welche Reihenfolge, welche Agent-Profile sind freigegeben |
| **Sprache und Umgang** | Deutsch, Conventional Commits, Commit-Reservierung, keine harten Codepfade |
| **Arbeitsgrundsätze** | Wiederverwendung, Doku-Touch, Tests, keine externen Aktionen, Codequalität, bekannte Fallstricke |
| **Fallstricke aus der Praxis** | Belegte Fehler, die Zeit gekostet haben; die Konsequenz daraus, nicht die Feature-Details |
| **Verbindliche Detailquellen** | Welches Regelwerk welche Fachdetails besitzt und wo deren maschinelle Durchsetzung liegt |

> **Lesereihenfolge:** Diese Datei → die drei `docs/REGELWERK_*.md` → `docs/ROPOINDEX.md` (Komponentenverzeichnis) → das betroffene `packages/*/docs/ARCHITEKTUR.md`. Bei Widerspruch gilt `Agents.md`; maschinelle Gates sind die technische Durchsetzung, keine Ersatz-Regelquelle.

## Autorität und Profile

- Alle Contributor und Agenten befolgen diese Datei sowie die jeweils einschlägigen Regelwerke unter `docs/REGELWERK_*.md`.
- Diese Datei setzt repoweite Grundsätze. Die verlinkten Regelwerke sind für ihre jeweiligen Fachdetails verbindlich. Bei Widerspruch gilt diese Datei.
- Freigegeben sind fünf schreibgeschützte Custom-Agent-Profile, alle ohne Kopie der Repo-Regeln und alle ohne `edit`-Werkzeug, damit der Schreibschutz mechanisch gilt: `.github/agents/critical-adversarial-reviewer.agent.md` prüft belegbasiert Trees und Diffs und repariert nichts; `.github/agents/berater.agent.md` liefert kurze, zynische Second Opinions zu Idee, Diff oder Gate-Ausgabe und ändert nichts; `.github/agents/lex.agent.md` sucht Löschkandidaten nach dem Vorreinigungslos und ändert nichts; `.github/agents/contexti.agent.md` sammelt messbaren Kontext ohne Bewertung und ändert nichts; `.github/agents/mia.agent.md` prüft Spieler-Perspektive, Produkt-Kohärenz, visuelle Identität und Vision-Schutz und ändert nichts. Der Skill `.github/skills/vier-perspektiven-audit/SKILL.md` verbindet die vier Profile `LEX`, `Kritischer Adversarial Reviewer`, `Contexti` und `Mia` zu einem festen, sequenziellen 4-Perspektiven-Audit (Kontext → Governance & Deletion → Beleg-Prüfung → Spieler & Vision) und löst Kollisionen nicht selbst auf. Weitere Profile oder Änderungen an diesen Ausnahmen brauchen ausdrückliche Freigabe und Doku-Touch.

## Sprache und Umgang

- Deutsch für Kommunikation, Doku, Kommentare, Dev-Fehlermeldungen und Commit-Nachrichten. Direkt, klar, ohne Marketington.
- „Commit" ist für Git reserviert. Der D1-Schreibpfad ist ein Sync-Checkpoint; die Benennung war falsch und wurde ersetzt, nicht nur erklärt.
- Commit-Titel nutzen Conventional Commits (`feat:`, `fix:`, `arch:`, `docs:`, `chore:`); verbindliche Body-Regeln stehen in `docs/REGELWERK_GIT.md`.
- Absolute URLs, Credentials, private IDs, Hostnamen und maschinenbezogene Sonderwerte nur nach ausdrücklicher Vereinbarung hardcodieren. Repo-Dokumentation nutzt relative Pfade.

## Arbeitsgrundsätze

- Vor neuen Funktionen, Abstraktionen und Dateien mit `rg` nach vorhandenen Patterns suchen. Bestehende Owner-Lösungen wiederverwenden; keine parallelen Systeme.
- Eine Datei hat einen klaren Job. Domain-Grenzen und Zuständigkeiten stehen in `docs/REGELWERK_ARCHITEKTUR.md`.
- Änderungen brauchen einen passenden Doku-Touch. Pflichtdokus und Archivregeln stehen in `docs/REGELWERK_DOKUMENTATION.md`.
- Vor Abschluss passende Tests und Gates ausführen. Commit-, Hook-, Versions- und Push-Regeln stehen in `docs/REGELWERK_GIT.md`.
- Keine Commits, Pushes, Deployments oder sonstigen externen Aktionen ohne ausdrücklichen Auftrag. Fremde Änderungen bleiben unangetastet.
- Neuer Code deletion-first: Jede hinzugefügte Zeile muss ihren Platz verdienen. Einweg-Helfer, Zweitabdeckung und vorbereitete Flexibilität werden vor der Übergabe gestrichen, nicht gemerkt.
- Eine neue Dateiendung braucht eine Regel in `.gitattributes`. Sonst checkt `Gate Windows` mit CRLF aus und der Formatter meldet dort einen Fehler, den Linux nicht zeigt.
- `main` nimmt keinen Commit ohne grünen Required Check auf **genau diesem** SHA an; ein Lauf auf einem überholten Commit wird auch mit vorhandenem Fix nicht grün. Vor jeder Reaktion auf einen roten Check dessen SHA und erzeugende App bestimmen (`check-runs[].app.slug`).
- Rote Signale nicht übergeben: bis grün nachziehen oder den Besitzer der verbleibenden Sperre namentlich nennen.
- Workspace-Pakete verlinkt erst eine deklarierte `workspace:*`-Abhängigkeit nach `node_modules/@floor`. `tsconfig`-Pfade und Vitest-Aliase können eine Auflösung vortäuschen, die beim Bündeln fehlt.
- `bump-version.mjs` zählt von `origin/main`. Ein Bump auf einem noch nicht gelandeten Nachbarbranch ist unsichtbar und vergibt dieselbe Nummer zweimal: erst den Nachbarbranch landen, dann den eigenen rechnen.
- Build-Einstellungen der Cloudflare-App liegen im Dashboard, nicht im Repository; im Repo ist daran nichts nachzustellen.
- **Ein grünes `Shinon Gate` auf einem Nicht-Entwurfs-PR landet automatisch auf `main`.** Der `promote`-Job schiebt den geprüften Kopf per Fast-Forward; es gibt kein manuelles Zusammenführen im UI, und keines wird erwartet. Ein Entwurf (`draft`) ist der einzige Weg, Arbeit stehen zu lassen. Wer auf den Merge wartet, wartet vergeblich. Vollständige Bedingungen in `docs/REGELWERK_GIT.md`.
- Vor dem Anlegen neuer Arbeit den PR-Stand prüfen (`gh pr list --state open`) und `origin/main` fetchen — ein bereits gelandeter Nachbarcommit verändert die Versionsbasis.

## Fallstricke aus der Praxis

Belegte Fälle, die einmal Zeit gekostet haben. Sie sind Grundsätze, keine Feature-Details.

- **Ein Kommentar, der etwas verspricht, das der Code nicht tut, ist ein Blocker.** Im Genome-Slice beschrieben drei Effekt-Kommentare Mechaniken, die es nicht gab. Die Doku wird nicht angepasst, um die Lücke zu verstecken: entweder bekommt der Effekt den echten Zugriff, oder der Kommentar wird gelöscht. `docs/REGELWERK_DOKUMENTATION.md` nennt das CODE IS TRUTH.
- **`[K]`-Werte tragen ihren Vermerk an der Quelle, an der sie gepflegt werden** — nicht in einer Sammel Fußnote irgendwo im Repo. Eine erfundene Zahl ohne Markierung ist ein Blocker; die Markierung gehört in dieselbe Datei, in der die Konstante steht.
- **Ein Filter ändert die Position, nicht nur die Auswahl.** Eine Sprite-Zuordnung lief über den Index im Einheiten-Array, aber die Einheiten werden nach Rolle sortiert aufgebaut — Index 0 war ein Held, nicht das erste Monster. Nur ein Test, der die Naht prüft, findet das; das Typechecken nicht. Wer einem Array einen Index aus einer anderen Menge zuweist, zählt die gefilterte Menge.
- **Eine Änderung, die ein Gate verlangt, kann sichtbar sein.** Eine extrahierte Zeichenhelfer verschob die Augenposition jedes Actors. Das ist im Changelog auszusprechen, nicht als „unverändert" zu behaupten.
- **Eine Dublette, die ein Gate meldet, wird aufgelöst und nicht umgangen** — auch wenn die Dublette im Bestand liegt. Der neue Code schreibt dann den gemeinsamen Teil.

## Verbindliche Detailquellen

| Regelwerk | Zuständigkeit |
|-----------|---------------|
| `docs/REGELWERK_ARCHITEKTUR.md` | Domain-Owner, Abhängigkeitsgrenzen, Datenwahrheit und LOC-Caps |
| `docs/REGELWERK_DOKUMENTATION.md` | Pflichtdokus, Hygiene-Gate, Pflege, Längen und Historisierung |
| `docs/REGELWERK_GIT.md` | Shinon, Hooks, Commit-Format, Versionierung und Lifecycle |

Die maschinelle Hygiene-Prüfung liegt in `scripts/check-hygiene.mjs`, die LOC-Policy in `scripts/shinon/policy.json` und die Commit-Text-Regeln in `scripts/shinon/lib/commit-text.mjs`. Änderungen an diesen Ownern müssen ihre passenden Tests und Dokus mitziehen.
