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
  bleibt und der Core nichts über Rendering weiß. `daylight.ts` beschreibt die
  Tönung der vier Schleifenphasen als Überzugsebenen mit Deckkraft; die Farben
  liegen damit bei den Deskriptoren und nicht mehr in der Schicht, die den
  Überzug malt, und der Phasenwechsel ist eine Blende statt eines
  Gradiententauschs. Die Startwerte rechnet `daylightFadeStarts` komplementär,
  damit die Summe der Deckkräfte auch bei einem Wechsel in eine laufende Blende
  1 bleibt.
- `render/` — Pixi-Runtime. Besitzt `Application`, Ebenen, Ticker und Kamera.
  `camera.ts` enthält die einzige `worldToScreen`/`screenToWorld`-Implementierung
  und die Rahmung (`fitCamera`) für beide Welten. `village-layout.ts` hält die
  Präsentationsorte, `village-atlas.ts` die Pixeltexturen, `village-scene.ts`
  die Szene mit anklickbaren Gebäuden und `village-view.ts` deren Einbau in die
  Runtime. `layer-sprite.ts` besitzt die Lebensdauer eines Sprites in einer
  Ebene, `camera-controls.ts` den Pan/Zoom auf der Host-Fläche und
  `camera-keys.ts` den Tastenschritt samt der Props, die diese Fläche
  fokussierbar und für Vorlesehilfen benannt machen.
- `input/` — Eingabepfade: Pointer, Hit-Test, Drag und die Pfeiltasten. `arrows.ts`
  hält die einzige Abbildung Taste → Richtung; Fensterrahmen und Weltansicht
  fragen sie und rechnen mit ihrer eigenen Schrittweite. Der Drop emittiert nur
  einen Command und enthält keine Spielregel.
- `window/` — Preact-Fenster-Registry mit Fokus, Z-Order, Drag, Resize und
  Tastaturbedienung. `drag.ts` und `keys.ts` sind die beiden Eingabepfade auf
  dieselbe Box: der Zeiger zieht, die Pfeiltasten schieben, und beide klemmen
  mit denselben Mindestgrößen und derselben Kopfklemme. `fit.ts` hängt nur die
  Höhe an den gemessenen Inhaltsblock. Unterhalb von `SHEET_MAX_WIDTH` ist ein
  Fenster eine Schublade: `windows.css` führt dort die Geometrie allein, und
  beide Eingabepfade beginnen nicht — sonst wichen Store und Bild voneinander ab.
- `showcase/` — sichtbare Referenzszene, die alle Systeme zusammenschaltet.
- `dungeon-editor/` — DOM-Raster und der einzige State-Owner des Grids.
- `village/` — einziger Owner der Tag/Nacht/Raid-Phase und der Dorfwirtschaft.
  `phase.ts` reine Übergangslogik, `state.ts` Signal-Store, `phase-actions.ts`
  Kommandos. `balance.ts` besitzt jede Zahl des Dorfes als eingefrorene Config
  mit benannten Gruppen; `economy.ts` rechnet damit und bekommt die Config
  ausdrücklich übergeben, ohne Zustand und ohne Wurf-Fehler. `state.ts` führt
  neben Phase und Tag den Bestand (`village`) und die Tagesabrechnung
  (`daySettlement`), gebucht im selben Übergang `result → tag`, der auch den Tag
  hochzählt; die Phasenguarde ist zugleich die Idempotenz der Buchung.
  `settlement.ts` leitet daraus den Dorfblick als reine Funktion ab: Dorfname,
  Tag, Phasentext und das Gildenroster. Die Lage eines platzierten Gebäudes
  gehört der Platzierungsgeometrie (`plot.ts`) und kommt mit deren Verdrahtung
  dazu.
