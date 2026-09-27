# packages/client/docs/historisch/2026-09-26_client-oberflaeche-modularisiert.md — Oberfläche modularisiert

Abgelegt aus `packages/client/docs/CHANGELOG.md` am 2026-09-27, weil der aktive Changelog an die 200-Zeilen-Cap kam. Inhaltlich unverändert.

## 2026-09-26 — Oberfläche modularisiert, Dorfblick und Blickumschalter ergänzt

**Scope:** `packages/client/src/ui/` vollständig umgebaut, `src/village/settlement.ts` neu, `src/raid/panel.tsx` um `raidOutcomeText` erweitert, `test/village-settlement.test.ts` und `test/stage-view.test.ts` neu.

**Befund:** Das „Dashboard" war eine offene Label-Wert-Liste mit vier Fixture-Konstanten, der Viewport zeigte in jeder Phase das Dungeon-Raster, und der Drag-Status zeigte rohe Kennungen mit Zellkoordinaten in der Sidebar. `styles.css` war eine 630-zeilige Datei mit drei erfundenen Panel-Optiken und totem `is-night`-Theming, das die Shell nie setzte. `shell.tsx` stand bei 96 von erlaubten 120 LOC, hatte also keinen Raum für Feature-Arbeit.

**Der Dorfblick:** `village/settlement.ts` leitet aus dem Phase-Owner und den Fixture-Daten Gebiete (Rathaus, Gilde, Verteidiger-Gehege), das Gildenroster und die Bilanz der letzten Nacht ab. Es ist eine reine Funktion ohne eigenen Dorfzustand und ohne Wirtschaftsregel: Arbeiterverteilung, Gold-Ausgaben, Landkauf und Beute-Verkauf bleiben T2. Die Startbasis aus `fixture.workers` und `fixture.attractiveness` ist in der Oberfläche ausdrücklich als Startbasis gekennzeichnet, damit nichts als veränderlich ausgegeben wird, was es nicht ist. Die Karte für das Gehege zeigt eine echte Belegung; Lebensbalken gibt es nur dort, wo etwas zählbar belegt ist, keine Hochrechnung ohne Maximum.

**Blick statt Phasenlogik:** `ui/view.ts` hält `stageView` (`village | dungeon`) als Navigation, nicht als Spielzustand. Die Topbar schaltet um, ohne Phase oder Grid zu berühren — `test/stage-view.test.ts` pinnt genau das. Der Dungeon-Host wird beim Wechsel neu aufgebaut, weil Preact ihn genau einmal mountet; der Fensterlayer liegt außerhalb der Auswahl, damit offene Fenster den Blickwechsel überleben. Das Editorwerkzeug erscheint nur im Dungeon-Blick, seine Bau-Erlaubnis kommt weiter aus der Phase.

**Modularisierung:** Die Shell ist reines Layout und kennt keine Phase. `topbar`, `stage`, `sidebar`, `view-switch`, `window-tools`, `window-content`, `village-view`, `roster-list`, `stats` und `actor-label` haben je einen Job. `roster-list` und `stats` sind geteilte Darstellungskomponenten statt Kopiervorgänge — der Redundancy-Gate hatte eine zweite Heldenstruktur zu Recht angemahnt, der Typ kommt jetzt einmal aus `fixture-data`. `styles.css` ist durch `styles/` mit acht Modulen ersetzt, eingebunden über `styles/index.css`; alle Panels, Fenster und das Editorraster benutzen dieselben Flächen-, Kanten- und Tiefen-Tokens.

**Ausgabe-Korrektheit:** Interne Kennungen erscheinen nicht mehr im Bildschirm — Fenster tragen `Mara` statt `hero-mara`, der Werkzeugstatus meldet `Frost 2 → Feld 3,4`. Die Sidebar zeigt je Phase nur Auftrag und Hauptaktion; der Standort selbst steht im Dorfblick, damit er nicht als Wertetabelle nebenbei existiert. Ergebnis- und Fehlertext kommen über `raidOutcomeText` aus einer Quelle, damit Panel und Dorfblick nicht getrennt formulieren.

**Verifikation:** `pnpm run -s typecheck`, `pnpm test -- --run` (28 Dateien, 148 Tests) und `pnpm run -s check` sind grün, der Vite-Build löst die Style-Kette vollständig auf. **Offen:** Die Abnahme im Browser steht aus — in dieser Umgebung gibt es weder Chrome noch ein DOM-Testsetup, die neue Oberfläche ist also nicht am Bildschirm gesehen worden. Grüne Gates belegen Korrektheit, nicht das Aussehen.
