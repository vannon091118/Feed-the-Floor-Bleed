# packages/client/docs/CHANGELOG.md

## 2026-09-27 — Die drei offenen Punkte geprüft: zwei erledigt, einer accessorisch nachgezogen

**Scope:** geändert `ui/window-launcher.tsx`, `ui/styles/panels.css`, `window/window.tsx` (nur die ARIA-Verdrahtung des Kopfes, keine Logik) sowie `docs/REPOINDEX.md` und `docs/STRINGMATRIX.md`. `render/village-*`, `ui/world-host.tsx`, `ui/stage.tsx` und die Dorf-Szene unberührt.

**Doppelte Launcher: erledigt, am Code belegt.** Am alten Stand rendert `topbar.tsx` über `<ToolGroup />` aus `window-tools` einen zweiten Satz; im Arbeitsstand ist `ui/window-tools.tsx` gelöscht, `topbar.tsx` enthält außer Wortmarke, Phasenanzeige, Ansichtswechsel, Fenstertabs und Ressourcen keinen einzigen Knopf, und `phase-windows.tsx` liefert Fensterinhalt je Phase, keine Startknöpfe. Sichtbare Quelle bleibt der Launcher über der Bühne (`ui/window-launcher.tsx`), weil dort die Fenster als Kaskade aufgehen; die Topbar führt nur die Tabs als Rückweg. Nichts geändert.

**`ui/sidebar.tsx`: erledigt, mit einer toten Reststelle.** Die Datei existiert im Arbeitsstand nicht mehr und hat keine Importeure in `src/` oder `test/`; `CHANGELOG.md:91` hält den Entfall fest. Übrig war die CSS-Hülle: `.sidebar` in `ui/styles/panels.css` beschrieb eine Komponente, die es nicht mehr gibt, und ein Kommentar daneben sprach noch von der Sidebar. Beides raus, die REPOINDEX-Beschreibung des Stylesheets auf „Fenster-Panelflächen" gezogen. `.panel*` bleibt, weil die Phasenfenster es benutzen.

**Gebäudetitel: erledigt, ARIA war die Lücke.** `ui/stage.tsx` setzt den Fenstertitel über `buildingLabel(building.kind)`, dasselbe wie `BuildingPanel` in `ui/panels.tsx` — eine Quelle (`ui/building-label.ts`, `Record<BuildingKind, string>`), keine zweite Liste; im Browser tragen Fensterkopf und Tab „Rathaus". Neu verlinkt ist die Beschriftung: die fünf Launcherknöpfe tragen neben `title` jetzt `aria-label` mit demselben Satz, damit Screenreader nicht nur „Gilde" vorlesen. Im Fenster zeigte der Titelspan eine `id`, auf die nichts zeigte, während das Fenster selbst `aria-label={win.title}` setzte; jetzt hängt der Kopf als `aria-labelledby` dran, der sichtbare Titel ist der zugängliche Name. Das war LOC-neutral möglich, weil `window.tsx` bei 119 von 120 steht.

**Gates:** typecheck 0, Lint 0, Tests grün, LOC-Caps ok, Hygiene ok, Shinon PASS einschließlich Redundanz-Gate.

## 2026-09-27 — Drei Reste des Tote-Code-Schritts abgeräumt

**Scope:** geändert `ui/roster-list.tsx`, `village/settlement.ts`, `village/index.ts`, `test/village-settlement.test.ts`, `docs/ARCHITEKTUR.md`, `FUNKTIONSGRAPH.md`, `REPOINDEX.md` und `STRINGMATRIX.md`. Kein Panel, kein Fenster, keine Dorf-Szene berührt.

**Der tote Statuskanal.** `roster-list.tsx` berechnete `tone` und schrieb `data-tone` auf einen Span; im ganzen Repo existiert keine `[data-tone]`-Regel, auch nicht in HEAD, wo sie nur an `.district` und `.meter__fill` hing, beides seit dem vorigen Schritt entfernt. Der Kommentar „Verletzung färbt die Zeile" beschrieb ein Verhalten, das es nie gab. Kanal und Behauptung sind raus, HP, Müdigkeit und Verletzung stehen als Zahl und Wort in der Zeile. **Offen für den Nutzer:** ob das Wort genügt oder die Zeile eine Farte bekommen soll — Designentscheidung, kein Aufräumen, deshalb hier nicht gebaut.

**Die Ableitung ohne Leser.** `settlement.ts` stand bei 146 von 150 erlaubten Code-Zeilen und leitete `districts` (Rathaus, Gilde, Verteidiger-Gehege mit `tone`, `share`, `note`) und `lastNight` ab. Seit das Panel weg ist, lasen nur noch Tests diese Felder. Entfallen sind `DistrictTone`, `VillageDistrict`, `NightRecord`, `HALL_STATE`, `hallTone`, `hall`, `guild`, `pen` und `nightRecord`, dazu die drei Barrel-Exporte; die Datei misst jetzt 27 statt 146 Code-Zeilen und hat damit 123 Zeilen Luft bis zur Cap. Wirtschaft und Expeditionen bleiben unberührt T2. `test/village-settlement.test.ts` schrumpft von 92 auf 21 Zeilen mit zwei Fällen: übrig bleiben Dorfname, Tag, Phase und die Roster-Identität (`roster === fixture.team`, die Invariante hinter dem Kommentar). Die Tagzählung nach Abschluss und Fehlschlag prüft `day-night-loop.test.ts` bereits (`fixture.day + 1` und `+ 2`) — keine Lücke, nur keine Doppelung mehr.

**Die Benennung.** „Dorflage" war Vokabular, das vorher keines war; der Domänenbegriff bleibt „Dorfblick". Zurückbenannt in ARCHITEKTUR (zwei Stellen), FUNKTIONSGRAPH, REPOINDEX (zwei Stellen), `settlement.ts` und in den beiden noch uncommitteten Changelog-Einträgen, die das Wort schon führten. Die `district/*`-Zeilen sind aus der Stringmatrix raus, weil es die Felder nicht mehr gibt.

