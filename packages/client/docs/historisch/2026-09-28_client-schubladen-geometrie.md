# packages/client/docs/historisch/2026-09-28_client-schubladen-geometrie.md

Append-only Archiv aus `packages/client/docs/CHANGELOG.md`. Enthaelt den Eintrag
vom 2026-09-28 zur Fenstergeometrie in der Schubladenanordnung. Der Text ist
unveraendert uebernommen; kein Satz ist verloren gegangen und keiner neu
geschrieben.

## 2026-09-28 — In der Schublade führt die Anordnung die Fenstergeometrie

**Der Befund.** Unterhalb von 721 px pinnt `windows.css` `left`, `top` und `width` mit `!important` an die untere Kante — auf schmalen Anzeigen ist ein Fenster eine Schublade statt einer freien Karte. Tastatur und Zeiger schrieben trotzdem weiter in den Fenster-Store: gemessen wanderte er bei 644 px von 36 auf 52 und 68, während das Bild bei 10/342 mit 624 px Breite stehen blieb. Store und sichtbarer Zustand liefen still auseinander, und keine Doku nannte die Grenze.

**Die Entscheidung: die Anordnung ist dort die Autorität.** Den Weg „Bewegung funktioniert auch in der Schublade“ hätte nur die Layout-Regel geräumt — dann läge eine 330 px breite Karte frei auf einem 360-px-Display statt an der unteren Kante, und die Anzeige verlöre genau die Affordanz, für die sie da ist. `window/drag.ts` führt deshalb die Grenze selbst (`SHEET_MAX_WIDTH`, `sheetOwnsLayout`): In der Schublade gibt es keinen Tastenschritt (`boxAfterKey` gibt `null` zurück) und keine beginnende Zeigergeste (`geometryIsUserOwned`), und der Store kann gar nicht erst abweichen. Damit die Grenze nicht nur im Verhalten steht, sind Griff- und Skalierzeiger dort ebenfalls weg (`cursor: default`, Resize-Griff `display: none`).

**Der Test.** `test/window-routing.test.ts` pinnt beides: `sheetOwnsLayout` an der Grenze (644 führt die Anordnung, 721 nicht), `boxAfterKey` ohne Schritt darunter und mit Schritt darüber, `geometryIsUserOwned` für beide Breiten — und dass `windows.css` dieselbe Medienabfrage und dieselben zwei stillgelegten Affordanzen trägt.

**Im Browser.** Bei 644 px, echte Tasten und ein Zeigerzug auf der Leiste: Store `left: 20px; top: 82px` **unverändert**, Bild unverändert bei `10,342 624×247`, Leiste `cursor: default`, Griff `display: none`. Zurück bei 1280 px: dieselbe Pfeiltaste schiebt den Store von 20 auf 36, und das Bild folgt exakt (`36,82 330×265`, Breite 330 = Store); ein Zug von +60/+50 landet bei `96,132` in Store und Bild zugleich, Leiste wieder `cursor: grab`. Store und Bild stimmen in beiden Breiten überein.

**Gates:** typecheck 0, 261 Tests in 41 Dateien, Lint 0, LOC-Caps ok, Hygiene ok, Shinon PASS, Client-Build und Worker-Dry-Run ok.
