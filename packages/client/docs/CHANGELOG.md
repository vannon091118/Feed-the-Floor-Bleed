# packages/client/docs/CHANGELOG.md

## 2026-09-26 — T2.1: Dorfwirtschaft mit Gebäuden, Arbeitern und Beuteverkauf

**Scope:** `packages/client/src/village/` von vier auf neun Dateien erweitert, `packages/client/src/ui/` um Baukarten, Ortskarten und eine Aktionsrückmeldung ergänzt, `src/raid/` auf die aktuelle Klassensprache umgestellt, `test/village-economy.test.ts` neu. **Roadmap-Abweichung:** Dieser Block ist T2-Arbeit, obwohl T1.1 noch in einem eigenen Branch läuft. `docs/ROADMAP.md` trägt die Abweichung ausdrücklich ein.

**Regelort:** Die Wirtschaft liegt in `village/`, weil die Ownership-Tabelle `village` Gebäude, Attraktivität und Arbeiter zuschreibt. Core und Contract bleiben unberührt. `buildings.ts` hält die vier Arten mit Kosten, Stufengrenze, Tagesertrag und Arbeitsplätzen, `economy.ts` die reinen Regeln für Kostenstufen, Kapazitäten, Tagesertrag, Löhne, Attraktivität und Zuzug, `treasury.ts` den einzigen Zustand.

**Was eine Entscheidung trägt:** Bauen kostet Gold und Material und braucht für einen Erstbau einen von drei Bauplätzen; das Rathaus steht ab Start auf Stufe 1, dadurch bindet die Platzgrenze wirklich. Die Werkstatt bringt je Stufe 2 Gold und 3 Material, das Gehege öffnet einen Verteidigerplatz, das Wohnhaus zwei Unterkünfte, das Rathaus 6 Attraktivität. Jeder zugewiesene Arbeiter kostet ein Gold pro Tag, ein freier Arbeiter nichts. Der Zuzug kommt ab Attraktivität 50 in Zehnerschritten und ist durch die freie Unterkunft gedeckelt. Die Verteidigerplätze des Dorfes hängen am Gehege-Ausbau, nicht mehr an einer Konstanten.

**Tagesabschluss:** `finishResult` rechnet nur beim Übergang `result → tag` ab — Ertrag minus Löhne, dazu der Zuzug. Ein Retry rechnet nichts ab, weil kein Tag beginnt. Bauen und Einteilen sind Amtshandlungen des Tages und werden in jeder anderen Phase abgelehnt, damit die Nacht kein stiller Umbau wird.

**Beute ohne Contract-Umbruch:** `loot.ts` leitet die Ware aus dem Ergebnis ab, das der Core ohnehin liefert: 15 Gold und 2 Material je gefallenem Verteidiger, 30 Gold extra für den gefallenen Boss, gezählt aus dem besetzten Roster minus `monstersAlive`. Damit bleiben `sim_version 0.0.2`, `CONTRACT_VERSION 3`, Wire-Schema und Replay-Hash unverändert. Ein gescheiterter Auftrag hinterlässt nichts. `completeRaid` legt die Ware zum Verkauf bereit und ersetzt sie bei einem Retry, `sellLoot` bucht sie einmalig im Ergebnis.

**Dorf als Ort:** `building-card` zeigt Zweck, Stufe, Tagesertrag, Kosten und Fehlbetrag mit Bau- und Arbeiterknöpfen, `village-places` die Ortskarten inklusive Lager mit Verkauf, `village-feedback` führt jede Dorfaktion über `runVillageAction`, damit keine Amtshandlung ohne sichtbare Antwort bleibt. Die Topbar liest Gold und Material live aus dem Wirtschafts-Owner statt aus den Startdaten.

**Zwei Befunde aus der Browser-Abnahme:** Das Probelauf-Panel und die Ergebnisansicht benutzten `primary-button`, `panel-heading` und `raid-stats` — Klassen, die der Style-Umbau entfernt hatte. Der Auftrag-Knopf war dadurch ungestylt und die Ergebniszahlen ohne Rahmen. Beides ist auf die aktuelle Klassensprache umgestellt. Außerdem verletzten `district__note` mit 3,03:1 und `eyebrow` mit 3,27:1 die WCAG-AA-Untergrenze; `--faint` und `--muted` sind angehoben, die kleinste gemessene Textkante liegt jetzt bei 4,71:1.

