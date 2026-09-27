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
  ├─ event-fx: eventFx(event, route.path)
  ├─ fx-seed: fxSeed(event) → stabile, präsentationslokale ID
  └─ observer: createVisualObserver().observe({grid, route, combat, tick})

render (Pixi)
  ├─ camera: worldToScreen / screenToWorld / fitCamera (einzige Quelle)
  ├─ runtime: createVisualRuntime(host) → Application, Ebenen, Ticker
  ├─ camera-controls: bindCameraControls(canvas, world, …) (Pan/Zoom)
  ├─ layer-sprite: addLayerSprite(layer, texture) (Sichtbarkeit, Abbau)
  ├─ canvas: gemeinsame Canvas-/Textur-Helfer
  ├─ atlas: Barrel der Textur-Owner
  ├─ tile-atlas: deterministische Boden-/Wandtexturen
  ├─ route-atlas: gepufferte Markertexturen
  ├─ actor-atlas: Actor-Silhouetten
  ├─ atmosphere-atlas: Glow-/Vignette-Texturen
  ├─ village-layout / village-atlas: Dorforte und Pixeltexturen
  ├─ village-scene: createVillageScene(textures, onBuildingClick) + update(ms)
  ├─ village-view: createVillageView(runtime, onBuildingClick)
  ├─ terrain: createTerrainView(runtime).apply(patch)
  ├─ route: createRouteView(runtime).apply(route.path, activeIndex)
  ├─ actors: createActorsView(runtime).apply(actors) + update(clock)
  ├─ fx: createFxView(runtime).emit(fx) + update(delta), Seed je Event/Partikel
  ├─ shadows/light: createLightingView(runtime)
  └─ filters: materialFilter(material)

input
  ├─ pointer: bindPointer(element, handlers)   (Pointer Events, Maus+Touch)
  ├─ hit-test: cellAtScreen / actorAtWorld     → render/camera
  ├─ drag: createDragController(...).onDrop(command)  (Kandidat → Slop → Zug)
  └─ drag-target: resolveTarget / passedSlop / advance / dropCommand

window (Preact)
  ├─ store: windows / focusedId Signals, openWindow / close / focus / patch
  ├─ drag: visibleArea / clampHead (Kopf bleibt im Sichtfeld) /
  │         isHeadControl (Knopfdruck ist kein Zug) / draggedHead
  └─ window-layer: WindowLayer → GameWindow (Drag, Resize),
       contentSignature(Inhalt) → contentKey des Inhaltsbereichs

showcase
  ├─ controls: bindViewportControls (Pan, Zoom, Klick, Drag)
  └─ scene: createShowcase → observer + Views + Kamera + Ticker

ui
  ├─ view: stageView Signal (village | dungeon), showView  (Navigation, keine Phase)
  ├─ shell: reines Layout → topbar + stage
  ├─ topbar → phase-badge + view-switch + Ressourcenstreifen + window-tabs
  ├─ stage → world-host (Pixi) + window-launcher + window-layer
  │    └─ world-host → createVisualRuntime (einmalig) → scene-switch
  │         └─ scene-switch → village-view | showcase, je genau eine lebende Szene
  └─ window-launcher → openWindow (phase | editor | team | route | legend)

dungeon-editor/state (einziger Grid-Owner)
  ├─ grid / brush Signals, route = computed(findPath)
  └─ paintVisibleTile → model.paintTile

village (einziger Phase-Owner der Schleife)
  ├─ phase: Phase-Union, ALLOWED_TRANSITIONS, resolvePhaseTransition
  ├─ state: dayNight Signal, setPhase (guarded), recordRaidJob
  ├─ phase-actions: startNight / triggerRaid / completeRaid / finishResult
  └─ settlement: villageOutlook() → Dorfname, Tag, Phasentext + Gildenroster

raid/fixture-raid
  ├─ buildFixtureUpload(grid) → @floor/contracts UploadRequest
  └─ runLocalFixtureRaid(grid) → @floor/sim-core runFixtureRaid

raid (besitzt den Lauf; die Timeline liest ihn, rechnet nichts)
  ├─ combat-source: buildCombatLog(current, path) → sim-core resolveSnapshotRaid,
  │                 loadRaidLog / unloadRaidLog → setPlaybackLog (einziger Schreibpfad)
  ├─ playback: playbackLog / playbackTick / playbackPaused, stepPlayback,
  │            setScrubTick, playbackRouteIndex
  ├─ timeline-model: buildTimelineSections, phaseForTick, clusterEvents,
  │                 trailBadge, resultCard
  ├─ phase-nav: drei Phasen-Knöpfe → setScrubTick(Phasenbeginn)
  ├─ raid-timeline: TimelineTransport (Scrubber, Play/Pause) + PhaseNav +
  │                RoutePhase + CombatPhase + ResultPhase

ui (Phasenfenster schaltet nach Phase, Bühne nach Blick)
  ├─ shell → topbar + stage, kennt keine Phase
  ├─ phase-badge: liest dayNight.phase / dayNight.day
  ├─ village-host → village/settlement (Weltbeschriftung, kein Panel)
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
Fixture und besitzt selbst keinen Dorfzustand; `ui/view` hält nur den Blick und
ändert keine Phase.
