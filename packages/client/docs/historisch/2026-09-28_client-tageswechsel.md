## 2026-09-28 — Der Tageswechsel ist eine Blende, kein Gradiententausch

**Der Befund.** Der Überzug deklarierte `transition: background 900ms`, und der Wechsel sprang trotzdem. Chromium interpoliert keinen Gradienten, es tauscht ihn aus — im selben Fenster nachgemessen: ein Gradient mit derselben Deklaration hat nach dem Wertwechsel **keine** laufende Animation und steht sofort auf dem neuen Wert, eine Farbfläche mit derselben Deklaration hat eine und liegt auf halbem Weg dazwischen. Die Deklaration war Fassade; die vier Phasen sind gesprungen, seit es den Überzug gibt.

**Die Entscheidung.** Nicht mehr der Gradient wechselt, sondern die Deckkraft. `visual/daylight.ts` liefert statt einer Zeichenkette je Phase jetzt `daylightLayers(phase)`: alle vier Ebenen in fester Reihenfolge, genau eine mit Deckkraft 1. Die Shell rendert sie als Kinder des Überzugs, `shell.css` hängt Deckkraft und Übergang an `DAYLIGHT_LAYER_CLASS`. Weil auch die unsichtbaren Ebenen im DOM bleiben, laufen beim Wechsel zwei Deckkräfte gegenläufig — die alte nach unten, die neue nach oben. Ihre Summe bleibt dabei 1, die Tönung blendet also über, statt kurz zu verschwinden — solange die Blende allein läuft; läuft sie in die nächste, war das nicht mehr wahr, und der Eintrag darüber behebt genau das.

**Der Test.** `test/daylight.test.ts` pinnt die Ebenen statt nur die Verdrahtung: feste Reihenfolge, genau eine sichtbare je Phase, vier unterscheidbare Tönungen, `transition: opacity` am Ebenennamen — und dass `transition: background` nicht zurückkehrt.

**Im Browser.** Im Einzeldatei-Produktionsbuild, Tag 18, „Nacht vorbereiten" als echter Klick: genau zwei Übergänge laufen, `opacity`, 900 ms, `ease`. Die beteiligten Ebenen stehen 0/150/300/450/600/750/900 ms nach dem Start auf `0,978/0,697/0,334/0,163/0,05/0,01/0` und `0,022/0,303/0,666/0,837/0,95/0,99/1` — Summe durchgehend 1 beim isolierten Wechsel, keine Zwischenlücke. Die Schleife läuft dabei vollständig durch: „Auftrag rechnen" → Ergebnis → „Nächsten Tag beginnen" (Tag 19) → „Nacht vorbereiten". Nach dem Ausblenden stehen alle vier Ebenen im DOM mit der Summe 1, und der Überzug bleibt `pointer-events: none` bei `z-index: 4` als letztes Kind des Rahmens — `elementFromPoint` trifft die Topbar, nicht ihn.

**Gates:** typecheck 0, 255 Tests in 41 Dateien, Lint 0, LOC-Caps ok (227 Quelldateien), Hygiene ok, Shinon PASS.


Der Block vom 2026-09-27 zur Tagespalette steht in `historisch/2026-09-27_client-tagespalette.md`.
