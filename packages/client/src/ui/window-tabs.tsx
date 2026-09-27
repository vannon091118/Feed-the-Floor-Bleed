import { closeWindow, focusedId, focusWindow, windows } from '../window'

/** Offene Weltfenster bleiben als Tabs erreichbar, auch wenn sie überlappt sind. */
export function WindowTabs() {
  const open = windows.value
  if (open.length === 0) return null

  return (
    <nav class="window-tabs" aria-label="Offene Fenster">
      {open.map((win) => (
        <div class="window-tab" key={win.id}>
          <button
            type="button"
            class="window-tab__focus"
            aria-current={focusedId.value === win.id ? 'page' : undefined}
            onClick={() => focusWindow(win.id)}
          >
            {win.title}
          </button>
          <button
            type="button"
            class="window-tab__close"
            aria-label={`${win.title} schließen`}
            onClick={() => closeWindow(win.id)}
          >
            ×
          </button>
        </div>
      ))}
    </nav>
  )
}