**Verifikation:** `pnpm run -s typecheck`, `pnpm test -- --run` (29 Dateien, 166 Tests) und `pnpm run -s check` sind grün. Zusätzlich im Browser abgenommen: Tag 18 mit 120 Gold und 7 Material, Werkstatt gebaut (65/4), Arbeiter gesetzt (1/1), Dungeonsicht mit laufendem Pixi-Canvas, Nacht mit sichtbarem Editor, Auftrag gerechnet, „Boss hält“, 15 Gold und 2 Material verkauft (80/6), Tagesabschluss auf 84/10 und Tag 19. Kein Layoutüberlauf bei 1440 px und 700 px, keine Konsolenfehler.

## 2026-09-26 — Oberfläche modularisiert, Dorfblick und Blickumschalter ergänzt

**Scope:** `packages/client/src/ui/` vollständig umgebaut, `src/village/settlement.ts` neu, `src/raid/panel.tsx` um `raidOutcomeText` erweitert, `test/village-settlement.test.ts` und `test/stage-view.test.ts` neu.

**Befund:** Das „Dashboard" war eine offene Label-Wert-Liste mit vier Fixture-Konstanten, der Viewport zeigte in jeder Phase das Dungeon-Raster, und der Drag-Status zeigte rohe Kennungen mit Zellkoordinaten in der Sidebar. `styles.css` war eine 630-zeilige Datei mit drei erfundenen Panel-Optiken und totem `is-night`-Theming, das die Shell nie setzte. `shell.tsx` stand bei 96 von erlaubten 120 LOC, hatte also keinen Raum für Feature-Arbeit.

**Der Dorfblick:** `village/settlement.ts` leitet aus dem Phase-Owner und den Fixture-Daten Gebiete (Rathaus, Gilde, Verteidiger-Gehege), das Gildenroster und die Bilanz der letzten Nacht ab. Es ist eine reine Funktion ohne eigenen Dorfzustand und ohne Wirtschaftsregel: Arbeiterverteilung, Gold-Ausgaben, Landkauf und Beute-Verkauf bleiben T2. Die Startbasis aus `fixture.workers` und `fixture.attractiveness` ist in der Oberfläche ausdrücklich als Startbasis gekennzeichnet, damit nichts als veränderlich ausgegeben wird, was es nicht ist. Die Karte für das Gehege zeigt eine echte Belegung; Lebensbalken gibt es nur dort, wo etwas zählbar belegt ist, keine Hochrechnung ohne Maximum.

**Blick statt Phasenlogik:** `ui/view.ts` hält `stageView` (`village | dungeon`) als Navigation, nicht als Spielzustand. Die Topbar schaltet um, ohne Phase oder Grid zu berühren — `test/stage-view.test.ts` pinnt genau das. Der Dungeon-Host wird beim Wechsel neu aufgebaut, weil Preact ihn genau einmal mountet; der Fensterlayer liegt außerhalb der Auswahl, damit offene Fenster den Blickwechsel überleben. Das Editorwerkzeug erscheint nur im Dungeon-Blick, seine Bau-Erlaubnis kommt weiter aus der Phase.

**Modularisierung:** Die Shell ist reines Layout und kennt keine Phase. `topbar`, `stage`, `sidebar`, `view-switch`, `window-tools`, `window-content`, `village-view`, `roster-list`, `stats` und `actor-label` haben je einen Job. `roster-list` und `stats` sind geteilte Darstellungskomponenten statt Kopiervorgänge — der Redundancy-Gate hatte eine zweite Heldenstruktur zu Recht angemahnt, der Typ kommt jetzt einmal aus `fixture-data`. `styles.css` ist durch `styles/` mit acht Modulen ersetzt, eingebunden über `styles/index.css`; alle Panels, Fenster und das Editorraster benutzen dieselben Flächen-, Kanten- und Tiefen-Tokens.

**Ausgabe-Korrektheit:** Interne Kennungen erscheinen nicht mehr im Bildschirm — Fenster tragen `Mara` statt `hero-mara`, der Werkzeugstatus meldet `Frost 2 → Feld 3,4`. Die Sidebar zeigt je Phase nur Auftrag und Hauptaktion; der Standort selbst steht im Dorfblick, damit er nicht als Wertetabelle nebenbei existiert. Ergebnis- und Fehlertext kommen über `raidOutcomeText` aus einer Quelle, damit Panel und Dorfblick nicht getrennt formulieren.

