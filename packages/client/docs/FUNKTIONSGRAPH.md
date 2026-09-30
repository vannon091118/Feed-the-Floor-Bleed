# packages/client/docs/FUNKTIONSGRAPH.md

```text
world (Definitionen, keine Logik)
  ├─ tiles: CellType → TileDescriptor (Material, Höhe, Occlusion, Marker)
  ├─ materials: MaterialDef + pickVariant (FNV-1a, deterministisch)
  └─ geometry: cellToWorld / cellFoot / cellSeed, WORLD_*_PX

visual (ohne Pixi)
  ├─ terrain: buildTerrain(grid) / diffTerrain(prev, next)
  ├─ route-index: routePointAt(path, index), boundsafe gemeinsame Route-Abbildung
  ├─ variant: actorVariant(id), identische Leerlauf-/Combat-Varianten
  ├─ actor-frame: combatActors(units, events, route.path, tick)
  ├─ route-actors: routeActors(route.path)
  ├─ event-fx: eventFx(event, route.path) — dust/hit/blood/ambush, Menge aus event.amount
  ├─ fx-seed: fxSeed(event) → stabile, präsentationslokale ID
  ├─ daylight: daylightLayers / daylightTargets / daylightFadeStarts → Ebenen,
  │            Ruhezustand und Blendenstart mit Deckkraftsumme 1
  └─ observer: createVisualObserver().observe({grid, route, combat, tick})

render (Pixi)
  ├─ camera: worldToScreen / screenToWorld / fitCamera (einzige Quelle)
  ├─ runtime: createVisualRuntime(host) → Application, Ebenen, Ticker
  ├─ camera-controls: bindViewportControls({ element, world, … }) (Pan/Zoom/Klick/Drag, Dorf ohne Trefferschicht)
  ├─ camera-keys: cameraAfterKey / bindCameraKeys / cameraSurfaceProps (Tastenschritt,
  │                Richtung aus input/arrows)
  ├─ layer-sprite: addLayerSprite(layer, texture) (Sichtbarkeit, Abbau)
  ├─ canvas: gemeinsame Canvas-/Textur-Helfer
  ├─ atlas: Barrel der Textur-Owner
  ├─ tile-atlas: deterministische Boden-/Wandtexturen
  ├─ route-atlas: gepufferte Markertexturen
  ├─ actor-atlas: Actor-Silhouetten
  ├─ atmosphere-atlas: Glow-/Vignette-Texturen
  ├─ village-layout: Weltmaße, Bäume, projectVillagePlot(plot, grid) / village-atlas: Pixeltexturen
  ├─ village-ground: drawVillageGround(container, textures) + placeSprite(…)
  ├─ village-scene: createVillageScene(textures, { plots, onBuildingClick(index) })
  │                 + update(ms); liest den Bestand bei jedem Takt und legt nur bei Änderung neu an
  ├─ village-view: createVillageView(runtime, plots, onBuildingClick)
  ├─ terrain: createTerrainView(runtime).apply(patch)
  ├─ route: createRouteView(runtime).apply(route.path, activeIndex)
  ├─ actors: createActorsView(runtime).apply(actors) + update(clock)
  ├─ fx: createFxView(runtime).emit(fx) + update(delta), Seed je Event/Partikel
  ├─ shadows/light: createLightingView(runtime)
  └─ filters: materialFilter(material)

input
  ├─ pointer: bindPointer(element, handlers)   (Pointer Events, Maus+Touch)
  ├─ hit-test: cellAtScreen / actorAtWorld     → render/camera
  ├─ arrows: arrowDirection(key) → {dx, dy}    (eine Tabelle für beide Tastaturpfade)
  ├─ drag: createDragController(...).onDrop(command)  (Kandidat → Slop → Zug)
  └─ drag-target: resolveTarget / passedSlop / advance / dropCommand

window (Preact)
  ├─ store: windows / focusedId Signals, openWindow / close / focus / patch
  ├─ drag: visibleArea / clampHead (Kopf bleibt im Sichtfeld) /
  │         isHeadControl (Knopfdruck ist kein Zug) / draggedHead / capturePointer
  ├─ keys: boxAfterKey (Pfeiltasten verschieben, Umschalt skaliert; Richtung
  │         aus input/arrows) / windowKeyProps (tabIndex und onKeyDown des Rahmens)
  ├─ fit: useWindowFit (Inhaltsblock messen, Höhe patchen)
  └─ window-layer: WindowLayer → GameWindow (Drag, Resize, Tastatur),
       contentSignature(Inhalt) → contentKey des Inhaltsbereichs

showcase
  ├─ controls: bindViewportControls (Pan, Zoom, Klick, Drag)
  └─ scene: createShowcase → observer + Views + Kamera + Ticker

ui
  ├─ view: stageView Signal (village | dungeon), showView  (Navigation, keine Phase)
  ├─ shell: reines Layout → topbar + stage
  ├─ topbar → phase-badge + view-switch + Ressourcenstreifen + window-tabs
  ├─ stage → world-host (Pixi, Tastaturziel der Kamera) + window-launcher + window-layer
  │    └─ world-host → createVisualRuntime (einmalig) → scene-switch
  │         └─ scene-switch → village-view | showcase, je genau eine lebende Szene
  └─ window-launcher → openWindow (phase | editor | team | route | legend)

dungeon-editor/state (einziger Grid-Owner)
  ├─ grid / brush Signals, route = computed(findPath)
  ├─ model.startDungeon → Startdungeon mit zwei Platzierungsgruppen auf dem
  │            Korridor; Editor-Start, resetGrid und die Raid-Testquelle lesen sie
  └─ paintVisibleTile → model.paintTile

village (einziger Phase- und Dorfwirtschafts-Owner)
  ├─ phase: Phase-Union, ALLOWED_TRANSITIONS, resolvePhaseTransition
  ├─ balance: BALANCE — tief eingefrorene und tief unveränderliche Config,
  │           einzige Zahlenquelle des Dorfes
  │           (Startbestand, Startarbeiterbasis, Attraktivität, Grundrisse,
  │            Bau-/Ausbau-/Landkosten, Ertrag, Kapazität, Etagen-/Platzpreis)
  ├─ economy: reine Regeln, Config kommt ausdrücklich herein —
  │           buildCost / upgradeCost (a · n²) / workshopYield / dailyYield /
  │           workerBase / canBuildWorkshop / landStepCost / floorCost / slotCost.
  │           Stufe, Etage, Platz und Landausgang müssen Ganzzahlen sein;
  │           Ablehnungen sind unterscheidbare Ergebnisse, keine Wurf-Fehler.
  ├─ state: dayNight Signal (phase, day, job, village, daySettlement),
  │         setPhase — rechnet im Übergang result → tag den Werkstattertrag gut,
  │         closeDay ist die reine Rechnung dahinter; recordRaidJob;
  │         commitVillage (Schreibpfad der Kommandos, nur am Tag) und
  │         villageEditable als die eine Phasenfrage
  ├─ phase-actions: startNight / triggerRaid / completeRaid / finishResult
  ├─ plot: Footprint/GridBounds → rectsIntersect / footprintOverlaps /
  │        footprintWithinBounds / canPlace (Begründung bei Ablehnung) /
  │        edgeNeighbours (4-Nachbarschaft, Diagonalen zählen nicht) /
  │        expandHorizontally (Höhe bleibt, Spaltenzahl kommt herein)
  │        Datenfluss: `village/plot` besitzt die Platzierungsgeometrie;
  │        Abnehmer ist `village/commands`, das Raster und belegte Grundrisse
  │        aus dem Store durchreicht. Kein Import aus `render/` oder `world/`,
  │        damit die Geometrie frei von Darstellung bleibt. Die Dorfszene auf
  │        der Bühne liest den Bestand über `villagePlots()` (ui/scene-switch)
  │        und projiziert die Zellen in `render/village-layout`.
  ├─ commands: buildBuilding / upgradeBuilding / extendLand — nur am Tag,
  │        mit Deckung, Arbeiterkapazität und Platzierung, jede Ablehnung ein
  │        Ergebnis mit Grund; schreibt über commitVillage
  ├─ floors: buyFloor — die nächste Etage zum freigegebenen quadratischen
  │        Preis, nur am Tag über denselben Schreibpfad commitVillage; die
  │        Grenzarbeit liegt hinter floorCost in economy
  └─ settlement: villageOutlook() → Dorfname, Tag, Phasentext + Gildenroster

Wirtschaftskette (nur in dieser Richtung):
  balance (Zahlen) → economy (Regeln, Config als Parameter)
    → commands (Entscheidung) → state.village (Bestand) → state.daySettlement
    (Buchung im Übergang result → tag) → ui/topbar (Bestandsanzeige) und
    ui/settlement-toast (Rückkehrbilanz, nur am Tag; eine Ableitung ohne
    eigenen Sichtbarkeitszustand)
  Verdrahtet sind Tagesertrag, Bauen, Ausbauen, Landkauf und seit dem
  2026-09-29 der Etage-Kauf (village/floors, angezeigt über
  ui/floor-purchase); der Slotpreis hat noch keinen Aufrufer.
  `raid/fixture-raid.ts` sendet den Bestand des Dorfes, nicht mehr den
  Startbestand der Balance.

raid/fixture-raid
  ├─ buildFixtureUpload(grid) → @floor/contracts UploadRequest
  └─ runLocalFixtureRaid(grid) → @floor/sim-core runFixtureRaid

raid (besitzt den Lauf; die Timeline liest ihn, rechnet nichts)
  ├─ combat-source: buildCombatLog(current, path) → sim-core resolveSnapshotRaid,
  │                 loadRaidLog / unloadRaidLog → setPlaybackLog (einziger Schreibpfad)
  ├─ playback: playbackLog / playbackTick / playbackPaused, stepPlayback,
  │            setScrubTick, playbackRouteIndex
  ├─ timeline-model: buildTimelineSections, phaseForTick, clusterEvents,
  │                 trailBadge, ambushEvents (jedes Hinterhalt-Ereignis mit
  │                 Tick und Ziel in Worten)
  ├─ phases: RoutePhase / CombatPhase / ResultPhase — die Überlebendenzahlen
  │          kommen aus @floor/sim-core summarizeCombat, nicht aus einer
  │          zweiten Zählung; CombatPhase zählt je Klasse und listet den
  │          Hinterhalt zusätzlich einzeln als Knopf auf seinen Tick
  ├─ phase-nav: drei Phasen-Knöpfe → setScrubTick(Phasenbeginn)
  ├─ raid-timeline: TimelineTransport (Scrubber, Play/Pause) + PhaseNav +
  │                RoutePhase + CombatPhase + ResultPhase

ui (Phasenfenster schaltet nach Phase, Bühne nach Blick)
  ├─ shell → topbar + stage, kennt keine Phase
  ├─ daylight-fade: fadeDaylight(overlay, activeIndex) (Blende der Ebenen)
  ├─ phase-badge: liest dayNight.phase / dayNight.day
  ├─ topbar → Ressourcenstreifen liest dayNight.village.resources (kein
  │           Modulkonstante aus der Fixture)
  ├─ village-host → village/settlement (Weltbeschriftung, kein Panel)
  ├─ scene-switch: villagePlots() → { grid, buildings } aus dayNight.village
  │                (Naht zum Dorf-Store; der Renderer liest ihn nicht selbst)
  ├─ TagPhasePanel → startNight → phase night
  ├─ NightPhasePanel → triggerRaid → phase raid (Editor bleibt aktiv)
  ├─ RaidPhasePanel → RaidPanel.onJob → completeRaid(job) → phase result
  ├─ TimelineTransport (nur phase raid, über dem Inhalt, sticky) → Scrubber
  ├─ RaidTimeline (nur phase raid) → setScrubTick / playbackPaused
  └─ ResultPhasePanel → finishResult(job) → phase tag (completed) | raid (sonst)
```

