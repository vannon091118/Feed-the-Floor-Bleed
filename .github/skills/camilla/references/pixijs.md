# PixiJS v8 in diesem Stack

Kurzfassung dessen, was du beim Bauen der Szene brauchst. Für API-Details lade den passenden `pixijs-*-Skill`.

## Aufbau

`render/runtime.ts` besitzt die Application und ist der einzige Ort, an dem `new Application()` und `app.init()` stehen. Der Konstruktor nimmt in v8 **keine** Optionen; alles wandert in das asynchrone `init()`. Wer die Optionen an den Konstruktor reicht, bekommt eine Ignorierung mit Deprecation-Warnung.

```ts
const app = new Application()
await app.init({ width, height, antialias: true, autoDensity: true, resolution })
host.appendChild(app.canvas)   // nicht app.view
```

`app.canvas`, `app.renderer` und `app.screen` existieren erst, **nachdem** `init()` aufgelöst ist. Preact liefert nur das Host-Element; die Szene gehört `ui/scene-switch.ts`.

## Ebenen

`render/layers.ts` definiert die Z-Ordnung: `void` (0), `terrain` (10), `world` (20), `overlay` (30), `editor` (40), `village` (50).

`world` ist **die einzige sortierbare Ebene**, und das ist Absicht: Wände, Schatten, Akteure und FX liegen zusammen, damit eine Fußpunkt-Tiefe Akteure hinter Wänden verschwinden lässt (Fake-3D-Occlusion). Getrennte Ebenen für Wand und Actor würden die Tiefenordnung zerstören. Zerstör diese Struktur nicht für „mehr Ordnung".

Neue Z-Ebenen brauchen eine Begründung im Kommentar und eine Doku-Zeile — sie sind ein Global-Ordner, kein lokales Detail.

## Depth

`render/depth.ts` liefert den Fußpunkt-Schlüssel; `render/actors.ts` nutzt ihn, um Fake-3D-Okklusion zu erzeugen. Die Reihenfolge entsteht **am Fußpunkt**, nicht am Mittelpunkt — sonst schweben Akteure vor Wänden, auf denen sie stehen sollten.

## Texturen

Zwei Sorten, und sie haben verschiedene Rechte:

- **Prozedurale Atlanten** (`actor-atlas.ts`, `tile-atlas.ts`, `village-atlas.ts`, `route-atlas.ts`, `editor-grid-atlas.ts`, `atmosphere-atlas.ts`) sind der Fallback und der Default. Sie werden gepuffert, nicht pro Frame erzeugt.
- **Geladene Assets** kommen über `render/assets.ts` und sind **optional**: `optionalTexture(runtime.assets, 'village.tree') ?? undefined`. Fehlt eine Textur, crasht nichts — die Szene zeichnet eben ohne sie.

`Texture.from(url)` lädt nichts, es liest nur den Cache. Zum Laden `Assets.load`. `Sprite.from` liest ebenfalls nur den Cache.

Jedes ausgelieferte Raster-Asset muss selbst erstellt sein; Asset-ID, Quelle und Freigabe stehen vor der Aufnahme im Build in der Doku (E6 in `docs/VISUAL_GRUNDSATZ.md`).

## Draw Calls

Nicht die Objektzahl ist teuer, die **Reihenfolge**. PixiJS bricht Batches bei Objekttypwechsel, Texturquellenwechsel, Blend-Mode-Wechsel und Topologie-Wechsel.

```text
schlecht: sprite, graphic, sprite, graphic  → 4 Draw Calls
gut:      sprite, sprite, graphic, graphic  → 2 Draw Calls
```

Gleiches gilt für Blend-Modes: `screen/normal/screen/normal` ist vier, `screen/screen/normal/normal` ist zwei. Ein diagnostics-Overlay, das Draw Calls zählt, gehört **nie** ins Spiel — es ist ein Werkzeug für die Entwicklung und fliegt vor der Übergabe raus.

## Blätter

