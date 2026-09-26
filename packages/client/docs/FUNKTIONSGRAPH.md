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
  ├─ camera: worldToScreen / screenToWorld (einzige Quelle)
  ├─ runtime: createVisualRuntime(host) → Application, Ebenen, Ticker
  ├─ canvas: gemeinsame Canvas-/Textur-Helfer
  ├─ atlas: Barrel der Textur-Owner
  ├─ tile-atlas: deterministische Boden-/Wandtexturen
  ├─ route-atlas: gepufferte Markertexturen
  ├─ actor-atlas: Actor-Silhouetten
  ├─ atmosphere-atlas: Glow-/Vignette-Texturen
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
  └─ window-layer: WindowLayer → GameWindow (Drag, Resize)

showcase
  ├─ combat-source: buildCombatLog(grid, route) → sim-core resolveSnapshotRaid
  ├─ controls: bindViewportControls (Pan, Zoom, Klick, Drag)
  └─ scene: createShowcase → observer + Views + Kamera + Ticker

ui
  └─ shell → world-host (Pixi) + window-layer + editor-panel (DOM) + editor-controls

dungeon-editor/state (einziger Grid-Owner)
  ├─ grid / brush Signals, route = computed(findPath)
  └─ paintVisibleTile → model.paintTile

village (einziger Phase-Owner der Schleife)
  ├─ phase: Phase-Union, ALLOWED_TRANSITIONS, resolvePhaseTransition
  ├─ state: dayNight Signal, setPhase (guarded), recordRaidJob
  └─ phase-actions: startNight / triggerRaid / completeRaid / finishResult

raid/fixture-raid
  ├─ buildFixtureUpload(grid) → @floor/contracts UploadRequest
  └─ runLocalFixtureRaid(grid) → @floor/sim-core runFixtureRaid

raid/timeline (liest den Log, rechnet nichts)
  ├─ playback: playbackLog / playbackTick / playbackPaused, stepPlayback,
  │            setScrubTick, playbackRouteIndex
  ├─ timeline-model: buildTimelineSections, phaseForTick, clusterEvents,
  │                 trailBadge, resultCard
  ├─ phase-nav: drei Phasen-Knöpfe → setScrubTick(Phasenbeginn)
  └─ raid-timeline: PhaseNav + RoutePhase + CombatPhase + ResultPhase + Scrubber

ui (Shell schaltet nach Phase)
  ├─ shell → world-host + window-layer + Phase-Panel je phase
  ├─ phase-badge: liest dayNight.phase / dayNight.day
  ├─ TagPhasePanel → startNight → phase night
  ├─ NightPhasePanel → triggerRaid → phase raid (Editor bleibt aktiv)
  ├─ RaidPhasePanel → RaidPanel.onJob → completeRaid(job) → phase result
  ├─ RaidTimeline (nur phase raid) → setScrubTick / playbackPaused
  └─ ResultPhasePanel → finishResult(job) → phase tag (completed) | raid (sonst)
```

Schleife: `tag → night → raid → result → tag` (Tag +1) beziehungsweise
`result → raid` als Retry nach fehlgeschlagenem Auftrag. Jeder andere
Übergang wird vom Store verworfen.

Die Timeline liest denselben Log, den `showcase/combat-source.ts` über
`setPlaybackLog` in den Store legt. `showcase/scene.ts` treibt den Tick über
`stepPlayback`; es gibt keinen zweiten Zähler. Der Scrubber schreibt
ausschließlich `playbackTick` und löst keinen Core-Aufruf aus.

Kurzregeln: `world` definiert nur. `visual` übersetzt ohne Pixi. `render`
besitzt die Szene. `input` emittiert Commands. Der Observer liest Grid und Route,
kopiert sie aber nicht.
