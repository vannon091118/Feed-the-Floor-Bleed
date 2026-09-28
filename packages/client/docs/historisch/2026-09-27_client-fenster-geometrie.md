# packages/client/docs/historisch/2026-09-27_client-fenster-geometrie.md — Fenstergeometrie: Kopfklemme, Topbar, Fensterinhalt

Abgelegt aus `packages/client/docs/CHANGELOG.md` am 2026-09-28, weil der aktive Changelog an die 200-Zeilen-Cap kam. Inhaltlich unverändert.

## 2026-09-27 — Der Fensterkopf bleibt beim Ziehen im Sichtfeld

**Scope:** neu `window/drag.ts`; geändert `window/window.tsx` und `test/window-routing.test.ts`. Kaskaden-Platzierung (`place()` im Store) und Resize bleiben unberührt.

**Der Befund.** `doMove` schrieb die Zeigerposition ungeklemmt in den Store. Ein Fenster, das nach oben gezogen wurde, landete bei `top: -38px`: der Kopf lag außerhalb des Sichtfelds, der Schließen-Knopf war unerreichbar, das Fenster war praktisch verloren. Nach unten war es derselbe Fall, nur nicht aufgefallen, weil der Rumpf ohnehin über den Rand darf.

**Die Klemmung.** Neu `window/drag.ts` als Nachbarfile, weil `window.tsx` mit 119 von 120 erlaubten Code-Zeilen keinen Platz hatte — statt fremder Logik zu verdichten. `clampHead` ist rein: der Kopf (40 px, gemessen an `.game-window__bar`) muss vollständig in der sichtbaren Fläche liegen, horizontal über die volle Fensterbreite, vertikal zwischen 0 und `Höhe − 40`. Der Rumpf darf weiterhin über die Kopfleiste und an den unteren Rand gezogen werden, und die Ablage beim Öffnen bleibt unangetastet. `visibleArea` liest die Fläche aus dem Dokument, weil `.app` viewportgroß ist (`height: 100dvh`, `body` ohne Scroll) — dieselbe Box, in der die Fensterkoordinaten liegen. `window.tsx` behält die DOM-Verdrahtung und ruft nur noch `draggedHead`.

**Zweiter Befund, gleiche Datei: der Schließen-Knopf des Fensters war tot.** Die Fensterleiste nimmt beim `pointerdown` den Zeiger per `setPointerCapture` an; danach gehen die Folgeereignisse einschließlich `click` an die Leiste statt an den Knopf. Ein echter Mausklick auf das Kreuz eines Fensters schloss es nie — nur der Tab in der Topbar, der keinen Capture hat. Im Browser gegengeprüft: Tab-Knopf schloss (2 Fenster → 1), Fenster-Knopf blieb wirkungslos. `isHeadControl(target)` beendet den Zug, wenn er auf einem Knopf der Leiste beginnt; damit feuert der Klick normal. Ohne diese Grenze wäre der geforderte Nachweis „Fenster schließt danach normal" nicht erfüllbar gewesen.

**Tests.** Neu in `test/window-routing.test.ts`: Klemmung oben (y −260 → 0), unten (y 1400 → 860), rechts (x 1300 → 1110), Ziehen über die Kopfleiste und an den unteren Rand bleibt erlaubt, ein breiteres Fenster wird links verankert, der Zugweg aus Zeigerereignis und Ursprung ohne DOM, und die Grenze zwischen Zug und Knopfdruck. 217 Tests grün, davon 86 im Client.

**Belegt im Browser.** Bei 1440×1000 mit einem 330×260-Fenster: 500 px nach oben → `top: 0px`; 900 px nach unten → `top: 900px` (1000 − 40); 900 px nach rechts → `left: 920px` (1440 − 330); nach links zurück auf 20 px. Der Kopf war nach jedem Zug vollständig im Sichtfeld (`top` 1 bis 941). Kombinierter Zug 700 px rechts und 600 px über den Rand endet bei `left: 720px; top: 0px`, Kopf bei 1 px, Schließen-Knopf bei y = 7 im freien Teil der Schiene und per `elementFromPoint` treffbar — mit einem echten Mausklick geschlossen (1 Fenster → 0, Tabs 0). Keine Konsolenfehler, ein `<canvas>`.

