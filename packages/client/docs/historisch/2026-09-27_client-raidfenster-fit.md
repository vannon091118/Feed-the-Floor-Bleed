# packages/client/docs/historisch/2026-09-27_client-raidfenster-fit.md

Wortgleich aus `packages/client/docs/CHANGELOG.md` verschoben am 2026-09-29, um Platz für den Eintrag zur Platzierungsmarkierung und zur Angreifer-Sicht zu schaffen. Der aktive Changelog stand bei 199 Zeilen gegen den Cap von 200.

## 2026-09-27 — Das Raidfenster wächst mit seinem Inhalt

**Scope:** neu `window/fit.ts`; geändert `window/drag.ts`, `window/window.tsx`, `ui/phase-windows.tsx`, `ui/window-launcher.tsx`, `ui/styles/windows.css`, `ui/styles/raid.css` und `test/window-routing.test.ts`. Store und Panels unberührt.

**Der Befund.** Das Phasenfenster öffnete in der Raid-Phase mit 260 px, die Trail-Liste darunter ist mit über 3000 px länger als jeder Viewport. Die Steuerung klebte am Oberrand des Inhalts, doch das Fenster blieb ein schmaler Streifen: der Rest der Timeline lag dauerhaft unter der Falz und war nur über den Fenster-Scrollbalken erreichbar. Eine größere Öffnungsgröße im Launcher wäre eine zweite Schätzung gewesen — die echte Höhe kennt nur das DOM.

**Der Fit.** `drag.ts` rechnet rein: `fittedHeight` ist Kopf plus gemessene Inhaltsfläche, geklemmt auf die Mindesthöhe des Resize-Griffs und den Platz zwischen Fensteroberkante und Falz. Damit endet ein angepasstes Fenster an der Unterkante des Sichtfelds statt darunter, und ein Inhalt, der auch dann nicht passt, scrollt im Fenster, statt das Fenster aus dem Bild zu schieben. `resizedBox` bündelt die Resize-Klemmung, damit Griff und Fit dieselben Grenzen lesen.

**Die Messung.** `window/fit.ts` übersetzt DOM in Store: ein ResizeObserver am Inhaltsblock meldet dessen Höhe, `window.tsx` patcht ausschließlich die Höhe; Breite und Lage bleiben am Nutzer. Beobachtet wird der Block und nicht der Fensterrumpf — der Rumpf füllt als Flex-Kind genau die Fensterhöhe und hätte dem Fit seine eigene Wirkung zurückgemeldet, bis jedes Fenster am Anschlag stand. Dafür trägt jetzt `.game-window__content` das Padding und `.game-window__body` füllt nur noch und scrollt; die klebende Raid-Steuerung klebt deshalb bei `top: 0` statt negativ, sonst schnitte der Rumpf ihren oberen Rand ab.

Vier Details stecken in der Messung, jedes aus einem beobachteten Fehler. Der Beobachter entsteht im Ref und nicht in einem Effekt: Effekte laufen nach dem Aufbau, zu dem der Ref den Knoten liefert — beim ersten Aufbau gäbe es sonst nichts zu beobachten und nie eine erste Messung. Der Ref behält seine Identität über die Renderdurchläufe, sonst hinge sich der Beobachter bei jedem Durchlauf neu an. Gemessen wird aufgerundet und erst im nächsten Frame gepatcht: ein angebrochenes Pixel Resthöhe öffnet einen Scrollbalken, den der Fit gerade vermeiden soll, und ein Patch mitten im Zustellschritt des Beobachters meldet dem Browser eine Beobachterschleife. Der Rahmen des Fensters liegt als Ring außerhalb der Box statt als Border: ein Border zählt in die Höhe und der Zuschnitt stünde dauerhaft einen Pixel zu kurz. Ein Zug am Resize-Griff bleibt stehen, weil der Fit den Inhaltsblock misst und nicht die Fenstergröße.

**Tests.** `fittedHeight` ist rein und ohne DOM getestet: 3100 px Inhalt an einer 900-px-Fläche ergibt 900, 600 px ergeben 640 (Inhalt plus Kopf), bei einer Oberkante von 82 px endet das Fenster bei 818, 0 ergibt die Mindesthöhe. 13 Tests in `window-routing.test.ts`.

**Im Browser.** Im Produktionsbuild bei 1440 × 1000: Das Raidfenster wächst von 260 auf 918 px, seine Unterkante liegt auf der Falz bei 1000 px, und bei 3876 px Inhalt scrollt es innen, während die Steuerung am Oberrand sichtbar bleibt. Ein Canvas, Topbar und Dorfblick unverändert, keine Konsolenfehler. Der kurze Tag-Inhalt endet dagegen ohne Scrollbalken bei 265 px.

**Gates:** typecheck 0, Lint 0 (8 Baseline-Warnungen in nicht angefassten Dateien), 234 Tests in 39 Dateien grün, LOC ok (`window.tsx` 119/120, `drag.ts` 69, `fit.ts` 21), Hygiene ok, Shinon PASS.
