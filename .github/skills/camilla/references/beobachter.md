# Der Beobachter

> Alles Sichtbare ist ein Beobachter. Sichtbares schreibt nie in einen Zustand.

## Warum das eine Strukturregel und keine Stilfrage ist

Ein Zustand mit zwei Besitzern hat zwei Wahrheiten. Die beiden driften, sobald sie zu verschiedenen Zeiten geschrieben werden, und sie driften still — kein Typecheck, kein Gate und kein Test meldet es, weil beide für sich korrekt sind.

Im Spiel wird daraus ein Fehler, den der Spieler sieht: Die Baustelle im Panel zeigt eine freie Zelle, weil der Panel-Stand älter ist als der Bestand. Der Spieler klickt, das Kommando lehnt ab, und die Oberfläche hat ihm vorher etwas versprochen, das sie nicht halten konnte. Kein Fehlerfenster, kein Logeintrag — nur ein Klick, der ins Leere ging.

Die zweite Folge ist teurer: Alles, was neben dem Spiel herunterzählt, muss neben dem Spiel gepflegt werden. Und es wird meist nicht gepflegt, weil die Pflege kein Spielerbeweis ist. So entstehen die Nebenzustände, die später niemand mehr zuordnen kann.

## Die Naht-Signaturen dieses Repos

Diese Regeln sind im Bestand bereits durchgezogen. Du baust auf ihnen, du wiederholst sie nicht.

| Der Owner | Wie die Sichtbarkeit liest |
|----------|--------------------------|
| `visual/observer.ts` | Nimmt Zustand als Eingabe und liefert einen `VisualDelta`. Er hält **keine zweite Grid-Wahrheit**: Terrain wird nur neu gelesen, wenn sich die Grid-Referenz ändert, sonst `null`. Ein kleines Ereignis bleibt ein Akteur-Update statt eines Welt-Neuaufbaus. |
| `render/runtime.ts` | Besitzt Stage, Ebenen, Ticker und Kamera. Bekommt Daten als **Funktion** übergeben (`villagePlots`, `plots`) und liest sie pro Takt neu. Die Szene hält keinen Store. |
| `ui/floor-purchase.tsx` | Preisvorschau aus der Config, Knopf und Fehlbetrag aus dem Bestand, Kommando aus `village/floors`. Kein eigener Zustand, kein gemerkter Ablehnungstext. |
| `ui/settlement-toast.tsx` | Reine Ableitung aus dem Phase-Owner. Sichtbar nur am Tag, kein Bedienelement, kein eigener Sichtbarkeitszustand; die Ansageregion steht dauerhaft und ist ohne Meldung leer. |
| `ui/shell.tsx` | Einzige Ausnahme, explizit benannt: sie setzt die Tagesstimmung auf dem Überzug. Das ist Darstellung, keine Spielentscheidung — keine Phase-Aktion, kein Dorfzustand. |
| `ui/scene-switch.ts` | Hält genau eine lebende Szene. Callbacks kommen über `setCallbacks`, damit Preact keine Szene neu bauen muss. |
| `ui/world-host.tsx` | Liefert nur das Host-Element. Szenen und Pixi gehören `scene-switch.ts`. |

Das Muster ist überall gleich: **der Owner entscheidet, die Oberfläche zeigt, der Klick meldet zurück.**

## Die Kette, die du nicht aufbrichst

```text
balance (Zahlen) → economy (Regeln) → commands (Entscheidung + Schreiben) → state (Bestand)
                                                            ↓
                          Anzeige liest state, holt Regeln aus economy, schickt commands
```

Lies `packages/client/docs/REPOINDEX.md` für die vollständige Zuordnung je Datei. Wenn du an dieser Kette etwas ändern musst, ist das eine Architekturfrage und gehört in `docs/REGELWERK_ARCHITEKTUR.md` — nicht in einen Sprite.

## Die eine Stelle, an der Sichtbares schreiben darf

Eingaben. Ein Klick, ein Tastendruck, ein Drag-Ende. Dort entsteht eine **Absicht**, keine Entscheidung:

- `input/` übersetzt Pointer, Hit-Test und Drag in ein `DragDropCommand` — ein Kommando, keine Regel.
- Ein UI-Klick ruft ein Kommando auf — `ui/floor-purchase.tsx` ruft `buyFloor(...)`. Die Regel hat das Kommando vorher schon geprüft; der Knopf hat sie nur angezeigt.
- `window/store.ts` verwaltet Fensterzustand, Fokus und Z-Order. Das ist **Präsentationszustand**, kein Spielzustand: ein Fenster zu öffnen verändert nichts am Spiel. Diese Ausnahme ist echt und endet genau dort.

Wenn du merkst, dass eine Anzeige direkt schreibt, um sich etwas zu merken, ist das fast immer eine fehlende Ableitung. Frage dich: Woher käme dieser Wert, wenn ich ihn nicht merken müsste? Die Antwort ist fast immer: aus dem Owner, den ich schon lese.

## Checkliste vor der Übergabe

- [ ] Kein `signal.value =` , kein Store-Set, kein `commitVillage` in einer Datei unter `render/`, `visual/`, `ui/`, `icons/`.
- [ ] Keine Regelprüfung in einer Anzeige, die das Kommando nicht dieselbe Regel nennt.
- [ ] Keine Kopie eines Zustands in einem lokalen Memo, die veralten kann.
- [ ] Kein abgeleiteter Wert, der einen zweiten Berechnungspfad hat.
- [ ] Sichtbare Zahlen, Texte und Labels kommen aus einer Quelle, nicht aus drei.
- [ ] Fehlt eine Regel, die die Anzeige braucht: als offene Frage benannt, nicht als `if` gebaut.

## Test, der die Naht fängt

Ein Typecheck prüft die Naht nicht. Er prüft nur, dass die Typen passen. Was die Naht fängt, ist ein Test, der über den Owner geht: Bestand ändern, Bild prüfen. `packages/client/test/world-presentation.test.ts` macht genau das für die Dorfszene — leerer Bestand zeichnet nichts, ein gebautes Haus steht nach einem Takt an seiner Plot-Zelle, ein Klick meldet den Listenplatz.

Wenn du eine Naht änderst, ist dieser Test dein Beleg. Ohne ihn ist die Änderung ungeprüft, egal wie sauber sie aussieht.