**Verifikation:** `pnpm run -s typecheck`, `pnpm test -- --run` (28 Dateien, 148 Tests) und `pnpm run -s check` sind grün, der Vite-Build löst die Style-Kette vollständig auf. Die Browser-Abnahme stand zu diesem Zeitpunkt aus und ist im darunterliegenden Dorfwirtschafts-Block nachgeholt worden; dabei fielen zwei regressionsbedingte Fehlstellungen auf, die hier noch enthalten waren.

## 2026-09-26 — Render-Animation ohne Sinus vereinheitlicht

`render/animation.ts` nutzt jetzt eine glatte deterministische Periodik für Bob, Schritt, Squash und Schwanken; `render/actors.ts` verwendet denselben Kurven-Owner für die Schritthöhe. Ein Regressionstest prüft Wiederholbarkeit, Periodengrenzen, Wertebereiche und bisherige Amplituden.

## 2026-09-26 — Route-Mapping und Actor-Varianten vereinheitlicht

`visual/route-index.ts` ist die einzige boundsafe Abbildung von Combat-/FX-Indizes auf den bestehenden `route.path`; Actor-Frame, Event-FX und Leerlaufbesetzung verwenden dieselbe Funktion. `visual/variant.ts` liefert für beide Actor-Pfade dieselbe deterministische, ID-basierte Variante. Damit ist die zuvor abweichende positionsbasierte Editor-Variante beseitigt. Tests decken Grenzindizes, leeren Pfad und Variantenkonsistenz ab.

## 2026-09-26 — Showcase-Optik auf Materialrelief, Route und Charaktere gehoben

Der Foundation-Stand rendert jetzt aus deterministischen Materialtexturen differenzierte Bodenkacheln und Wände mit Deckplatte, sichtbarer Frontfläche, Kantenlicht und Schatten, statt die Wandtextur nur in die Höhe zu strecken. `render/route.ts` zeigt `route.path` als warme, leuchtende Marker und hebt die aktuelle Position eines Helden hervor; es speichert keine eigene Grid- oder Route-Wahrheit und legt Marker in dieselbe depth-sortierte Welt-Ebene. Die prozeduralen Actor-Silhouetten unterscheiden Held, Monster und Boss über Farben und Formen, und die Blickrichtung folgt `facing`. Die globale UI-Haut in `src/ui/styles.css` hat eine passende Dungeon-Palette, gerahmten Viewport, lesbare Panels, sichtbare Fokuszustände und ein mobiles Layout bekommen.

Der Atlas wurde entlang seiner Zuständigkeiten geteilt: `render/canvas.ts` besitzt Canvas/Textur-Helfer, `render/tile-atlas.ts` Boden-/Mauertexturen, `render/route-atlas.ts` Route-Lichter, `render/actor-atlas.ts` Silhouetten und `render/atmosphere-atlas.ts` Glow/Vignette. `visual/fx-seed.ts` erzeugt aus allen relevanten Combat-Event-Feldern einen stabilen Präsentationsseed; `render/fx.ts` leitet die Partikelvariation je Effekt/Partikel daraus ab, statt von einem fortlaufenden Emissions-RNG abhängig zu sein. `test/visual-foundation.test.ts` pinnt die stabile Seed-Ableitung und bestehende Route-/Observer-Grenzen.

Der Render-/Visual-Code bleibt innerhalb der Ownership-Caps: Actor-Frame, Event-FX und Leerlauf-Route-Akteure liegen in eigenen kleinen Modulen statt einer großen Sammeldatei.

## 2026-09-26 — Modularer Schnitt für Atlas und Combat-Visuals

`render/atlas.ts` bleibt als Barrel; Actor-Silhouetten, Atmosphärentexturen, Boden-/Wandtexturen und Routenleuchten liegen separat in `actor-atlas.ts`, `atmosphere-atlas.ts`, `tile-atlas.ts` und `route-atlas.ts`. Im Pixi-freien `visual`-Owner sind `combatActors`, `eventFx`, `fxSeed` und die Leerlaufroute in eigenständige Dateien getrennt. Das hält die strengen Dateien-Caps ein und isoliert jeweilige Darstellungsjobs, ohne neue Raum- oder Grid-Owner einzuführen.

