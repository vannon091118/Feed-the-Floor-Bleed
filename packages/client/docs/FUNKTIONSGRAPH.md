# packages/client/docs/FUNKTIONSGRAPH.md

```text
main.tsx
  └─ ui/Shell
       ├─ liest fixture-data (read-only)
       ├─ besitzt phase ('day' | 'night', lokal)
       ├─ village:VillagePanel({ village, day, workers, attractiveness, materials })
       ├─ raid:TeamPanel({ team, isNight })
       └─ Nacht:
            ├─ dungeon-editor:EditorPanel({ resources })
            │     ├─ state:selectBrush(brush)
            │     ├─ state:resetGrid()
            │     ├─ state:paintVisibleTile(x, y)
            │     │     └─ model:paintTile(grid, brush, x, y)
            │     │            └─ @floor/sim-core: clone/getCell/setCell
            │     ├─ model:visibleRouteTiles(route)
            │     └─ state.route = computed(findPath(grid))
            └─ raid:RaidPanel()
                  └─ raid:runLocalFixtureRaid(grid)
                        ├─ buildFixtureUpload(grid) → @floor/contracts UploadRequest
                        │     └─ @floor/sim-core fromDungeonGrid
                        └─ @floor/sim-core runFixtureRaid → RaidJob
```

Kurzregeln: `Shell` besitzt nur die Phase. `dungeon-editor/state` besitzt Grid und
Pinsel. `dungeon-editor/model` ist pur und ohne Preact. `fixture-data` wird nur
gelesen. `raid` liest den Grid-Command des Editor-States, schreibt ihn aber nie.
Kein Panel importiert Fixture- oder State-Module fremder Domänen; `RaidPanel`
greift bewusst auf das Grid des Editor-States zu, weil der Auftrag genau diesen
Stand einfrieren soll.