**Gates:** typecheck 0, Lint 0, Tests grün, LOC-Caps ok, Hygiene ok, Shinon PASS einschließlich Redundanz-Gate.

## 2026-09-27 — Die zweite Dorfdarstellung ist entfernt

**Scope:** entfallen `ui/village-view.tsx` und `ui/styles/village.css`; geändert `ui/styles/panels.css`, `ui/styles/index.css`, `ui/roster-list.tsx`, `ui/phase-panels.tsx`, `raid/panel.tsx`, `village/settlement.ts` (nur Kommentar) sowie `docs/REPOINDEX.md`, `docs/STRINGMATRIX.md`, `docs/ARCHITEKTUR.md`; neu `docs/historisch/2026-09-25_client-aufbau.md`. `render/village-view.ts`, `ui/world-host.tsx`, `ui/stage.tsx` und die Fensterlogik unberührt. Kein Test musste angefasst werden.

**Der Befund.** `ui/village-view.tsx` (85 Zeilen) hatte keine Importeure: die alte zweite Dorfdarstellung — Ort, Gilde und Bilanz der letzten Nacht als Kartenpanel. Sie war genau die Doppelung, die der Dorf-Umbau beseitigen soll, und hielt 150 Zeilen `village.css` am Leben, davon 117 exklusive Regeln.

**Was exklusiv war und was nicht.** Am Code durchgesetzt, nicht am Dateinamen: `.village*`, `.district*` samt `data-tone`, `.section-title` und `.meter*` kommen in `src/` und `test/` ausschließlich in der toten Datei vor. `.roster*` lebt weiter, denn `ui/roster-list.tsx` wird von `TeamPanel` in `ui/panels.tsx` benutzt; die sechs Regeln sind deshalb nach `panels.css` umgezogen, wo die übrigen Panel-Bausteine liegen, statt mitgeschlachtet zu werden. `.eyebrow` ist in `base.css` definiert und von `phase-panels.tsx` genutzt, blieb unangetastet. Nach dem Löschen der Datei wäre `village.css` eine Datei mit einem fremden Namen gewesen; Import in `index.css` mit entfernt.

