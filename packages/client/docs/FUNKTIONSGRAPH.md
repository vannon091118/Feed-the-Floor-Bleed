# packages/client/docs/FUNKTIONSGRAPH.md

```text
main.tsx
  └─ ui/Shell
       ├─ liest fixture-data (read-only)
       ├─ besitzt phase ('day' | 'night', lokal)
       ├─ village:VillagePanel({ village, day, workers, attractiveness, materials })
       └─ dungeon-editor:EditorPanel({ resources })
              ├─ state:selectBrush(brush)
              ├─ state:resetGrid()
              ├─ state:paintVisibleTile(x, y)
              │     └─ model:paintTile(grid, brush, x, y)
              │            └─ @floor/sim-core: clone/getCell/setCell
              ├─ model:visibleRouteTiles(route)
              └─ state.route = computed(findPath(grid))
                     └─ @floor/sim-core:findPath
```

Kurzregeln: `Shell` besitzt nur die Phase. `dungeon-editor/state` besitzt Grid und
Pinsel. `dungeon-editor/model` ist pur und ohne Preact. `fixture-data` wird nur
gelesen. Kein Panel importiert Fixture- oder State-Module fremder Domänen.
