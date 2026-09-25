# packages/client/docs/ARCHITEKTUR.md

## Rolle

PWA-Client. Die Welt ist die Navigation, die Oberfläche besteht aus
Kontextfenstern. Pixi rendert die laufende Szene, Preact/Signals die UI; die
Simulation bleibt der einzige Owner der Spielentscheidungen.

## Schichten

- `world/` — einzige Tile-, Material- und Deskriptor-Wahrheit. Editor und Pixi
  lesen dieselben Definitionen. Re-exportiert die Sim-Core-Konstanten und legt
  Höhe, Occlusion, Materialvarianten und Weltpixelmaße darüber.
- `visual/` — Visual Observer. Übersetzt Grid, Route und Combat-Log in
  Präsentationsdeskriptoren. Bewusst ohne Pixi-Import, damit die Logik testbar
  bleibt und der Core nichts über Rendering weiß.
- `render/` — Pixi-Runtime. Besitzt `Application`, Ebenen, Ticker und Kamera.
  `camera.ts` enthält die einzige `worldToScreen`/`screenToWorld`-Implementierung.
- `input/` — Pointer-Pfad, Hit-Test und Drag. Der Drop emittiert nur einen
  Command und enthält keine Spielregel.
- `window/` — Preact-Fenster-Registry mit Fokus, Z-Order, Drag und Resize.
- `showcase/` — sichtbare Referenzszene, die alle Systeme zusammenschaltet.
- `dungeon-editor/` — DOM-Raster und der einzige State-Owner des Grids.
- `ui/` — Shell, Host der Pixi-Welt, Editorraster in DOM.
- `raid/` — bestehender Contract-v2-Upload und lokaler Fixture-Auftrag.
- `fixture-data.ts` — read-only Startdaten.

## Datenfluss

```
Core + Editor-State (grid, route)
  → visual/observer          (Diff, keine zweite Grid-Wahrheit)
  → Präsentationsdeskriptoren
  → render/ (Terrain, Actors, FX, Licht)
  → Pixi → Browser
```

Der Editor bleibt DOM: `ui/editor-panel.tsx` malt über `dungeon-editor/state`
und färbt mit `world/materials`. Pixi rendert dieselbe Welt aus denselben
Definitionen, aber ohne eigenen Spielzustand.

## Grenzen

`render/camera.ts` ist die einzige räumliche Transformation; `render/`, `input/`
und `showcase/` rufen ausschließlich diese Funktionen auf. Preact erzeugt genau
einen Host-Knoten (`ui/world-host.tsx`), startet dort einmalig die Pixi-Runtime
und rendert danach keine Sprites als Komponenten. Fenster liegen als
Preact-DOM über der Szene.

## Regeln

- `dungeon-editor/state.ts` bleibt der einzige Grid-Owner.
- Der Observer hält keine Grid-Kopie; Terrain wird nur bei geänderter
  Grid-Referenz neu gelesen, sonst meldet er `terrain: null`.
- Kein Clientpfad entscheidet den Raid-Ausgang.
- Editiert wird in DOM, die laufende Welt rendert Pixi.
- Der Combat-Log der Szene kommt aus `sim-core` und trägt bewusst noch keinen
  Trail-Hash; die räumliche Wahrheit der Anzeige ist `route.value.path`.
