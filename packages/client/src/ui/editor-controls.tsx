import {
  type Brush,
  brush,
  resetGrid,
  selectBrush,
} from '../dungeon-editor/state'

const BRUSHES: ReadonlyArray<{ id: Brush; label: string }> = [
  { id: 'empty', label: 'Leer' },
  { id: 'wall', label: 'Wand' },
  { id: 'trap', label: 'Falle' },
]

/** Pinselauswahl und Rücksetzen. Beides schreibt nur in den Grid-Owner. */
export function EditorControls() {
  return (
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
  )
}
