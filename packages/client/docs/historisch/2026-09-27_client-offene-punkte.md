# packages/client/docs/historisch/2026-09-27_client-offene-punkte.md — Die drei offenen Punkte der Oberfläche

Wortgleich aus `packages/client/docs/CHANGELOG.md` verschoben am 2026-09-29, weil der aktive Changelog den 200-Zeilen-Cap erreicht hatte. Append-only.

## 2026-09-27 — Die drei offenen Punkte geprüft: zwei erledigt, einer accessorisch nachgezogen

**Scope:** geändert `ui/window-launcher.tsx`, `ui/styles/panels.css`, `window/window.tsx` (nur die ARIA-Verdrahtung des Kopfes, keine Logik) sowie `docs/REPOINDEX.md` und `docs/STRINGMATRIX.md`. `render/village-*`, `ui/world-host.tsx`, `ui/stage.tsx` und die Dorf-Szene unberührt.

**Doppelte Launcher: erledigt, am Code belegt.** Am alten Stand rendert `topbar.tsx` über `<ToolGroup />` aus `window-tools` einen zweiten Satz; im Arbeitsstand ist `ui/window-tools.tsx` gelöscht, `topbar.tsx` enthält außer Wortmarke, Phasenanzeige, Ansichtswechsel, Fenstertabs und Ressourcen keinen einzigen Knopf, und `phase-windows.tsx` liefert Fensterinhalt je Phase, keine Startknöpfe. Sichtbare Quelle bleibt der Launcher über der Bühne (`ui/window-launcher.tsx`), weil dort die Fenster als Kaskade aufgehen; die Topbar führt nur die Tabs als Rückweg. Nichts geändert.

**`ui/sidebar.tsx`: erledigt, mit einer toten Reststelle.** Die Datei existiert im Arbeitsstand nicht mehr und hat keine Importeure in `src/` oder `test/`; `CHANGELOG.md:91` hält den Entfall fest. Übrig war die CSS-Hülle: `.sidebar` in `ui/styles/panels.css` beschrieb eine Komponente, die es nicht mehr gibt, und ein Kommentar daneben sprach noch von der Sidebar. Beides raus, die REPOINDEX-Beschreibung des Stylesheets auf „Fenster-Panelflächen" gezogen. `.panel*` bleibt, weil die Phasenfenster es benutzen.

**Gebäudetitel: erledigt, ARIA war die Lücke.** `ui/stage.tsx` setzt den Fenstertitel über `buildingLabel(building.kind)`, dasselbe wie `BuildingPanel` in `ui/panels.tsx` — eine Quelle (`ui/building-label.ts`, `Record<BuildingKind, string>`), keine zweite Liste; im Browser tragen Fensterkopf und Tab „Rathaus". Neu verlinkt ist die Beschriftung: die fünf Launcherknöpfe tragen neben `title` jetzt `aria-label` mit demselben Satz, damit Screenreader nicht nur „Gilde" vorlesen. Im Fenster zeigte der Titelspan eine `id`, auf die nichts zeigte, während das Fenster selbst `aria-label={win.title}` setzte; jetzt hängt der Kopf als `aria-labelledby` dran, der sichtbare Titel ist der zugängliche Name. Das war LOC-neutral möglich, weil `window.tsx` bei 119 von 120 steht.

**Gates:** typecheck 0, Lint 0, Tests grün, LOC-Caps ok, Hygiene ok, Shinon PASS einschließlich Redundanz-Gate.
