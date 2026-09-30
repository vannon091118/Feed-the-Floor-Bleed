]633;E;echo "# docs/CHANGELOG.md — historischer Eintrag";7bba11a0-b3d0-4563-9bf9-f00cb4ac1783]633;C# docs/CHANGELOG.md — historischer Eintrag

Wortgleich aus dem aktiven Changelog übernommen, weil der Cap von 200 Zeilen
das Neuhinzufügen verlangt hat. Der Stand ist unverändert; der Block stand
zuletzt in `docs/CHANGELOG.md`.

## 2026-09-29 — Die Dorfszene liest den Dorfbestand, und die festen Bildorte sind weg

**Der Befund.** Die Kette Dorf-Store → Platzierungsgeometrie → Renderer endete vor dem Bildschirm: `packages/client/src/render/village-scene.ts` zeichnete die fünf statischen Orte aus `packages/client/src/render/village-layout.ts` — drei davon gab es im Store überhaupt nicht —, und `packages/client/src/render/village-layout.ts` führte damit eine zweite Wahrheit über den Dorfbestand neben `packages/client/src/village/state.ts`.

**Die Naht.** `packages/client/src/render/village-layout.ts` behält die Weltmaße, die Bäume und die neue Projektion `projectVillagePlot(plot, grid)`; `VILLAGE_BUILDINGS` und `VillageBuilding` sind entfallen. Die Szene liest keinen Store, sondern bekommt die Gebäude als Funktion herein; die Ableitung steht als `villagePlots()` in `packages/client/src/ui/scene-switch.ts` und nimmt die Spalten aus dem Bestand und die Zeilen aus der Config. Die Plotseite ist die Welthöhe durch die Zeilenzahl (64 Pixel), das Feld liegt waagerecht mittig, und der Weg des Untergrunds bei y 345 fällt damit genau in die freie Zeile 5 zwischen Rathaus (3,1) und Gilde (3,6).

**Klick und Fenster.** Der Klick meldet den Listenplatz — dieselbe Kennung, die `upgradeBuilding(index)` adressiert. `packages/client/src/ui/stage.tsx` öffnet `building:<index>` und holt den Fenstertitel aus dem Bestand, `packages/client/src/ui/panels.tsx` zeigt dasselbe Gebäude über seinen Listenplatz, und `packages/client/test/window-routing.test.ts` baut dafür eine Werkstatt und liest sie unter `building:2`.

**Tests und Doku.** `packages/client/test/world-presentation.test.ts` prüft jetzt die Naht der App statt einer statischen Liste: leerer Bestand ergibt keinen gezeichneten Ort, ein über `buildBuilding` gebautes Haus steht im nächsten Takt an seiner projizierten Plot-Zelle, und der Klick meldet die Listenplätze 0, 1, 2. Nachgezogen sind `packages/client/docs/ARCHITEKTUR.md`, `FUNKTIONSGRAPH.md`, `REPOINDEX.md`, `packages/client/docs/CHANGELOG.md` und `docs/ROADMAP.md`; weil beide aktiven Changelogs mit dem Eintrag über den 200-Zeilen-Cap liefen, ist ihr ältester Eintrag wortgleich nach `packages/client/docs/historisch/2026-09-27_client-tote-symbole.md` und `docs/historisch/2026-09-26_changelog-deploy-pfad.md` gewandert. **Gates:** typecheck 0, 365 Tests in 54 Dateien, Lint 0, LOC-Caps ok (247 Quellen), Hygiene ok, Shinon PASS, Client-Build und Worker-Dry-Run ok.

Die Einträge vom 2026-09-29 zum einmaligen Typecheck und zur Roadmap-Übergabe, zur Platzierungsmarkierung und zur geteilten Dorfszene sowie vom 2026-09-28 zum Verteidiger-Roster stehen wortgleich in `docs/historisch/2026-09-29_changelog-typecheck-owner.md`, `docs/historisch/2026-09-29_changelog-platzierungsmarkierung.md`, `docs/historisch/2026-09-29_changelog-dorfszene-geteilt.md` und `docs/historisch/2026-09-28_changelog-roster-und-boss.md`; sie sind unverändert erhalten.
