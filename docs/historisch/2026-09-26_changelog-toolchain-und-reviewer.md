# docs/historisch/2026-09-26_changelog-toolchain-und-reviewer.md

Wortgleich aus `docs/CHANGELOG.md` verschoben am 2026-09-29, um Platz für den Eintrag zu Platzierungsmarkierung und Angreifer-Sicht zu schaffen. Beide Einträge tragen offene Punkte; sie stehen weiterhin mit Besitzer in der aktiven `docs/ROADMAP.md` unter „Offene Punkte aus dem Ist-Stand" (Toolchain-Pins, Reviewer-Profil) und gehen durch die Verschiebung nicht verloren.

## 2026-09-26 — Versions-Pins und -Grenzen der Toolchain festgehalten

Vier Dependabot-PRs sind mit begründeten Kommentaren geschlossen: zod 3.23.8 auf 4.6.5, TypeScript 5.6.3 auf 7.0.2, Vitest 2.1.8 auf 5.0.1 und Biome 1.9.4 auf 2.5.14. Alle vier meldeten `mergeable`, scheiterten aber am `Shinon Gate`, und `main` verlangt genau diesen Status-Check.

Die Gründe sind nicht ähnlich, und genau deshalb stehen sie jetzt in `docs/DEV_REQUIREMENTS.md` Abschnitt 6 statt nur in den geschlossenen Kommentaren. Der Zod-Pin ist eine Governance-Entscheidung: `scripts/shinon/policy.json` prüft die Version wörtlich, weil Client und Server dieselben Schema-Instanzen teilen, und zod v4 verweigert zusätzlich `Infinity` in `z.number()`, was der Contract als Sentinel für `unreachable` nutzt. Die TypeScript-Grenze ist strukturell: ab Version 7 fehlt die klassische Compiler-API, auf der `source-scan.mjs` und das `dead-code-gate` aufbauen — ein Bump liefert keine rote Gate-Ausgabe, sondern zwei stillschweigend wirkungslose Prüfungen. Vitest 5 scheitert reproduzierbar am Default-Timeout von fünf Sekunden, weil `engine-slicing.test.mjs` ein echtes Git-Repo anlegt und die Engine als Kindprozess startet. Biome 2 bringt neue Regeln in Bestandscode und ist damit ein Code-Slice, kein Versions-Slice.

Zwei Entscheidungen bleiben ausdrücklich offen und sind nicht als getroffen dokumentiert: ob die Grenzen als `ignore` in `.github/dependabot.yml` festgeschrieben werden, damit Dependabot nicht erneut darauf zeigt, und ob die beiden reparierbaren Bumps Vitest und Biome als eigene Slices nachgezogen werden. Eine entsprechende `ignore`-Konfiguration wurde nicht angelegt, weil diese Frage unbeantwortet blieb.

## 2026-09-26 — Freigegebene Werkzeug-Erweiterung des Reviewer-Profils

`.github/agents/critical-adversarial-reviewer.agent.md` erhält mit `edit`, `vscodeGeneral/rename`, `vscodeGeneral/usages`, `vscodeNotebooks/createJupyterNotebook` und `vscodeNotebooks/editNotebook` zusätzliche Werkzeuge. Die Erweiterung wurde vom Nutzer ausdrücklich freigegeben; `Agents.md` verlangt für Änderungen an den beiden Ausnahmeprofilen genau diese Freigabe und einen Doku-Touch, den dieser Eintrag liefert.

Der Schreibschutz dieses Profils war zuvor bewusst hergestellt worden: Commit `a1dca08` hieß „Schreibschutz des Reviewer-Profils gegen edit absichern", und `Agents.md` sowie die `description` der Datei beschreiben das Profil als rein lesend und nicht reparierend. Mit `edit` in der Werkzeugliste können Findings künftig nicht mehr nur belegt, sondern auch direkt im Tree behoben werden. Das ist eine bewusste Abweichung von der bisherigen Leseregel und keine Folge eines Refactorings.

`docs/ARCHITEKTUR.md` und `Agents.md` beschreiben beide Profile weiterhin als schreibgeschützt. Diese Beschreibung ist nach der Freigabe **nicht mehr deckungsgleich** mit der Werkzeugliste und wird bei der nächsten Konsistenzprüfung nachgezogen; sie war Teil desselben Arbeitspakets und ist in diesem Commit nicht enthalten.
