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

export function EditorControls() {
  return (
    <div class="editor-controls">
      {BRUSHES.map((entry) => (
        <button
          key={entry.id}
          type="button"
          class={brush.value === entry.id ? 'chip is-active' : 'chip'}
          onClick={() => selectBrush(entry.id)}
        >
          {entry.label}
        </button>
      ))}
      <button type="button" class="chip" onClick={() => resetGrid()}>
        Reset
      </button>
    </div>
  )
}