## 2026-09-26 — T1.2: Tag/Nacht/Raid-Schleife als geschlossener Fixture-Loop

- `src/village/` neu: `phase.ts` hält die Phase-Union in Schleifenreihenfolge, die erlaubten Übergänge und die reine Entscheidungsfunktion `resolvePhaseTransition`; `state.ts` besitzt das DayNightState-Signal (`phase`, `day`, `job`) mit `setPhase` als einzigem Schreibpfad und Job-Aufnahme nur aus der Raid-Phase; `phase-actions.ts` liefert `startNight`, `triggerRaid`, `completeRaid`, `finishResult` und `retryAfterResult`. Der Store ist Preact-Signals, keine externe Lib. `result → tag` zählt den Tag hoch und löscht den Auftrag, `result → raid` ist der deterministische Retry.
- `src/raid/raid-panel.tsx` ist auf Props umgestellt (`onJob`), die Ergebnis-Darstellung liegt als reine Sicht `RaidResultView` in `src/raid/panel.tsx`. Damit führt die Schleife das terminale TerminalRaidJob in die Result-Phase, statt dass das Panel einen eigenen Laufzustand neben dem Store hält.
- `src/ui/phase-badge.tsx` und `src/ui/phase-panels.tsx` neu, `src/ui/shell.tsx` liest die Phase aus dem Store statt aus `useState`: Tag zeigt Dorf-Basisdaten aus den Fixture-Ressourcen und „Nacht starten“, Nacht hält Editor und Controls aktiv und schaltet über „Raid auslösen“, Raid reicht das Core-Ergebnis über `completeRaid` in die Result-Phase, Result zeigt Auftrag und Urteil mit „Nächsten Tag beginnen“ oder „Erneut versuchen“. Der Editor bleibt in Nacht und Raid sichtbar, damit eine blockierte Route vor dem Retry reparierbar bleibt. `src/ui/styles.css` um Badge und Phase-Panel ergänzt.
- `test/village-phase.test.ts` neu: Reihenfolge, Skip-Verbot, Tag-Zähler, Retry-Nachfolge und Job-Aufnahme nur aus der Raid-Phase. `test/day-night-loop.test.ts` neu: voller Loop mit Fake-Timern (nur `setTimeout`/`clearTimeout`, die Uhr bleibt messbar), Sieg- und Fehlschlagpfad, dreifacher Wiederholungsloop mit identischem Hash und Zeitbudget unter 5 s; `afterEach` verlangt einen leeren Timer-Zähler. Im Browser wurde der Loop End-to-End durchgeklickt: Tag 18 → Nacht → Raid → Ergebnis `fixture-raid-1` → Tag 19.

## 2026-09-26 — Client-Stringmatrix auf Trail-v3 nachgezogen

- `docs/STRINGMATRIX.md`: Der Eintrag `raid/trail` behauptete weiterhin, der Combat-Log trage keinen Trail-Hash und die Anzeige nutze `route.path`. Das widersprach dem T1.1-Stand, den `test/raid-job.test.ts` bereits festschreibt. Seit T1.1 trägt `CombatLog.trail` je Schritt `x/y/cell` und `fingerprintCombatLog` hasht den vollständigen Trail; der Eintrag beschreibt jetzt genau das statt der überholten Lücke.

## 2026-09-26 — Review-Nachgang: stiller Testdurchlauf entschärft

- `test/raid-job.test.ts`: vier Tests sprangen bei einem nicht abgeschlossenen Auftrag mit `return` heraus und waren dann grün, ohne die Hash-Aussage überhaupt zu treffen. Vor jeder Weiche steht jetzt ein explizites `expect(status).toBe('completed')` beziehungsweise `('failed')`; der Guard bleibt nur noch für die Typverengung. Der Trailtest, der genau die T1.1-Absicherung zeigt, kann damit nicht mehr stillschweigend durchlaufen.

## 2026-09-25 — Drei Review-Findings behoben: Kamera, Drag-Slop, Raid-Panel

