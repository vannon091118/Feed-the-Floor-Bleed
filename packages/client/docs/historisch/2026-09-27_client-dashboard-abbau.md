# packages/client/docs/historisch/2026-09-27_client-dashboard-abbau.md — Dashboard abgebaut

Abgelegt aus `packages/client/docs/CHANGELOG.md` am 2026-09-28, weil der aktive Changelog an die 200-Zeilen-Cap kam. Inhaltlich unverändert.

## 2026-09-27 — Dashboard abgebaut: eine lebende Welt mit kontextuellen Fenstern

**Scope:** `render/village-layout.ts`, `village-atlas.ts`, `village-scene.ts`, `village-view.ts`, `camera.ts`, `camera-controls.ts`, `layer-sprite.ts`, `runtime.ts` und `ui/world-host.tsx`, `ui/scene-switch.ts`, `ui/window-launcher.tsx`, `ui/window-tabs.tsx`, `ui/building-label.ts`, `ui/stage.tsx`, `ui/topbar.tsx` sowie die Styles. `ui/sidebar.tsx` und `ui/window-tools.tsx` sind entfallen. Neu: `test/world-presentation.test.ts` und `test/window-routing.test.ts`.

**Ein Canvas, eine Runtime.** Vorher gab es zwei Pixi-Besitzer und zwei dargestellte Dörfer. Jetzt erzeugt `ui/world-host.tsx` genau einen Host und genau eine `createVisualRuntime`; `ui/scene-switch.ts` hält genau eine lebende Szene und baut beim Blickwechsel die andere auf, ohne Runtime oder Canvas anzufassen. Editor und Raid teilen sich die Dungeon-Szene, das Dorf hängt seine Animation über `runtime.onTick` an denselben Ticker. Im Browser über vier Blickwechsel geprüft: jedes Mal genau ein `<canvas>`.

**Die Welt ist die Navigation.** Die Dorfszene ist eine 1000×640 große Pixelkarte mit anklickbaren Gebäuden, Bäumen und deterministisch laufenden Bewohnern; `fitCamera` rahmt sie, `render/camera-controls.ts` schwenkt und zoomt auf dem Canvas. Hinter dem Weltrechteck liegt eine `TilingSprite`-Wiese, damit breite Viewports keinen schwarzen Rand zeigen. Ein Klick auf ein Gebäude öffnet ein transluzentes Kontextfenster mit sprechendem Namen — `Rathaus`, nicht `hall`. Der Dorfblick bleibt Präsentation: kein Dorfzustand, keine Wirtschaftsregel.

**Kontextfenster statt Dashboard.** Die Sidebar ist gelöscht. `ui/window-launcher.tsx` ist die einzige Startrampe und liegt als transluzente Schiene über der Welt, `ui/window-tabs.tsx` führt die offenen Fenster in der Topbar zurück. Die Fenster-Registry staffelt neue Fenster, damit nichts deckungsgleich startet. Das Phasenfenster behält seine ID über die Schleife hinweg und zieht seinen Titel bei jedem Phasenwechsel nach — geprüft über `Tag → Nacht`. Doppelte Phasen- und Editor-Launcher in der Topbar sind entfallen; Fenster tragen nur noch Titel, Focus und Z-Order.

**Gates:** `pnpm run -s typecheck`, `pnpm test -- --run` (37 Dateien, 204 Tests), `pnpm run -s lint` (0 Fehler, 8 Baseline-Warnungen in nicht angefassten Dateien), `node scripts/shinon/engine.mjs --full` und `pnpm --filter @floor/client build` sind grün. Drei Gate-Verstöße aus dem Umbau wurden behoben: LOC-Cap in `world-host.tsx` (Szenenwechsel nach `scene-switch.ts`) und `runtime.ts` (Rahmung nach `fitCamera`), Redundanz zwischen `editor-grid.ts` und `lighting.ts` (gemeinsamer `layer-sprite.ts`).

**Abnahme:** Im Browser geprüft — ein Canvas, Dorf mit laufenden Bewohnern, Gebäudeklick öffnet das richtige Fenster, Tag → Nacht zieht den Fenstertitel nach, Blickwechsel in beide Richtungen, Pan und Zoom, keine Konsolenfehler. **Offen:** Auf hohen Viewports bleibt das Dorfbild oben und unten von Wiese umgeben, weil die Karte querformat ist; Wirtschaft, Expeditionen und ein dauerhaft gepflegter Dorfblick bleiben T2.