**Gates:** typecheck 0, Lint 0, 217 Tests grün, LOC-Caps ok, Hygiene ok, Shinon PASS einschließlich Redundanz-Gate.

## 2026-09-27 — Die Topbar bricht nicht mehr um und verdeckt keinen Fensterkopf

**Scope:** `ui/styles/shell.css`. Kein Komponentenumbau, kein neues Element in der Topbar, keine Änderung an `windows.css` — die Fensterpositionierung musste nicht angefasst werden.

**Der Befund.** `.topbar` war `flex-wrap: wrap` mit `min-height: 60px`. Sobald Marke, Phasenstand, Ansichtswechsel, Fenstertabs und Ressourcen zusammen mehr Breite brauchten als der Viewport, brach die Schiene auf eine zweite Zeile und wuchs auf über 100 px. Kontextfenster werden mit festem Abstand geöffnet (`y` 82, 100, 240 aus dem Fensterstore), der Fensterkopf lag damit unter der Schiene — der Schließen-Knopf war verdeckt und die Schiene (z-index 5 über der Fensterschicht mit z-index 4) verschluckte die Klicks. Nachgemessen liegt die Schwelle nicht bei 1230 px, sondern darunter: mit drei offenen Fenstern braucht die Schiene rund 1013 px.

**Die Entscheidung: einzeilig statt variabel.** Die Höhe der Schiene am Viewport auszumessen hätte die Fensterpositionen im Store verschoben — die Kaskade (20, 28 px Versatz) und der Abstand zum oberen Rand hängen an festen Werten, und die liegen außerhalb dieses Schritts. Eine strukturell einzeilige Schiene hält die Invariante, die das ganze Fensterlayout trägt, mit drei Regeln: `flex-wrap: nowrap`; `.window-tabs` bekommt `min-width: 0` und ist damit das einzige elastische Element (es schrumpft und scrollt, statt die Schiene umzubrechen); unter 1040 px verschwindet der Markenname als erstes Opfer — Phasenstand, Ansichtswechsel, Tabs und Ressourcen sind Spielstand, die Marke nicht. Bei 730 px misst die Schiene weiterhin 62 px, der Fenstertab ist auf 130 px zusammengezogen.

**Zusatz.** `.topbar` ist `pointer-events: none`, ihre Kinder wieder `auto`. Die transluzente Schiene ist ein Overlay; ihre Lücken geben die Klicks an die Welt weiter, damit ein unter die Schiene gezogenes Fenster dort bedienbar bleibt. Das ist die zweite Hälfte der Anforderung („darf nie darauf klicken“) und kostet keinen Eingriff in den Fensterstore.

**Belegt im Browser.** Bei 1230 px mit drei offenen Fenstern: Schiene 62 px, Fensterkopf bei 83 px, also frei. `document.elementFromPoint` in der Mitte des Schließen-Knopfes liefert den Knopf selbst — nichts liegt darüber. Fenster geöffnet, Schließen-Knopf geklickt, Fenster ist zu, der verbleibende Kopf steht bei 83 px. Gegengeprüft bei 1440 px: Schiene 62 px, eine Zeile, Marke, Phasenstand, Ansichtswechsel, Tabs und Ressourcen nebeneinander — die Optik ist unverändert. Ebenso einzeilig bei 1000 px (860 px) und 730 px.

**Gates:** typecheck 0, Lint 0, 211 Tests grün (79 im Client), Hygiene und Shinon PASS.

## 2026-09-27 — Fensterinhalt springt an den Anfang, Raid-Steuerung klebt oben

