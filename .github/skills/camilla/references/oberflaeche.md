# Die DOM-Oberfläche

Alles, was zwischen der PixiJS-Szene und dem Browser liegt: Shell, Topbar, Panels, Fenster, Overlays, Icons, Stylesheet.

## Tokens zuerst

`ui/styles/tokens.css` ist das Gestaltungsraster: Farbe, Abstand, Radius, Typografie. `index.css` importiert die Blätter in fester Reihenfolge. **Neue Werte gehören ins Token-Blatt**, nicht in die einzelne Komponente. Ein `#1a2b3c` in `panels.css` ist eine neue Wahrheit neben dem Token, und beim nächsten Dunkelmodus bleibt nur eine der beiden recht.

Der Importweg ist Teil des Problems: eine Komponente, die in keinem Blatt importiert wird, existiert nicht. Nach dem Anlegen prüfen, ob das Blatt im `index.css` steht.

## Was in die Szene gehört und was ins DOM

Die Aufteilung ist im Bestand entschieden (E4/E5 in `docs/VISUAL_GRUNDSATZ.md`):

- **Pixi** trägt alles Weltliche: Dorfboden, Gebäude, Akteure, Terrain, FX, Atmosphäre. Es skaliert mit der Kamera und liegt in Weltkoordinaten.
- **DOM** trägt alles Bedienbare: Topbar, Panels, Fenster, Werkzeugstatus, Toasts, Icons, Overlays. Es ist scharf, tastaturfähig und für Screenreader lesbar.

Kein Text gehört in ein Pixi-`Text`, wenn er bedient oder gelesen werden muss — und kein Knopf gehört in die Szene. Das ist kein Stil, sondern Zugänglichkeit: die Szene hat keine Tastatur.

## Fenster

`window/store.ts` verwaltet Registry, Fokus und Z-Order als Signals. Das ist Präsentationszustand und der einzige erlaubte Schreibpfad außerhalb des Commando-Musters — ein Fenster zu öffnen ändert nichts am Spiel.

Geometrie liegt in `window/drag.ts` (sichtbare Fläche, Kopfklemme, Mindestgrößen, Zug- versus Klickgrenze), die Tastatur in `window/keys.ts`, die Richtung liefert `input/arrows.ts` beiden. Unter 721 px richtet `windows.css` die Fenster als Schublade an der unteren Kante aus.

Ein Fensterinhalt wird über eine **stabile ID** aufgelöst (`ui/window-content.tsx`). Beim Umbau bitte die ID stabil halten: Phasenaktionen hängen daran, und ein Tippfehler macht den Knopf still.

## Text und Sprache

Ein Label hat **eine** Quelle:

| Was | Quelle |
|-----|--------|
| Actor-Name | `ui/actor-label.ts` |
| Gebäude-Name | `ui/building-label.ts` |
| Ablehnungsgrund | `ui/command-reason.ts` |
| Ressourcenname | `resources/catalog.ts` |

`command-reason.ts` ist ein `Record` über alle benannten Gründe aus `village/plans.ts` — deshalb ist ein neuer Grund dort ein Typecheck-Fehler. Das ist Absicht. Ein Grund, den die Oberfläche selbst erfindet, ist eine Prüfung an der falschen Stelle.

**Sätze statt Codes.** Nicht `ERR_MATERIAL`, sondern „Zu wenig Material." Nicht `undefined`, sondern eine leere, korrekt gerahmte Zeile. Wenn eine Anzeige keinen sprechenden Text hat, ist nicht der Text das Problem, sondern die fehlende Regel dahinter.

## Zahlen

Jede Zahl braucht Kontext, sonst ist sie eine Debug-Ausgabe. Wann welcher Abstand: `stats.tsx` macht aus offenen Label-Wert-Listen beschriftete Wertzeilen. Tabellarische Ziffern (`tnum`, in `panels.css`) verhindern das Zittern laufender Zahlen — bei Ressourcen also Pflicht.

Ein Rohwert auf die Bühne ist fast immer eine verpasste Formatierung an der Quelle, nicht ein Anzeigefehler. Formatiere einmal, dort wo der Wert entsteht.

## Icons

Handgeschriebene SVG in `icons/resource-icon.tsx` — keine neue Bibliothek (E5). Ein Icon trägt seinen Namen für Screenreader; der Text daneben bleibt der Text, auch wenn das Icon ihn wiederholt.

## Bedienbarkeit

Das Spiel wird mit **Zeiger und Tastatur** bedient, und das ist geprüft:

- Fensterrahmen und Weltansicht sind fokussierbar (`render/camera-keys.ts` liefert die Props für die Weltfläche).
- Die Tastaturpfade sind durch `test/keyboard-access.test.ts` und `test/keyboard-wiring.test.ts` gedeckt. Wer eine Leertaste- oder Pfeiltaste-Navigation ändert, fällt dort.
- `ui/panels.tsx` trägt die Steuerungslegende mit den Tastenhinweisen. Eine neue Tastenkombination ohne Legende ist eine Funktion, die niemand findet.
- Der Tagesüberzug in `shell.tsx` trägt `aria-hidden`, weil er nichts sagt. Dekoration, die eine vorlesende Stimme belügt, ist ein Fehler.

`prefers-reduced-motion` steht in `base.css` und ist verbindlich: Jede neue Animation prüft, ob sie bei reduzierter Bewegung ausfällt. Eine Blende, die bei reduzierter Bewegung hart springt, ist schlimmer als keine Blende.

## Icons, Zahlen, Fokus: die drei stillen Fehler

1. **Ein Wert ohne Einheit.** `7` ist eine Zahl. `7 Material` ist ein Verständnis.
2. **Fokus, der verschwindet.** Fokusreihenfolge nur per Tab testen, nie per Maus.
3. **Farbe als einziger Träger.** Rot/Grün allein reicht nicht — es braucht Form, Text oder Bewegung daneben, sonst ist die Information für Farbfehlsichtige weg.
