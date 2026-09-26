import { openWindow } from '../window'

/** Schnellfenster der Topbar mit ihrer Ankerlage. */
const QUICK_WINDOWS = [
  { id: 'team', title: 'Team', width: 260 },
  { id: 'route', title: 'Route', width: 240 },
  { id: 'legend', title: 'Steuerung', width: 290 },
] as const

/**
 * Die drei Schnellfenster der Topbar.
 *
 * Die Startpositionen kaskadieren, damit sich neu geöffnete Fenster nicht
 * deckungsgleich stapeln. Der Fensterzustand selbst gehört `window/`.
 */
export function ToolGroup() {
  return (
    <div class="tool-group">
      {QUICK_WINDOWS.map((entry, index) => (
        <button
          key={entry.id}
          type="button"
          class="chip"
          onClick={() =>
            openWindow({
              id: entry.id,
              title: entry.title,
              x: 24 + index * 36,
              y: 92 + index * 26,
              width: entry.width,
            })
          }
        >
          {entry.title}
        </button>
      ))}
    </div>
  )
}