**Scope:** `window/window-layer.tsx`, `window/window.tsx`, `raid/raid-timeline.tsx`, `raid/timeline.tsx`, `ui/phase-windows.tsx`, `ui/styles/raid.css` sowie `test/window-routing.test.ts`. Neu: kein Panel, kein Fenster.

**Defekt 1 — der Scrollstand hing am Fenster.** Ein Phasenfenster behält seine ID über die Schleife hinweg (`key={win.id}` im Layer), wechselt aber seinen Inhalt. Weil der Inhaltsbereich an diesem Key hing, stand die alte Scrollposition weiter: gemessen rund 120 px von Aktion über Dungeon und Raid bis Ergebnis, also mitten im Panel und mit angeschnittener Überschrift. `window-layer.tsx` berechnet jetzt `contentSignature(node)` — die Kette der Knotentypen des Inhalts — und reicht sie als `contentKey` an das Fenster; der Inhaltsbereich hängt daran. Beim Wechsel wird der Bereich neu aufgebaut und beginnt oben. Die VNode-Identität taugt dafür nicht, sie ist bei jedem Render neu; die Typkette ist für denselben Inhalt stabil. Ein Test hält fest, dass drei Phasen bei einer ID drei verschiedene Signaturen liefern und derselbe Inhalt zweimal dieselbe.

**Defekt 2 — die Steuerung lag hinter 3000 px Trail.** Das Raidfenster ist 260 px hoch, der Inhalt der Timeline über 3000 px; Scrubber, Phasen-Navigation und Play/Pause standen am Ende der Spalte und waren genau dann unerreichbar, wenn der Lauf laufen sollte. Der Fensterkopf war als Träger geprüft und verworfen: er ist reiner Drag-Griff mit Pointer-Capture, und `WindowLayer` hat keinen Slot für Kopf-Inhalte — ihn zu geben hätte einen Aufrufer außerhalb des Fenstersystems gebraucht. Stattdessen liegt die Steuerung jetzt als `TimelineTransport` über dem Fensterinhalt und ist über `.timeline-scrubber { position: sticky; top: -12px }` am Oberkant gepinnt, mit eigenem Hintergrund und überbrücktem Padding. `RaidTimeline` hält Phasen-Navigation und die drei Abschnitte; das Scrubbing liegt als `scrubTo` in einer Hand für beide. Am Raid-Panel wurde nichts geändert.

**Belegt im Browser, im Dorf.** Raidfenster 3876 px Inhalt in 219 px Sicht: Steuerung bei Scrollstand 0 vollständig im Fenster, bei 1500 px und 2400 px klebend am Oberkant (gemessen `scrubberTop === bodyTop`). Pause bei 2400 px geklickt: `aria-label` kippt auf „Wiedergabe fortsetzen“, der Tick friert bei 100/225 ein und bleibt über 1,5 s stehen. Scrollreset zweimal belegt: 1500 px → „Auftrag rechnen“ → Ergebnis mit `scrollTop 0` und vollständig sichtbarer Überschrift; Ergebnis → „Nächsten Tag beginnen“ → Aktion ebenfalls 0 px. Durchgehend ein `<canvas>`, keine Konsolenfehler.

**Gates:** typecheck 0, Lint 0, 209 Tests grün (79 im Client, zwei neu in `window-routing.test.ts`), Shinon PASS. Der LOC-Gate hat `window/window.tsx` nach der Ergänzung über das Cap gehoben (124 gegen 120 Code-Zeilen); `ResizeOrigin` ist jetzt `MoveOrigin & { width, height }` — dieselbe Aussage, ein Interface weniger.

**Gates:** typecheck 0, Lint 0 Fehler, 209 Tests grün (77 im Client, davon 10 in der Verdrahtung und 2 in der Log-Quelle), LOC-Caps und Shinon ohne Befund.