- `ui/` — Shell und Bühne. Die Shell ist Layout und liest den Phase-Store
  allein, um je Phase eine Ebene der Tagesstimmung auf den Überzug zu setzen;
  `daylight-fade.ts` fährt deren Blende ein und hält den Renderlauf aus der
  laufenden Blende heraus. Sie enthält keine Phase-Aktion und keinen
  Dorfzustand. Topbar, Bühne,
  Launcher und Fenster lesen ihre Stores selbst. `world-host.tsx` liefert den
  einzigen Pixi-Host und zugleich das Tastaturziel der Kamera (`role="application"`,
  beschriftet mit dem Tastenhinweis), `scene-switch.ts` tauscht darin Dorf- und
  Dungeon-Szene, ohne die Runtime neu aufzubauen. `window-launcher.tsx` ist die einzige
  Startrampe für Kontextfenster, `window-tabs.tsx` ihre Rückkehr in der Topbar.
  Die Topbar ist eine einzeilige Schiene über der Welt, keine Umbruchzone:
  Kontextfenster werden mit festem Abstand unter ihr geöffnet, eine zweizeilige
  Schiene läge über dem Fensterkopf und verschluckte dessen Klicks. Elastisch
  ist der Fenstertabs (er schrumpft und scrollt), erstes Opfer bei Enge ist der
  Markenname. Ihre Lücken sind klickdurchlässig, damit ein unter die Schiene
  gezogenes Fenster dort bedienbar bleibt. `window/drag.ts` hält die
  Zug-Geometrie: der Fensterkopf bleibt beim Ziehen immer im Sichtfeld, der
  Rumpf darf darüber hinaus; ein Klick auf den Schließen-Knopf beginnt keinen
  Zug. Das Phasenfenster behält seine ID und wechselt trotzdem seinen Inhalt;
  der Inhaltsbereich hängt an der Signatur des Inhalts
  (`window/window-layer.tsx`), damit kein Fenster mitten im neuen Panel
  aufklappt. `view.ts` hält den Blick auf die Bühne (`village | dungeon`) und
  ist bewusst kein Phasenzustand. `styles/` ist in Raster, Grundlage, Shell, Dorf, Panels,
  Fenster, Editor und Raid getrennt, eingebunden über `styles/index.css`.
- `raid/` — bestehender Contract-v3-Upload und lokaler Fixture-Auftrag; dazu
  die Raid-Timeline: `combat-source.ts` besitzt den Lauf und legt ihn über
  `setPlaybackLog` in den Store, `playback.ts` hält Log, Tick und Pause,
  `timeline-model.ts` die reinen Modelle, `raid-timeline.tsx`, `phase-nav.tsx`
  und `phases.tsx` die Darstellung. Die Timeline liest den Store und rechnet
  nichts selbst; den Takt treibt der Runtime-Ticker in `ui/world-host.tsx`
  über `stepPlayback`, damit der Replay im Dorf wie im Dungeon läuft.
  `showcase/scene.ts` liest Log und Tick im Raid-Modus nur noch aus dem Store.
  Das Phasenfenster montiert sie in der Raid-Phase; die Steuerung
  (`TimelineTransport`) steht über dem Inhalt und klebt am Oberkant, weil die
  Trail-Liste länger ist als jedes Fenster. `panel.tsx` reicht das terminale
  Ergebnis an den Phase-Store weiter.
- `fixture-data.ts` — read-only Startdaten.

## Datenfluss

```
Core + Editor-State (grid, route)
  → visual/observer          (Diff, keine zweite Grid-Wahrheit)
  → Präsentationsdeskriptoren
  → render/ (Terrain, Fake-3D-Wände, Route-Marker, Actors, FX, Licht)
  → Pixi → Browser
```

Der Editor bleibt DOM: `ui/editor-panel.tsx` malt über `dungeon-editor/state`
und färbt mit `world/materials`. Pixi rendert dieselbe Welt aus denselben
Definitionen, aber ohne eigenen Spielzustand. `render/route` erhält ausschließlich
`route.path` und markiert den Combat-Fortschritt, ohne Rasterdaten zu besitzen.
Der Render-Atlas ist nach Canvas-Helfern, Boden-/Wand-/Routentexturen sowie
Actor- und Atmosphärentexturen getrennt. `visual/route-index` bildet Actor- und
FX-Indizes über dieselbe boundsafe Funktion auf `route.path` ab; die
Actor-Variantenwahl ist in Leerlauf und Combat ID-basiert identisch. FX-Variation
wird pro Event aus einem stabilen Seed abgeleitet; ein gemeinsamer fortlaufender
Zufallsstrom existiert nicht.

