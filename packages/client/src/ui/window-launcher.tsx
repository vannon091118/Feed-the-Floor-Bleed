import { useEffect } from 'preact/hooks'
import { dayNight } from '../village/state'
import { openWindow, updateWindowTitle, windows } from '../window'
import type { StageView } from './view'

/** Titel des Phasenfensters; die ID bleibt über die Schleife hinweg stabil. */
function phaseTitle(): string {
  const phase = dayNight.value.phase
  if (phase === 'tag') return 'Aktion'
  if (phase === 'night') return 'Dungeon'
  if (phase === 'raid') return 'Raid'
  return 'Ergebnis'
}

/**
 * Die einzige Startrampe für Kontextfenster.
 *
 * Sie liegt über der Welt statt in einer Seitenleiste: geklickt wird auf das,
 * was man sieht, und die Fenster bleiben verschiebbar.
 */
export function WindowLauncher({ view }: { view: StageView }) {
  const title = phaseTitle()
  const editing =
    dayNight.value.phase === 'night' || dayNight.value.phase === 'raid'

  // Das Phasenfenster bleibt über die Schleife hinweg offen; sein Titel nicht.
  useEffect(() => {
    if (windows.value.some((win) => win.id === 'phase'))
      updateWindowTitle('phase', title)
  }, [title])

  return (
    <nav class="stage-windows" aria-label="Weltfenster">
      <button
        type="button"
        class="stage-window-opener"
        title={`${title} als Fenster öffnen`}
        aria-label={`${title} als Fenster öffnen`}
        onClick={() =>
          // 260 ist nur die Öffnungsgröße: window/fit.ts misst danach nach.
          openWindow({
            id: 'phase',
            title,
            x: 20,
            y: 82,
            width: 330,
            height: 260,
          })
        }
      >
        {title}
      </button>
      {editing && view === 'dungeon' && (
        <button
          type="button"
          class="stage-window-opener"
          title="Dungeon-Editor als Fenster öffnen"
          aria-label="Dungeon-Editor als Fenster öffnen"
          onClick={() =>
            openWindow({
              id: 'editor',
              title: 'Dungeon-Editor',
              x: 20,
              y: 100,
              width: 330,
              height: 480,
            })
          }
        >
          Editor
        </button>
      )}
      <button
        type="button"
        class="stage-window-opener"
        title="Gildenroster als Fenster öffnen"
        aria-label="Gildenroster als Fenster öffnen"
        onClick={() =>
          openWindow({ id: 'team', title: 'Gilde', x: 24, y: 100, width: 300 })
        }
      >
        Gilde
      </button>
      {view === 'dungeon' && (
        <button
          type="button"
          class="stage-window-opener"
          title="Routenbilanz als Fenster öffnen"
          aria-label="Routenbilanz als Fenster öffnen"
          onClick={() =>
            openWindow({
              id: 'route',
              title: 'Route',
              x: 24,
              y: 100,
              width: 270,
            })
          }
        >
          Route
        </button>
      )}
      <button
        type="button"
        class="stage-window-opener"
        title="Steuerung als Fenster öffnen"
        aria-label="Steuerung als Fenster öffnen"
        onClick={() =>
          openWindow({
            id: 'legend',
            title: 'Steuerung',
            x: 24,
            y: 100,
            width: 300,
          })
        }
      >
        Steuerung
      </button>
    </nav>
  )
}
