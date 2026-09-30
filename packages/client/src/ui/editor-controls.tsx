import {
  type Brush,
  brush,
  resetGrid,
  selectBrush,
} from '../dungeon-editor/state'
import { DropStatus } from './drop-status'

const BRUSHES: ReadonlyArray<{ id: Brush; label: string }> = [
  { id: 'empty', label: 'Leer' },
  { id: 'wall', label: 'Wand' },
  { id: 'placement', label: 'Platzierung' },
]

/**
 * Pinselauswahl, Rücksetzen und der Zug-Status. Alle drei schreiben nur in
 * ihre Owner; der Status liest das Signal, das `shell.tsx` beim Abschluss einer
 * Geste füllt. Vorher hing dieses Signal an keiner Anzeige: die Meldung entstand
 * und verschwand, ohne dass der Spieler sie sehen konnte.
 */
export function EditorControls() {
  return (
    <>
      <div class="editor-tools">
        {BRUSHES.map((entry) => (
          <button
            key={entry.id}
            type="button"
            class="chip"
            aria-pressed={brush.value === entry.id}
            onClick={() => selectBrush(entry.id)}
          >
            {entry.label}
          </button>
        ))}
        <button type="button" class="chip" onClick={() => resetGrid()}>
          Zurücksetzen
        </button>
      </div>
      <DropStatus />
    </>
  )
}
