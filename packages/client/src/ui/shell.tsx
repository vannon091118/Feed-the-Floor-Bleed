import { signal } from '@preact/signals'
import { useCallback, useState } from 'preact/hooks'
import type { DragDropCommand } from '../input'
import { WindowLayer, openWindow } from '../window'
import type { ActorKind } from '../world'
import { EditorControls } from './editor-controls'
import { EditorPanel } from './editor-panel'
import { ActorPanel, LegendPanel, RoutePanel, TeamPanel } from './panels'
import { WorldHost } from './world-host'

const lastDrop = signal('Noch kein Drop.')

function renderContent(id: string) {
  if (id.startsWith('actor:')) return <ActorPanel windowId={id} />
  if (id === 'team') return <TeamPanel />
  if (id === 'route') return <RoutePanel />
  if (id === 'legend') return <LegendPanel />
  return <p class="hint">Kein Inhalt hinterlegt.</p>
}

export function Shell() {
  const [night, setNight] = useState(false)

  const handleActorClick = useCallback((actorId: string, kind: ActorKind) => {
    openWindow({
      id: `actor:${kind}:${actorId}`,
      title: `${kind} · ${actorId}`,
      x: 320,
      y: 180,
      width: 240,
      height: 150,
    })
  }, [])

  const handleDrop = useCallback((command: DragDropCommand) => {
    lastDrop.value = `${command.source} ${command.id} → Zelle ${command.cell.x},${command.cell.y}`
  }, [])

  return (
    <main class={night ? 'app is-night' : 'app is-day'}>
      <header class="topbar">
        <h1>Feed the Floor · Visual Foundation</h1>
        <div class="topbar__actions">
          <button type="button" class="chip" onClick={() => setNight(!night)}>
            {night ? 'Nacht' : 'Tag'}
          </button>
          <button
            type="button"
            class="chip"
            onClick={() =>
              openWindow({ id: 'team', title: 'Team', x: 24, y: 24 })
            }
          >
            Team
          </button>
          <button
            type="button"
            class="chip"
            onClick={() =>
              openWindow({ id: 'route', title: 'Route', x: 300, y: 24 })
            }
          >
            Route
          </button>
          <button
            type="button"
            class="chip"
            onClick={() =>
              openWindow({ id: 'legend', title: 'Legende', x: 576, y: 24 })
            }
          >
            Legende
          </button>
        </div>
      </header>
      <section class="stage">
        <div class="viewport">
          <WorldHost onActorClick={handleActorClick} onDrop={handleDrop} />
          <WindowLayer renderContent={renderContent} />
        </div>
        <aside class="side">
          <EditorControls />
          <EditorPanel />
          <p class="hint" aria-live="polite">
            {lastDrop.value}
          </p>
        </aside>
      </section>
    </main>
  )
}