**Zweiter Befund: ein verwaister Export und ein Satz, der ins Leere zeigte.** `raidOutcomeText` in `raid/panel.tsx` war nur für den Dorfblick exportiert worden („Einzige Textquelle für Urteil und Fehler: das Ergebnis-Panel und der Dorfblick formulieren dadurch nie getrennt"). Ohne die Datei bleibt ein dünner Wrapper über `STAGE_TEXT`/`CODE_TEXT`, die das Ergebnis-Panel ohnehin direkt liest — entfernt, der Kommentar nennt jetzt die echte Quelle. Und das Tag-Panel versprach dem Spieler: „Ort, Gilde und Bilanz der letzten Nacht stehen im Dorfblick." Dieses Fenster gab es nicht mehr. Der Satz zeigt jetzt auf das, was tatsächlich da ist: der Ort ist die Welt, die Gilde das Gildenfenster. Als `phase/tag-note` in der Stringmatrix festgehalten, `district/tone` entsprechend als Datenfeld statt als Kartenkante beschrieben.

**Doku.** „Dorfblick" bezeichnete zwei Dinge: das Panel und die Ableitung in `village/settlement.ts`. Das Panel ist aus REPOINDEX und STRINGMATRIX raus, die Ableitung behält ihren Namen; die Historie in CHANGELOG und `ARCHITEKTUR.md:21` (`village-view.ts`) bleibt unangetastet, weil sie die lebende Szene meint. Der CHANGELOG wäre über die 200-Zeilen-Cap gekommen: die drei ältesten Einträge stehen jetzt vollständig in `historisch/2026-09-25_client-aufbau.md`, im aktiven Changelog bleibt ein Verweis.

**Tests.** Kein Test referenzierte die tote Datei. `test/village-settlement.test.ts` prüft weiter `villageOutlook()` aus `village/settlement.ts` — die Domäne bleibt, nur ihre zweite Darstellung nicht. 218 Tests grün, 37 Dateien.

**Belegt im Browser.** Ohne laufenden Dev-Server (Hintergrundprozesse überleben in dieser Sitzung nicht), daher der Produktionsbuild als eine HTML-Datei im Preview-Panel: `vite build` läuft durch, und das Bundle enthält nachweislich keine Spur des Entfernten — `village__grid`, `district__name`, `district__state`, `district__note`, `section-title`, `meter__fill`, „Noch keine Nacht gespielt", `raidOutcomeText`: je 0 Treffer, die sechs `.roster*`-Regeln vollständig vorhanden. Bei 1440×1000 genau ein `<canvas>` (2160×1500 bei 1,5-facher Pixeldichte), das Dorf unverändert mit fünf Häusern, Walkern, HUD „Frosthalde" und den drei Weltfenstern. Ein Klick auf das blaue Dach öffnet das Kontextfenster „Rathaus" (24/240) mit Tab in der Topbar. Das Gildenfenster zeigt drei Rosterzeilen (Mara, Bram, Nell) mit gemessenen Stilen: `.roster` grid, `.roster__row` flex mit 10 px Radius auf Flächenfarbe, `.roster__name` 600, `.roster__role` und `.roster__meta` 11 px. Das CSSOM des Dokuments kennt keinen Selektor `.village`, `.district`, `.meter` oder `.section-title` mehr; „Dorfblick" kommt im sichtbaren Text nicht mehr vor, der neue Satz steht im Aktion-Fenster. Keine Konsolenfehler.

**Gates:** typecheck 0, Lint 0 (8 vorbestehende Warnungen in Dateien außerhalb dieses Schritts), 218 Tests grün, LOC-Caps ok, Hygiene ok, Shinon PASS einschließlich Redundanz- und Dead-Code-Gate.

## 2026-09-27 — Der Fensterkopf bleibt beim Ziehen im Sichtfeld

**Scope:** neu `window/drag.ts`; geändert `window/window.tsx` und `test/window-routing.test.ts`. Kaskaden-Platzierung (`place()` im Store) und Resize bleiben unberührt.

**Der Befund.** `doMove` schrieb die Zeigerposition ungeklemmt in den Store. Ein Fenster, das nach oben gezogen wurde, landete bei `top: -38px`: der Kopf lag außerhalb des Sichtfelds, der Schließen-Knopf war unerreichbar, das Fenster war praktisch verloren. Nach unten war es derselbe Fall, nur nicht aufgefallen, weil der Rumpf ohnehin über den Rand darf.

**Die Klemmung.** Neu `window/drag.ts` als Nachbarfile, weil `window.tsx` mit 119 von 120 erlaubten Code-Zeilen keinen Platz hatte — statt fremde Logik zu verdichten. `clampHead` ist rein: der Kopf (40 px, gemessen an `.game-window__bar`) muss vollständig in der sichtbaren Fläche liegen, horizontal über die volle Fensterbreite, vertikal zwischen 0 und `Höhe − 40`. Der Rumpf darf weiterhin über die Kopfleiste und an den unteren Rand gezogen werden, und die Ablage beim Öffnen bleibt unangetastet. `visibleArea` liest die Fläche aus dem Dokument, weil `.app` viewportgroß ist (`height: 100dvh`, `body` ohne Scroll) — dieselbe Box, in der die Fensterkoordinaten liegen. `window.tsx` behält die DOM-Verdrahtung und ruft nur noch `draggedHead`.

**Zweiter Befund, gleiche Datei: der Schließen-Knopf des Fensters war tot.** Die Fensterleiste nimmt beim `pointerdown` den Zeiger per `setPointerCapture` an; danach gehen die Folgeereignisse einschließlich `click` an die Leiste statt an den Knopf. Ein echter Mausklick auf das Kreuz eines Fensters schloss es nie — nur der Tab in der Topbar, der keinen Capture hat. Im Browser gegengeprüft: Tab-Knopf schloss (2 Fenster → 1), Fenster-Knopf blieb wirkungslos. `isHeadControl(target)` beendet den Zug, wenn er auf einem Knopf der Leiste beginnt; damit feuert der Klick normal. Ohne diese Grenze wäre der geforderte Nachweis „Fenster schließt danach normal“ nicht erfüllbar gewesen.

**Tests.** Neu in `test/window-routing.test.ts`: Klemmung oben (y −260 → 0), unten (y 1400 → 860), rechts (x 1300 → 1110), Ziehen über die Kopfleiste und an den unteren Rand bleibt erlaubt, ein breiteres Fenster wird links verankert, der Zugweg aus Zeigerereignis und Ursprung ohne DOM, und die Grenze zwischen Zug und Knopfdruck. 217 Tests grün, davon 86 im Client.

**Belegt im Browser.** Bei 1440×1000 mit einem 330×260-Fenster: 500 px nach oben → `top: 0px`; 900 px nach unten → `top: 900px` (1000 − 40); 900 px nach rechts → `left: 920px` (1440 − 330); nach links zurück auf 20 px. Der Kopf war nach jedem Zug vollständig im Sichtfeld (`top` 1 bis 941). Kombinierter Zug 700 px rechts und 600 px über den Rand endet bei `left: 720px; top: 0px`, Kopf bei 1 px, Schließen-Knopf bei y = 7 im freien Teil der Schiene und per `elementFromPoint` treffbar — mit einem echten Mausklick geschlossen (1 Fenster → 0, Tabs 0). Keine Konsolenfehler, ein `<canvas>`.

**Gates:** typecheck 0, Lint 0, 217 Tests grün, LOC-Caps ok, Hygiene ok, Shinon PASS einschließlich Redundanz-Gate.

## 2026-09-27 — Die Topbar bricht nicht mehr um und verdeckt keinen Fensterkopf

**Scope:** `ui/styles/shell.css`. Kein Komponentenumbau, kein neues Element in der Topbar, keine Änderung an `windows.css` — die Fensterpositionierung musste nicht angefasst werden.

**Der Befund.** `.topbar` war `flex-wrap: wrap` mit `min-height: 60px`. Sobald Marke, Phasenstand, Ansichtswechsel, Fenstertabs und Ressourcen zusammen mehr Breite brauchten als der Viewport, brach die Schiene auf eine zweite Zeile und wuchs auf über 100 px. Kontextfenster werden mit festem Abstand geöffnet (`y` 82, 100, 240 aus dem Fensterstore), der Fensterkopf lag damit unter der Schiene — der Schließen-Knopf war verdeckt und die Schiene (z-index 5 über der Fensterschicht mit z-index 4) verschluckt die Klicks. Nachgemessen liegt die Schwelle nicht bei 1230 px, sondern darunter: mit drei offenen Fenstern braucht die Schiene rund 1013 px.

**Die Entscheidung: einzeilig statt variabel.** Die Höhe der Schiene am Viewport auszumessen hätte die Fensterpositionen im Store verschoben — die Kaskade (20, 28 px Versatz) und der Abstand zum oberen Rand hängen an festen Werten, und die liegen außerhalb dieses Schritts. Eine strukturell einzeilige Schiene hält die Invariante, die das ganze Fensterlayout trägt, mit drei Regeln: `flex-wrap: nowrap`; `.window-tabs` bekommt `min-width: 0` und ist damit das einzige elastische Element (es schrumpft und scrollt, statt die Schiene umzubrechen); unter 1040 px verschwindet der Markenname als erstes Opfer — Phasenstand, Ansichtswechsel, Tabs und Ressourcen sind Spielstand, die Marke nicht. Bei 730 px misst die Schiene weiterhin 62 px, der Fenstertabs ist auf 130 px zusammengezogen.

**Zusatz.** `.topbar` ist `pointer-events: none`, ihre Kinder wieder `auto`. Die transluzente Schiene ist ein Overlay; ihre Lücken geben die Klicks an die Welt weiter, damit ein unter die Schiene gezogenes Fenster dort bedienbar bleibt. Das ist die zweite Hälfte der Anforderung („darf nie darauf klicken“) und kostet keinen Eingriff in den Fensterstore.

**Belegt im Browser.** Bei 1230 px mit drei offenen Fenstern: Schiene 62 px, Fensterkopf bei 83 px, also frei. `document.elementFromPoint` in der Mitte des Schließen-Knopfes liefert den Knopf selbst — nichts liegt darüber. Fenster geöffnet, Schließen-Knopf geklickt, Fenster ist zu, der verbleibende Kopf steht bei 83 px. Gegengeprüft bei 1440 px: Schiene 62 px, eine Zeile, Marke, Phasenstand, Ansichtswechsel, Tabs und Ressourcen nebeneinander — die Optik ist unverändert. Ebenso einzeilig bei 1000 px (860 px) und 730 px.

**Gates:** typecheck 0, Lint 0, 211 Tests grün (79 im Client), Hygiene und Shinon PASS.

## 2026-09-27 — Fensterinhalt springt an den Anfang, Raid-Steuerung klebt oben

**Scope:** `window/window-layer.tsx`, `window/window.tsx`, `raid/raid-timeline.tsx`, `raid/timeline.tsx`, `ui/phase-windows.tsx`, `ui/styles/raid.css` sowie `test/window-routing.test.ts`. Neu: kein Panel, kein Fenster.

**Defekt 1 — der Scrollstand hing am Fenster.** Ein Phasenfenster behält seine ID über die Schleife hinweg (`key={win.id}` im Layer), wechselt aber seinen Inhalt. Weil der Inhaltsbereich an diesem Key hing, stand die alte Scrollposition weiter: gemessen rund 120 px von Aktion über Dungeon und Raid bis Ergebnis, also mitten im Panel und mit angeschnittener Überschrift. `window-layer.tsx` berechnet jetzt `contentSignature(node)` — die Kette der Knotentypen des Inhalts — und reicht sie als `contentKey` an das Fenster; der Inhaltsbereich hängt daran. Beim Wechsel wird der Bereich neu aufgebaut und beginnt oben. Die VNode-Identität taugt dafür nicht, sie ist bei jedem Render neu; die Typkette ist für denselben Inhalt stabil. Ein Test hält fest, dass drei Phasen bei einer ID drei verschiedene Signaturen liefern und derselbe Inhalt zweimal dieselbe.

**Defekt 2 — die Steuerung lag hinter 3000 px Trail.** Das Raidfenster ist 260 px hoch, der Inhalt der Timeline über 3000 px; Scrubber, Phasen-Navigation und Play/Pause standen am Ende der Spalte und waren genau dann unerreichbar, wenn der Lauf laufen sollte. Der Fensterkopf war als Träger geprüft und verworfen: er ist reiner Drag-Griff mit Pointer-Capture, und `WindowLayer` hat keinen Slot für Kopf-Inhalte — ihn zu geben hätte einen Aufrufer außerhalb des Fenstersystems gebraucht. Stattdessen liegt die Steuerung jetzt als `TimelineTransport` über dem Fensterinhalt und ist über `.timeline-scrubber { position: sticky; top: -12px }` am Oberkant gepinnt, mit eigenem Hintergrund und überbrücktem Padding. `RaidTimeline` hält Phasen-Navigation und die drei Abschnitte; das Scrubbing liegt als `scrubTo` in einer Hand für beide. Am Raid-Panel wurde nichts geändert.

**Belegt im Browser, im Dorf.** Raidfenster 3876 px Inhalt in 219 px Sicht: Steuerung bei Scrollstand 0 vollständig im Fenster, bei 1500 px und 2400 px klebend am Oberkant (gemessen `scrubberTop === bodyTop`). Pause bei 2400 px geklickt: `aria-label` kippt auf „Wiedergabe fortsetzen“, der Tick friert bei 100/225 ein und bleibt über 1,5 s stehen. Scrollreset zweimal belegt: 1500 px → „Auftrag rechnen“ → Ergebnis mit `scrollTop 0` und vollständig sichtbarer Überschrift; Ergebnis → „Nächsten Tag beginnen“ → Aktion ebenfalls 0 px. Durchgehend ein `<canvas>`, keine Konsolenfehler.

**Gates:** typecheck 0, Lint 0, 209 Tests grün (79 im Client, zwei neu in `window-routing.test.ts`), Shinon PASS. Der LOC-Gate hat `window/window.tsx` nach der Ergänzung über das Cap gehoben (124 gegen 120 Code-Zeilen); `ResizeOrigin` ist jetzt `MoveOrigin & { width, height }` — dieselbe Aussage, ein Interface weniger.

## 2026-09-27 — Raid-Replay gehört dem Raid, nicht der Szene

**Scope:** neu `raid/combat-source.ts`; `showcase/combat-source.ts` entfallen. Geändert: `showcase/scene.ts`, `raid/playback.ts`, `raid/raid-panel.tsx`, `village/phase-actions.ts`, `ui/world-host.tsx` sowie `test/raid-playback-wiring.test.ts` und `test/raid-timeline.test.ts`.

**Der Befund.** `playbackLog` wurde ausschließlich von `showcase/combat-source.ts` gesetzt, und das nur beim Aufbau der Dungeon-Szene. Im Dorf — der Standardansicht — war der Store deshalb leer: `RaidTimeline` gab `null` zurück, und das Panel sagte dauerhaft, der vollständige Log werde „hier nicht angezeigt". Die Raid-Phase endete im Dorf in einem toten Endpunkt, ohne jeden Hinweis auf den nötigen Blickwechsel. Derselbe Besitzer trieb auch den Tick: ohne Dungeon-Szene gab es keine Uhr.

**Die Korrektur.** Der Log wandert in das Raid-Fach. `raid/combat-source.ts` ist der einzige Schreibpfad: `buildCombatLog` rechnet denselben Core-Aufruf wie bisher, `loadRaidLog` legt das Ergebnis in den Store und `unloadRaidLog` räumt ihn mit dem Tag auf. Ausgelöst wird das vom Raid-Lebenszyklus selbst — `triggerRaid` lädt, `finishResult` räumt auf, ein gescheiterter Auftrag lässt den Lauf weiterlaufen. Ein Effekt hält den Log mit dem Grid synchron, weil das Grid im Raid-Editor noch löschbar ist; ohne geladenen Log rechnet der Editor keinen Kampf vor. Die Takt-Rate kommt jetzt aus dem geladenen Log statt aus dem Aufrufer, damit kein Zweitleser sie pflegt.

**Der Takt.** `stepPlayback(deltaMs)` hängt am Runtime-Ticker in `ui/world-host.tsx`, nicht an der lebenden Szene. `showcase/scene.ts` liest Log und Tick im Raid-Modus nur noch aus dem Store und zeigt im Editor-Modus wieder die Leerlaufbesetzung der Route — genau die Aufgabe, die `visual/route-actors.ts` seit jeher beschreibt. Damit läuft ein Replay im Dorf wie im Dungeon, ohne dass die Ansicht umschaltet und ohne eine zweite Quelle für Tick-Daten.

**Belegt im Browser, nicht im Test.** Vollständiger Pfad Tag 18 → Nacht → Raid im **Dorf** gehalten: Die Timeline erscheint im Kontextfenster, der Tick läuft 60 → 219 → über 255 in den nächsten Durchlauf, Pause friert bei 40 ein, „Kampf-Phase" springt auf Tick 83, „Auftrag rechnen" liefert denselben Hash `94ba1954` wie aus dem Dungeon, und mit „Nächsten Tag beginnen" verschwindet der Log (Tag 19, Panel „Die Nacht vorbereiten", keine Rest-Timeline). Durchgehend genau ein `<canvas>`, `data-render-mode` bleibt `village` — kein stilles Umschalten. Die Gegenprobe im Dungeon: Editor zeigt Helden am Start und Boss am Ziel, der Raid-Modus rendert weiter den Kampf bei laufender Timeline. Keine Konsolenfehler.