- `src/render/runtime.ts` rechnete die World-to-Screen-Matrix ein zweites Mal. `applyCamera` holt den Container-Ursprung jetzt über `worldToScreen` aus `camera.ts`; die Regel „genau eine Transformation" ist damit im Code und nicht nur in der Doku gültig.
- `src/input/drag.ts` aktivierte den Drag bei jedem Pointer-Down. Dadurch war jeder Klick auf einen Actor gleichzeitig ein Drop, und der Klickpfad zum Kontextfenster lief nie. Ein Down registriert jetzt nur noch einen Kandidaten; erst eine Bewegung über den Slop macht daraus einen aktiven Zug.
- `src/input/drag-target.ts` neu: `resolveTarget`, `passedSlop`, `advance` und `dropCommand` kapseln Trefferauflösung und Zwischenzustand eines Drags.
- `src/showcase/controls.ts` entscheidet die Geste erst nach dem Slop: auf einem Actor ein Drag, sonst ein Pan, ohne Weg ein Klick.
- `src/ui/shell.tsx` rendert `src/raid/raid-panel.tsx` wieder. Der lokale Fixture-Raid ist damit im Browser auslösbar.
- `src/ui/styles.css` ergänzt die Klassen des Raid-Panels aus den vorhandenen Tokens.
- `test/input-drag.test.ts` belegt, dass ein Down ohne Weg keinen Drop erzeugt, ein Zug erst nach dem Slop aktiv wird und außerhalb des Greifradius kein Kandidat entsteht.

## 2026-09-25 — Visuelle Foundation: Pixi-Szene, World, Observer, Window-Runtime

- `packages/client/package.json` und `pnpm-lock.yaml`: `pixi.js@^8` als Client-Abhängigkeit.
- `src/world/*` neu: gemeinsame Geometrie, Materialien, Tiles und Deskriptoren auf Basis der Sim-Core-Konstanten.
- `src/render/*` neu: einzige Kamera-Transformation, Pixi-Runtime, persistente Terrain-/Actor-/FX-/Lighting-Views, deterministische Texturen und Materialfilter. FX läuft über einen festen Pool.
- `src/visual/*` neu: Observer, Terrain-Diff und Combat-Frame ohne Pixi-Import.
- `src/input/*` neu: gemeinsamer Pointer-Pfad, Hit-Test und Drag-Command.
- `src/window/*` neu: Preact-Fenster-Registry mit Fokus, Z-Order, Drag und Resize.
- `src/showcase/*` neu: Referenzszene aus echtem Grid, Route und Core-Log.
- `src/ui/*` neu: Shell, stabiler Pixi-Host, DOM-Editor und Fenster über der Szene.
- `test/visual-foundation.test.ts` prüft Weltdefinitionen, Kamera, Depth, Terrain-Diff und Route-Abbildung.
- `docs/ARCHITEKTUR.md`, `FUNKTIONSGRAPH.md`, `REPOINDEX.md` und `STRINGMATRIX.md` dokumentieren die Schichten.

## 2026-09-25 — Visuelle Schicht entfernt

- Sieben UI-Dateien wurden zunächst entfernt, weil der damalige Entwurf keine geladene Schrift, unzureichenden Kontrast, uneinheitliche Schriftgrößen und tote Fläche aufwies. Die Visual-Foundation wurde danach modular neu aufgebaut.
- `model.ts` und `state.ts` blieben als Editorlogik bestehen. `tileMarker` korrigierte die Abbildung von Boss- und Spawn-Markern auf sichtbare Tiles.
- Tests für Editor-, Raid- und Visual-Logik blieben erhalten; Markup selbst war damals nicht abgedeckt.

## 2026-09-25 — T1.3 lokaler Fixture-Raid

- `src/raid/fixture-raid.ts` baut den Contract-Upload und führt den lokalen Auftrag ohne Netz aus.
- `src/raid/raid-panel.tsx` zeigt Ergebnis, Hash, Ticks, Ereignisse und Fehlerzustände.
- `src/fixture-data.ts` hält feste Fixture-Daten für reproduzierbare Tests.
- `test/raid-job.test.ts` prüft Upload, Hash, Blockade und Auftragszustände.

## 2026-09-25 — Init

- Domäne angelegt: `dungeon-editor`, `village`, `inventory`, `raid`, `net`, `storage`, `ui`.
- PWA-Ziel: Vite + PixiJS 8 + Preact + Signals + Dexie + fflate.