Schleife: `tag → night → raid → result → tag` (Tag +1) beziehungsweise
`result → raid` als Retry nach fehlgeschlagenem Auftrag. Jeder andere
Übergang wird vom Store verworfen.

Den Log legt allein `raid/combat-source.ts` in den Store: `triggerRaid` lädt
ihn, `finishResult` räumt ihn mit dem Tag auf, und ein Effekt folgt dem Grid,
solange ein Raid läuft. Den Tick treibt der Runtime-Ticker in
`ui/world-host.tsx` über `stepPlayback` — nicht die Szene, damit der Replay im
Dorf genauso läuft wie im Dungeon. `showcase/scene.ts` liest Log und Tick im
Raid-Modus nur noch; es gibt keinen zweiten Zähler und keinen zweiten Log.
Der Scrubber schreibt ausschließlich `playbackTick` und löst keinen Core-Aufruf
aus.

Kurzregeln: `world` definiert nur. `visual` übersetzt ohne Pixi. `render`
besitzt die Szene. `input` emittiert Commands. Der Observer liest Grid und Route,
kopiert sie aber nicht. `village/settlement` liest den Phase-Owner und die
Fixture und besitzt selbst keinen Dorfzustand; `village/plot` rechnet
Platzierungsgeometrie und trägt weder Zustand noch Wirtschaftszahlen;
`village/balance` besitzt die Zahlen, `village/economy` rechnet damit ohne
Zustand, und `village/state` bucht; `ui/view` hält nur den Blick und
ändert keine Phase. Den Dorfbestand liest allein `ui/scene-switch` für die
Szene; `render/` bekommt Zellen und Art als Daten herein.