**Gates:** typecheck 0, Lint 0 Fehler, 209 Tests grün (77 im Client, davon 10 in der Verdrahtung und 2 in der Log-Quelle), LOC-Caps und Shinon ohne Befund.

## 2026-09-27 — Dashboard abgebaut: eine lebende Welt mit kontextuellen Fenstern

**Scope:** `render/village-layout.ts`, `village-atlas.ts`, `village-scene.ts`, `village-view.ts`, `camera.ts`, `camera-controls.ts`, `layer-sprite.ts`, `runtime.ts` und `ui/world-host.tsx`, `ui/scene-switch.ts`, `ui/window-launcher.tsx`, `ui/window-tabs.tsx`, `ui/building-label.ts`, `ui/stage.tsx`, `ui/topbar.tsx` sowie die Styles. `ui/sidebar.tsx` und `ui/window-tools.tsx` sind entfallen. Neu: `test/world-presentation.test.ts` und `test/window-routing.test.ts`.

**Ein Canvas, eine Runtime.** Vorher gab es zwei Pixi-Besitzer und zwei dargestellte Dörfer. Jetzt erzeugt `ui/world-host.tsx` genau einen Host und genau eine `createVisualRuntime`; `ui/scene-switch.ts` hält genau eine lebende Szene und baut beim Blickwechsel die andere auf, ohne Runtime oder Canvas anzufassen. Editor und Raid teilen sich die Dungeon-Szene, das Dorf hängt seine Animation über `runtime.onTick` an denselben Ticker. Im Browser über vier Blickwechsel geprüft: jedes Mal genau ein `<canvas>`.