## Schleife

```
tag → night → raid → result → tag (Tag +1)
             ↑        ↓
             └─ retry ┘ (fehlgeschlagener Auftrag)
```

`village/state.ts` ist der einzige Phase-Owner; die Phasen-Panels schreiben
nur über `phase-actions`, Topbar und Phasenfenster lesen direkt aus
dem Store. Ein Skip wie `tag → raid` wird in `resolvePhaseTransition`
verworfen, der Zustand bleibt unverändert.

Blick und Phase sind getrennt: die Topbar schaltet zwischen Dorf und Dungeon,
und `ui/view.ts` hält diese Wahl ohne Spielregel. Im Dorf zeigt
`village/settlement` nur, was die Schleife tatsächlich kennt — Tag, Gilde,
Verteidigerplätze und das Ergebnis des letzten Auftrags. Die Wirtschaft hängt
dagegen am Bestand in `village/state.ts`: die Topbar zeigt den gehaltenen
Bestand, und die Rückkehr schreibt den Werkstattertrag gut, genau einmal je
Expedition. Gold aus besiegten Gegnern gibt es noch nicht — die Zahl der
Gegner steht in keinem Contract-Feld, die Naht ist an `DaySettlement`
dokumentiert. Bau-, Upgrade- und Landbefehle, die den Bestand füllen, sind ein
späterer Slice.

## Grenzen

`render/camera.ts` ist die einzige räumliche Transformation; `render/`, `input/`
und `showcase/` rufen ausschließlich diese Funktionen auf. Preact erzeugt genau
einen Host-Knoten (`ui/world-host.tsx`), startet dort einmalig die Pixi-Runtime
und rendert danach keine Sprites als Komponenten. `ui/scene-switch.ts` hält
genau eine lebende Szene: Dorf und Dungeon werden gebaut und abgeräumt, nicht
nebeneinander gehalten, Canvas und Runtime bleiben unangetastet. Fenster liegen
als Preact-DOM über der Szene.

## Regeln

- `dungeon-editor/state.ts` bleibt der einzige Grid-Owner.
- `village/state.ts` bleibt der einzige Phase- und Dorfwirtschafts-Owner; keine
  Komponente hält eine zweite Phase- oder Bestandswahrheit. `village/balance.ts`
  ist die einzige Zahlenquelle, `village/economy.ts` rechnet ohne Zustand, und
  der Renderer leiht sich aus `village` höchstens eine Typenunion. Die
  Fixture-Daten tragen keine Dorfwirtschaftsgröße: Startbestand, Startarbeiter-
  basis und Attraktivität stehen ausschließlich in der Balance, und die Anzeige
  liest sie von dort. Jede Stufe, Etage, Platznummer und Spaltenzahl ist in den
  Regeln eine Ganzzahl ab 1 — eine kaputte Werkstattrechnung ergibt 0, ein
  Befehl mit kaputter Zahl eine Ablehnung mit genanntem Grund.
- `ui/view.ts` ist der einzige Owner des Bühnenblicks und verändert weder
  Phase noch Grid. Editorwerkzeug erscheint nur in der Dungeon-Ansicht; die
  Bau-Erlaubnis kommt weiter aus der Phase.
- Der Observer hält keine Grid-Kopie; Terrain wird nur bei geänderter
  Grid-Referenz neu gelesen, sonst meldet er `terrain: null`.
- Kein Clientpfad entscheidet den Raid-Ausgang.
- Editiert wird in DOM, die laufende Welt rendert Pixi.
- Der Dorfblick ist Präsentation: `village-layout.ts` verändert keinen
  Dorfzustand und erfindet keine Wirtschaftsregel.
- Die Showcase-Szene bezieht den Combat-Log aus `sim-core`; ihre Route-Marker
  folgen `route.value.path`, Combat-Positionen werden darauf abgebildet.