`Sprite`, `Text`, `BitmapText`, `Graphics`, `Mesh` und `ParticleContainer` nehmen keine Kinder. Um mehrere zu gruppieren, brauchen sie einen `Container` darüber. Das ist kein Zufall, sondern die Trennung zwischen Knoten und Blatt in der Szenenstruktur.

`ParticleContainer` nimmt `Particle`-Instanzen über `addParticle` — `addChild` **wirft**. Die Partikel liegen in `particleChildren`, nicht in `children`. Alle teilen sich eine Basistextur, und ohne `boundsArea` ist die Bounds leer, wodurch die Partikel beim Culling wegfallen.

## Text

Der teuerste Fehler der ganzen Szene: `Text.text` pro Frame. Jede Änderung rastert den ganzen String neu und lädt ihn auf die GPU hoch. Das kostet bei 60 Hz mehr als der Rest der Szene.

- Läuft eine Zahl (Score, Timer, Ressourcen, Tick-Zähler) → `BitmapText`.
- Statische Beschriftung → `Text`.
- Vor dem Setzen prüfen, ob sich der Wert überhaupt geändert hat.

## Filter und FX

`render/filters.ts` teilt **einen** `ColorMatrixFilter` je Material über einen Cache. Ein Filter pro Sprite wäre ein Filter pro Draw-Call. Wenn du Materialien erweiterst, geh in diese Tabelle statt in die Sprites.

`render/fx.ts` ist gepoolt und allokiert pro Treffer nichts. Wenn du FX erweiterst, erweitere den Pool — nicht die Sprites daneben.

## Zerstörung

```ts
parent.removeChild(sprite)
sprite.destroy()
```

Zerstören, während die Render-Pipeline die Referenz noch hält, crasht. Muss es mitten im Frame passieren, über `app.ticker.addOnce`.

`app.destroy()` ohne `{ releaseGlobalResources: true }` lässt gepoolte Batches und Texturen in den globalen Pools zurück. Beim nächsten `init()` im selben Tab flackert und korruptiert es. Das ist die häufigste Ursache für „nach dem Neuladen flackert alles".

`cacheAsTexture(true)` vor `destroy()` abschalten — sonst hängt die Cache-Textur am Container.

## Leistung

Bevor du optimierst, miss. Der typische Verdacht liegt falsch: die Ursache ist fast nie die Objektzahl, sondern ein `Text` im Ticker, ein Filter pro Sprite, eine unterbrochene Batch-Reihenfolge oder zerstörte Objekte im Rebuild-Pfad.

Die Muster aus `pixijs-performance` hierher übersetzt:

| Muster | Hier |
|--------|------|
| Objekte recyceln statt neu bauen | `layer-sprite.ts`, `fx.ts` — beide leben schon davon |
| Text nur bei Wertänderung | `render/animation.ts` arbeitet auf der Renderuhr, nicht auf dem Zustand |
| Batching | Abschnitt „Draw Calls" oben |
| Culling | `CullerPlugin` ist nicht registriert; bei wachsenden Szenen ist das die erste Stellschraube |
| Resolution | `runtime.ts` begrenzt auf `min(2, devicePixelRatio)`; `resolution: 2` vervierfacht die Pixelzahl |

## v8-Fallen in Kurzform

| Falsch | Richtig |
|--------|--------|
| `new Application({...})` | `new Application()` + `await app.init({...})` |
| `app.view` | `app.canvas` |
| `Texture.from(url)` zum Laden | `await Assets.load(url)` |
| `new Text("x", style)` | `new Text({ text: "x", style })` |
| `container.addChild(sprite)` in `ParticleContainer` | `container.addParticle(new Particle(texture))` |
| `text.text = wert` pro Frame | `BitmapText` oder Änderungsprüfung |
| `Shader.from(vertex, fragment, uniforms)` | `Shader.from({ gl: {...}, resources: {...} })` |
| `new UniformGroup({ uTime: 1 })` | `new UniformGroup({ uTime: { value: 1, type: "f32" } })` |
| `geometry.getSize()` | `geometry.vertexCount` |
| `app.destroy()` | `app.destroy({ releaseGlobalResources: true })` |