**Die Welt ist die Navigation.** Die Dorfszene ist eine 1000×640 große Pixelkarte mit anklickbaren Gebäuden, Bäumen und deterministisch laufenden Bewohnern; `fitCamera` rahmt sie, `render/camera-controls.ts` schwenkt und zoomt auf dem Canvas. Hinter dem Weltrechteck liegt eine `TilingSprite`-Wiese, damit breite Viewports keinen schwarzen Rand zeigen. Ein Klick auf ein Gebäude öffnet ein transluzentes Kontextfenster mit sprechendem Namen — `Rathaus`, nicht `hall`. Der Dorfblick bleibt Präsentation: kein Dorfzustand, keine Wirtschaftsregel.

**Kontextfenster statt Dashboard.** Die Sidebar ist gelöscht. `ui/window-launcher.tsx` ist die einzige Startrampe und liegt als transluzente Schiene über der Welt, `ui/window-tabs.tsx` führt die offenen Fenster in der Topbar zurück. Die Fenster-Registry staffelt neue Fenster, damit nichts deckungsgleich startet. Das Phasenfenster behält seine ID über die Schleife hinweg und zieht seinen Titel bei jedem Phasenwechsel nach — geprüft über `Tag → Nacht`. Doppelte Phasen- und Editor-Launcher in der Topbar sind entfallen; Fenster tragen nur noch Titel, Focus und Z-Order.

**Gates:** `pnpm run -s typecheck`, `pnpm test -- --run` (37 Dateien, 204 Tests), `pnpm run -s lint` (0 Fehler, 8 Baseline-Warnungen in nicht angefassten Dateien), `node scripts/shinon/engine.mjs --full` und `pnpm --filter @floor/client build` sind grün. Drei Gate-Verstöße aus dem Umbau wurden behoben: LOC-Cap in `world-host.tsx` (Szenenwechsel nach `scene-switch.ts`) und `runtime.ts` (Rahmung nach `fitCamera`), Redundanz zwischen `editor-grid.ts` und `lighting.ts` (gemeinsamer `layer-sprite.ts`).

