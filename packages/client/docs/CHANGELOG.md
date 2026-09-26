# packages/client/docs/CHANGELOG.md

## 2026-09-26 — Raid-Timeline verdrahtet

Die Timeline war gebaut, aber nicht angeschlossen: `ui/shell.tsx` hat sie nie gerendert, `showcase/scene.ts` hat einen eigenen `playback`-Zähler geführt, und für die elf Klassen der Timeline gab es kein CSS. Die Shell rendert jetzt `<RaidTimeline />` in der Raid-Phase neben dem Probelauf-Panel; `styles.css` trägt die elf Klassen `raid-timeline`, `timeline-phase-nav`, `timeline-phase-step`, `timeline-scrubber`, `timeline-scrub-step`, `timeline-scrub-readout`, `timeline-phase`, `timeline-trail`, `timeline-clusters`, `timeline-cluster-type`, `timeline-facts` und `timeline-hint` in den bestehenden Farbtokens.

Der zweite Teil war wichtiger als der erste. Die Szene hat den Tick lokal über `playback += deltaMs / (1000 / tickRate)` fortgeschrieben und dabei `stepPlayback` sowie `playbackPaused` ignoriert; ein Scrubber-Stand wäre sofort wieder überschrieben worden, die Anzeige wäre wirkungslos gewesen. `scene.ts` ruft jetzt `stepPlayback` auf und lässt den Store den Tick halten. Die Routenposition liest `playbackRouteIndex` und fällt nur dann auf die Helmenposition des Observers zurück, wenn noch kein Log vorliegt; damit ist der bisher ungenutzte Store-Wert an der Stelle verdrahtet, für die sein Kommentar ihn vorsah.

`test/raid-timeline.test.ts` deckt die Verdrahtung jetzt ab: ohne Log steht der Tick, im Spiel läuft er, ein gesetzter Scrubber-Stand wird übernommen und läuft ohne Pause weiter, mit Pause bleibt er exakt stehen, und die Routenposition folgt dem Scrubber-Tick statt der Helmenposition.

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
