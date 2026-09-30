]633;E;echo "# docs/CHANGELOG.md — historischer Eintrag";7bba11a0-b3d0-4563-9bf9-f00cb4ac1783]633;C# docs/CHANGELOG.md — historischer Eintrag

Wortgleich aus dem aktiven Changelog übernommen, weil der Cap von 200 Zeilen
das Neuhinzufügen verlangt hat. Der Stand ist unverändert.

## 2026-09-29 — `Agents.md` sagt nicht mehr das Gegenteil vom Merge-Ablauf

**Eine Doku-Korrektur an der Einstiegsdatei, ohne Code.** `Agents.md` trug den Satz „Der Nutzer merged parallel im GitHub-UI". Das ist falsch und war für einen Agenten schädlich: `docs/REGELWERK_GIT.md` und der Workflow-Kommentar in `.github/workflows/shinon.yml` sagen ausdrücklich das Gegenteil — `promote` schiebt den geprüften Kopf per Fast-Forward nach `main`, sobald das Gate grün ist, und wer nicht zusammenführen will, lässt den PR als Entwurf stehen. Am 2026-09-29 bestätigt: PR #62 wurde nach grünem Gate allein durch den `promote`-Job gemergt, ohne jede Hand im UI. Die Zeile ist durch die tatsächliche Regel ersetzt, inklusive der Warnung, dass wer auf einen Merge wartet, vergeblich wartet.

**Zwei Doppelpunkte aus dem Weg.** Die Aussage zu Required Check und `PROMOTE_TOKEN` stand als zwei Zeilen und wiederholte, was das Git-Regelwerk ohnehin vollständig führt; sie ist auf die eine Regel zusammengezogen, die dort nicht steht — der Check muss auf **genau diesem** SHA grün sein, ein Lauf auf einem überholten Commit wird auch mit vorhandenem Fix nicht grün.

**Neue Sektion „Fallstricke aus der Praxis"** mit vier belegten Fällen aus dem Genome-Slice: ein Kommentar, der etwas verspricht, das der Code nicht tut, ist ein Blocker und wird nicht durch Anpassen der Doku versteckt; ein `[K]`-Wert trägt seinen Vermerk an der Quelle, an der er gepflegt wird; ein Filter ändert die Position, nicht nur die Auswahl, weil die gefilterte Menge eine andere Indexbasis hat; und eine Änderung, die ein Gate verlangt, kann sichtbar sein und gehört ins Changelog statt unter „unverändert". Dazu ein Inhaltsverzeichnis und eine Lesereihenfolge, damit ein Agent die Datei in einem Durchgang erschließen kann.

**Ein veralteter offener Punkt geschlossen.** `docs/ROADMAP.md` führte seit längerem, `Agents.md` und `docs/ARCHITEKTUR.md` beschrieben den Kritischen Reviewer noch als schreibgeschützt, während die Werkzeugliste `edit` enthielte. Geprüft: `edit` steht in **keiner** der beiden Listen; beide Profile sagen im Fließtext ausdrücklich, das Werkzeug fehle absichtlich, damit der Schreibschutz mechanisch gilt. `docs/ARCHITEKTUR.md` war die ganze Zeit richtig — veraltet war nur der Roadmap-Eintrag, der jetzt den Befund samt Beleg nennt.

**Gates:** keine Quelldatei berührt, typecheck 0, Lint 0 über 305 Dateien, LOC-Caps ok, Hygiene ok, Shinon PASS.