**Abnahme:** Im Browser geprüft — ein Canvas, Dorf mit laufenden Bewohnern, Gebäudeklick öffnet das richtige Fenster, Tag → Nacht zieht den Fenstertitel nach, Blickwechsel in beide Richtungen, Pan und Zoom, keine Konsolenfehler. **Offen:** Auf hohen Viewports bleibt das Dorfbild oben und unten von Wiese umgeben, weil die Karte querformat ist; Wirtschaft, Expeditionen und ein dauerhaft gepflegter Dorfblick bleiben T2.

## 2026-09-26 — Oberflächen-Rebase: Raid-Timeline und Editor-Sichtbarkeit erhalten

Der UI-Slice wurde per Rebase auf den aktuellen `main` gezogen, weil er fünf Commits und zwei Toolchain-Migrationen zurücklag und deshalb allein rot war. Die Konflikte waren nicht mechanisch, deshalb ist das Ergebnis dokumentiert.

**Die Raid-Timeline war der eigentliche Verlust.** Der Branch kannte die Timeline nicht: `sidebar.tsx` montierte sie nicht, und die sechzehn Timeline-Regeln aus `styles.css` fehlten im aufgeteilten Stylesheet. `sidebar.tsx` rendert sie jetzt in der Raid-Phase über dem Raid-Panel, und die Regeln sind nach `styles/raid.css` überführt. Die Selektormenge wurde gegen `main` geprüft: alle fünfzehn Timeline-Selektoren sind vorhanden, es fehlt keiner.

**Der Editor bleibt an die Phase gebunden.** Der Branch koppelte das Editorwerkzeug zusätzlich an den Dungeon-Blick, obwohl sein eigener Kommentar das Gegenteil behauptet. Übernommen ist die phase-gebundene Variante aus `main`, damit die im Browser abgenommene T1.2-Schleife nicht stillschweigend verliert, dass der Editor in Nacht und Raid offen ist. Der ungenutzte `stageView`-Import ist damit entfallen.

**Der Domain-Barrel ist eine Vereinigung.** `village/index.ts` exportiert jetzt die Phase-Owner aus `main` und die Settlement-Typen des Branches gemeinsam; `settlement.ts` bleibt die reine Funktion des Dorfblicks und trägt weiterhin keine Wirtschaftsregel.

**Was bewusst offen bleibt.** Die Klassenbindung `app is-day` aus `main` ist nicht wiederhergestellt: Die Shell des Branchs kennt bewusst keine Phase, und sie zurückzuholen hieße, genau die Entkopplung wieder aufzubrechen, die der Slice herstellt. Das ist eine Design-Entscheidung und als offener Punkt in `docs/ROADMAP.md` vermerkt. Die Browser-Abnahme steht weiterhin aus.

## 2026-09-26 — Oberfläche modularisiert, Dorfblick und Blickumschalter ergänzt

**Scope:** `packages/client/src/ui/` vollständig umgebaut, `src/village/settlement.ts` neu, `src/raid/panel.tsx` um `raidOutcomeText` erweitert, `test/village-settlement.test.ts` und `test/stage-view.test.ts` neu.

**Befund:** Das „Dashboard" war eine offene Label-Wert-Liste mit vier Fixture-Konstanten, der Viewport zeigte in jeder Phase das Dungeon-Raster, und der Drag-Status zeigte rohe Kennungen mit Zellkoordinaten in der Sidebar. `styles.css` war eine 630-zeilige Datei mit drei erfundenen Panel-Optiken und totem `is-night`-Theming, das die Shell nie setzte. `shell.tsx` stand bei 96 von erlaubten 120 LOC, hatte also keinen Raum für Feature-Arbeit.

**Der Dorfblick:** `village/settlement.ts` leitet aus dem Phase-Owner und den Fixture-Daten Gebiete (Rathaus, Gilde, Verteidiger-Gehege), das Gildenroster und die Bilanz der letzten Nacht ab. Es ist eine reine Funktion ohne eigenen Dorfzustand und ohne Wirtschaftsregel: Arbeiterverteilung, Gold-Ausgaben, Landkauf und Beute-Verkauf bleiben T2. Die Startbasis aus `fixture.workers` und `fixture.attractiveness` ist in der Oberfläche ausdrücklich als Startbasis gekennzeichnet, damit nichts als veränderlich ausgegeben wird, was es nicht ist. Die Karte für das Gehege zeigt eine echte Belegung; Lebensbalken gibt es nur dort, wo etwas zählbar belegt ist, keine Hochrechnung ohne Maximum.

**Blick statt Phasenlogik:** `ui/view.ts` hält `stageView` (`village | dungeon`) als Navigation, nicht als Spielzustand. Die Topbar schaltet um, ohne Phase oder Grid zu berühren — `test/stage-view.test.ts` pinnt genau das. Der Dungeon-Host wird beim Wechsel neu aufgebaut, weil Preact ihn genau einmal mountet; der Fensterlayer liegt außerhalb der Auswahl, damit offene Fenster den Blickwechsel überleben. Das Editorwerkzeug erscheint nur im Dungeon-Blick, seine Bau-Erlaubnis kommt weiter aus der Phase.

**Modularisierung:** Die Shell ist reines Layout und kennt keine Phase. `topbar`, `stage`, `sidebar`, `view-switch`, `window-tools`, `window-content`, `village-view`, `roster-list`, `stats` und `actor-label` haben je einen Job. `roster-list` und `stats` sind geteilte Darstellungskomponenten statt Kopiervorgänge — der Redundancy-Gate hatte eine zweite Heldenstruktur zu Recht angemahnt, der Typ kommt jetzt einmal aus `fixture-data`. `styles.css` ist durch `styles/` mit acht Modulen ersetzt, eingebunden über `styles/index.css`; alle Panels, Fenster und das Editorraster benutzen dieselben Flächen-, Kanten- und Tiefen-Tokens.

