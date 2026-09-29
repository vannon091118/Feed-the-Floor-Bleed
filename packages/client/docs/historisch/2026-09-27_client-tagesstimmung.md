# packages/client/docs/historisch/2026-09-27_client-tagesstimmung.md — Die Tagesstimmung hängt wieder an der Shell

Wortgleich aus `packages/client/docs/CHANGELOG.md` verschoben am 2026-09-29, weil der aktive Changelog den 200-Zeilen-Cap erreicht hatte. Append-only.

## 2026-09-27 — Die Tagesstimmung hängt wieder an der Shell

**Der Befund.** Der Phasenwechsel war am Bildschirm unsichtbar: `PhaseBadge` wechselte den Text von „Tag" auf „Nacht", Raid und Ergebnis, aber die Oberfläche blieb gleich. Die Regeln `.app.is-day` und `.app.is-night` aus `main` sind mit dem alten `styles.css` verschwunden. Sie lagen also nicht mehr „ungenutzt bereit", wie `docs/ROADMAP.md` es führte — sie existierten nicht mehr. Damit war der offene Punkt aus dem UI-Rebase keine Frage des Anschließens, sondern des Neuschreibens.

**Die Entscheidung.** Der Auftraggeber hat den Weg über die Shell gewählt: `<main class="app">` trägt `data-phase` direkt aus dem Store. Die Shell bleibt layout-nah — sie liest den Phase-Store für diese eine Darstellung, enthält aber weiterhin keine Phase-Aktion und keinen Dorfzustand, und `village/state.ts` bleibt der einzige Owner. Vier Gradients in `ui/styles/shell.css` tönen Tag (warm von oben), Nacht (kühl von unten), Raid (rot getönt) und Ergebnis (Dämmerung). Der Überzug liegt bei z-index 4 über Welt und Kontextfenstern, unter der Topbar, und ist klickdurchlässig; `base.css` kürzt die 900-ms-Transition bei `prefers-reduced-motion` auf 0,01 ms.

**Der Test.** `test/daylight.test.ts` bindet das Stylesheet an die Phasen-Union: für jede Phase aus `PHASE_ORDER` muss eine `[data-phase="…"]`-Regel existieren. Genau diese Kopplung fehlte, als die Regeln still verschwanden; der Test pinnt sie ohne DOM. Gelesen wird das Stylesheet über `?raw`, weil die Testverzeichnisse im `tsc`-Programm liegen und dieses keine Node-Typdefinitionen kennt.

**Im Browser.** Die Schleife im Produktionsbuild durchgeklickt: `data-phase` steht auf `tag`, danach auf `night` und `raid`, und das berechnete `::after`-Background wechselt von `radial-gradient(120% 80% at 50% 0px, rgba(224, 173, 85, 0.16), …)` über `rgba(96, 126, 196, 0.22)` auf `rgba(216, 119, 106, 0.2)`. Die Transition läuft als `background 0.9s`, der Überzug bleibt `pointer-events: none` bei `z-index: 4`. Der Dorfblick wird sichtbar dunkler und kühl getönt, sobald die Nacht beginnt. Durchgehend ein `<canvas>`, keine Konsolenfehler, genau eine Netzwerkanfrage — das HTML selbst.

**Gates:** typecheck 0, Lint 0, Tests grün, LOC-Caps ok, Hygiene ok, Shinon PASS.
