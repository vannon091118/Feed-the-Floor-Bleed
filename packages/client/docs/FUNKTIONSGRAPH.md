# packages/client/docs/FUNKTIONSGRAPH.md

```text
world (Definitionen, keine Logik)
  ├─ tiles: CellType → TileDescriptor (Material, Höhe, Occlusion, Marker)
  ├─ materials: MaterialDef + pickVariant (FNV-1a, deterministisch)
  └─ geometry: cellToWorld / cellFoot / cellSeed, WORLD_*_PX

visual (ohne Pixi)
  ├─ terrain: buildTerrain(grid) / diffTerrain(prev, next)
  ├─ combat-frame: combatFrame(log, route.path, tick, from)
  │                 routeActors(route.path)
  └─ observer: createVisualObserver().observe({grid, route, combat, tick})

render (Pixi)
  ├─ camera: worldToScreen / screenToWorld (einzige Quelle)
  ├─ runtime: createVisualRuntime(host) → Application, Ebenen, Ticker
  ├─ atlas: tileTexture / unitTexture / glowTexture / vignetteTexture
  ├─ terrain: createTerrainView(runtime).apply(patch)
  ├─ actors: createActorsView(runtime).apply(actors) + update(clock)
  ├─ fx: createFxView(runtime).emit(fx) + update(delta)
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

raid/fixture-raid
  ├─ buildFixtureUpload(grid) → @floor/contracts UploadRequest
  └─ runLocalFixtureRaid(grid) → @floor/sim-core runFixtureRaid
```

Kurzregeln: `world` definiert nur. `visual` übersetzt ohne Pixi. `render`
besitzt die Szene. `input` emittiert Commands. Der Observer liest Grid und Route,
kopiert sie aber nicht.