**Ausgabe-Korrektheit:** Interne Kennungen erscheinen nicht mehr im Bildschirm — Fenster tragen `Mara` statt `hero-mara`, der Werkzeugstatus meldet `Frost 2 → Feld 3,4`. Die Sidebar zeigt je Phase nur Auftrag und Hauptaktion; der Standort selbst steht im Dorfblick, damit er nicht als Wertetabelle nebenbei existiert. Ergebnis- und Fehlertext kommen über `raidOutcomeText` aus einer Quelle, damit Panel und Dorfblick nicht getrennt formulieren.

**Verifikation:** `pnpm run -s typecheck`, `pnpm test -- --run` (28 Dateien, 148 Tests) und `pnpm run -s check` sind grün, der Vite-Build löst die Style-Kette vollständig auf. **Offen:** Die Abnahme im Browser steht aus — in dieser Umgebung gibt es weder Chrome noch ein DOM-Testsetup, die neue Oberfläche ist also nicht am Bildschirm gesehen worden. Grüne Gates belegen Korrektheit, nicht das Aussehen.

## 2026-09-26 — Raid-Timeline verdrahtet

Die Timeline war gebaut, aber nicht angeschlossen: `ui/shell.tsx` hat sie nie gerendert, `showcase/scene.ts` hat einen eigenen `playback`-Zähler geführt, und für die elf Klassen der Timeline gab es kein CSS. Die Shell rendert jetzt `<RaidTimeline />` in der Raid-Phase neben dem Probelauf-Panel; `styles.css` trägt die elf Klassen `raid-timeline`, `timeline-phase-nav`, `timeline-phase-step`, `timeline-scrubber`, `timeline-scrub-step`, `timeline-scrub-readout`, `timeline-phase`, `timeline-trail`, `timeline-clusters`, `timeline-cluster-type`, `timeline-facts` und `timeline-hint` in den bestehenden Farbtokens.

Der zweite Teil war wichtiger als der erste. Die Szene hat den Tick lokal über `playback += deltaMs / (1000 / tickRate)` fortgeschrieben und dabei `stepPlayback` sowie `playbackPaused` ignoriert; ein Scrubber-Stand wäre sofort wieder überschrieben worden, die Anzeige wäre wirkungslos gewesen. `scene.ts` ruft jetzt `stepPlayback` auf und lässt den Store den Tick halten. Die Routenposition liest `playbackRouteIndex` und fällt nur dann auf die Helmenposition des Observers zurück, wenn noch kein Log vorliegt; damit ist der bisher ungenutzte Store-Wert an der Stelle verdrahtet, für die sein Kommentar ihn vorsah.

`test/raid-timeline.test.ts` deckt die Verdrahtung jetzt ab: ohne Log steht der Tick, im Spiel läuft er, ein gesetzter Scrubber-Stand wird übernommen und läuft ohne Pause weiter, mit Pause bleibt er exakt stehen, und die Routenposition folgt dem Scrubber-Tick statt der Helmenposition.

## 2026-09-26 — Render-Animation ohne Sinus vereinheitlicht

`render/animation.ts` nutzt jetzt eine glatte deterministische Periodik für Bob, Schritt, Squash und Schwanken; `render/actors.ts` verwendet denselben Kurven-Owner für die Schritthöhe. Ein Regressionstest prüft Wiederholbarkeit, Periodengrenzen, Wertebereiche und bisherige Amplituden.

## 2026-09-26 — Route-Mapping und Actor-Varianten vereinheitlicht

`visual/route-index.ts` ist die einzige boundsafe Abbildung von Combat-/FX-Indizes auf den bestehenden `route.path`; Actor-Frame, Event-FX und Leerlaufbesetzung verwenden dieselbe Funktion. `visual/variant.ts` liefert für beide Actor-Pfade dieselbe deterministische, ID-basierte Variante. Damit ist die zuvor abweichende positionsbasierte Editor-Variante beseitigt. Tests decken Grenzindizes, leeren Pfad und Variantenkonsistenz ab.

## 2026-09-26 — Showcase-Optik auf Materialrelief, Route und Charaktere gehoben

Der Foundation-Stand rendert jetzt aus deterministischen Materialtexturen differenzierte Bodenkacheln und Wände mit Deckplatte, sichtbarer Frontfläche, Kantenlicht und Schatten, statt die Wandtextur nur in die Höhe zu strecken. `render/route.ts` zeigt `route.path` als warme, leuchtende Marker und hebt die aktuelle Position eines Helden hervor; es speichert keine eigene Grid- oder Route-Wahrheit und legt Marker in dieselbe depth-sortierte Welt-Ebene. Die prozeduralen Actor-Silhouetten unterscheiden Held, Monster und Boss über Farben und Formen, und die Blickrichtung folgt `facing`. Die globale UI-Haut in `src/ui/styles.css` hat eine passende Dungeon-Palette, gerahmten Viewport, lesbare Panels, sichtbare Fokuszustände und ein mobiles Layout bekommen.

Der Atlas wurde entlang seiner Zuständigkeiten geteilt: `render/canvas.ts` besitzt Canvas/Textur-Helfer, `render/tile-atlas.ts` Boden-/Mauertexturen, `render/route-atlas.ts` Route-Lichter, `render/actor-atlas.ts` Silhouetten und `render/atmosphere-atlas.ts` Glow/Vignette. `visual/fx-seed.ts` erzeugt aus allen relevanten Combat-Event-Feldern einen stabilen Präsentationsseed; `render/fx.ts` leitet die Partikelvariation je Effekt/Partikel daraus ab, statt von einem fortlaufenden Emissions-RNG abhängig zu sein. `test/visual-foundation.test.ts` pinnt die stabile Seed-Ableitung und bestehende Route-/Observer-Grenzen.

Der Render-/Visual-Code bleibt innerhalb der Ownership-Caps: Actor-Frame, Event-FX und Leerlauf-Route-Akteure liegen in eigenen kleinen Modulen statt einer großen Sammeldatei.

## 2026-09-26 — Modularer Schnitt für Atlas und Combat-Visuals

`render/atlas.ts` bleibt als Barrel; Actor-Silhouetten, Atmosphärentexturen, Boden-/Wandtexturen und Routenleuchten liegen separat in `actor-atlas.ts`, `atmosphere-atlas.ts`, `tile-atlas.ts` und `route-atlas.ts`. Im Pixi-freien `visual`-Owner sind `combatActors`, `eventFx`, `fxSeed` und die Leerlaufroute in eigenständige Dateien getrennt. Das hält die strengen Dateien-Caps ein und isoliert jeweilige Darstellungsjobs, ohne neue Raum- oder Grid-Owner einzuführen.

## 2026-09-26 — T1.2: Tag/Nacht/Raid-Schleife als geschlossener Fixture-Loop

- `src/village/` neu: `phase.ts` hält die Phase-Union in Schleifenreihenfolge, die erlaubten Übergänge und die reine Entscheidungsfunktion `resolvePhaseTransition`; `state.ts` besitzt das DayNightState-Signal (`phase`, `day`, `job`) mit `setPhase` als einzigem Schreibpfad und Job-Aufnahme nur aus der Raid-Phase; `phase-actions.ts` liefert `startNight`, `triggerRaid`, `completeRaid`, `finishResult` und `retryAfterResult`. Der Store ist Preact-Signals, keine externe Lib. `result → tag` zählt den Tag hoch und löscht den Auftrag, `result → raid` ist der deterministische Retry.
- `src/raid/raid-panel.tsx` ist auf Props umgestellt (`onJob`), die Ergebnis-Darstellung liegt als reine Sicht `RaidResultView` in `src/raid/panel.tsx`. Damit führt die Schleife das terminale TerminalRaidJob in die Result-Phase, statt dass das Panel einen eigenen Laufzustand neben dem Store hält.
- `src/ui/phase-badge.tsx` und `src/ui/phase-panels.tsx` neu, `src/ui/shell.tsx` liest die Phase aus dem Store statt aus `useState`: Tag zeigt Dorf-Basisdaten aus den Fixture-Ressourcen und „Nacht starten“, Nacht hält Editor und Controls aktiv und schaltet über „Raid auslösen“, Raid reicht das Core-Ergebnis über `completeRaid` in die Result-Phase, Result zeigt Auftrag und Urteil mit „Nächsten Tag beginnen“ oder „Erneut versuchen“. Der Editor bleibt in Nacht und Raid sichtbar, damit eine blockierte Route vor dem Retry reparierbar bleibt. `src/ui/styles.css` um Badge und Phase-Panel ergänzt.
- `test/village-phase.test.ts` neu: Reihenfolge, Skip-Verbot, Tag-Zähler, Retry-Nachfolge und Job-Aufnahme nur aus der Raid-Phase. `test/day-night-loop.test.ts` neu: voller Loop mit Fake-Timern (nur `setTimeout`/`clearTimeout`, die Uhr bleibt messbar), Sieg- und Fehlschlagpfad, dreifacher Wiederholungsloop mit identischem Hash und Zeitbudget unter 5 s; `afterEach` verlangt einen leeren Timer-Zähler. Im Browser wurde der Loop End-to-End durchgeklickt: Tag 18 → Nacht → Raid → Ergebnis `fixture-raid-1` → Tag 19.

## 2026-09-26 — Client-Stringmatrix auf Trail-v3 nachgezogen

- `docs/STRINGMATRIX.md`: Der Eintrag `raid/trail` behauptete weiterhin, der Combat-Log trage keinen Trail-Hash und die Anzeige nutze `route.path`. Das widersprach dem T1.1-Stand, den `test/raid-job.test.ts` bereits festschreibt. Seit T1.1 trägt `CombatLog.trail` je Schritt `x/y/cell` und `fingerprintCombatLog` hasht den vollständigen Trail; der Eintrag beschreibt jetzt genau das statt der überholten Lücke.

## 2026-09-26 — Review-Nachgang: stiller Testdurchlauf entschärft

- `test/raid-job.test.ts`: vier Tests sprangen bei einem nicht abgeschlossenen Auftrag mit `return` heraus und waren dann grün, ohne die Hash-Aussage überhaupt zu treffen. Vor jeder Weiche steht jetzt ein explizites `expect(status).toBe('completed')` beziehungsweise `('failed')`; der Guard bleibt nur noch für die Typverengung. Der Trailtest, der genau die T1.1-Absicherung zeigt, kann damit nicht mehr stillschweigend durchlaufen.

## 2026-09-25 — Drei Review-Findings behoben: Kamera, Drag-Slop, Raid-Panel

- `src/render/runtime.ts` rechnete die World-to-Screen-Matrix ein zweites Mal. `applyCamera` holt den Container-Ursprung jetzt über `worldToScreen` aus `camera.ts`; die Regel „genau eine Transformation" ist damit im Code und nicht nur in der Doku gültig.
- `src/input/drag.ts` aktivierte den Drag bei jedem Pointer-Down. Dadurch war jeder Klick auf einen Actor gleichzeitig ein Drop, und der Klickpfad zum Kontextfenster lief nie. Ein Down registriert jetzt nur noch einen Kandidaten; erst eine Bewegung über den Slop macht daraus einen aktiven Zug.
- `src/input/drag-target.ts` neu: `resolveTarget`, `passedSlop`, `advance` und `dropCommand` kapseln Trefferauflösung und Zwischenzustand eines Drags.
- `src/showcase/controls.ts` entscheidet die Geste erst nach dem Slop: auf einem Actor ein Drag, sonst ein Pan, ohne Weg ein Klick.
- `src/ui/shell.tsx` rendert `src/raid/raid-panel.tsx` wieder. Der lokale Fixture-Raid ist damit im Browser auslösbar.
- `src/ui/styles.css` ergänzt die Klassen des Raid-Panels aus den vorhandenen Tokens.
- `test/input-drag.test.ts` belegt, dass ein Down ohne Weg keinen Drop erzeugt, ein Zug erst nach dem Slop aktiv wird und außerhalb des Greifradius kein Kandidat entsteht.


Die Einträge der ersten Stunden stehen in `historisch/2026-09-25_client-aufbau.md`.
