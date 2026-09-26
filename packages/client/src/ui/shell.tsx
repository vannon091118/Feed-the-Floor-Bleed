import { signal } from '@preact/signals'
import { useCallback } from 'preact/hooks'
import type { DragDropCommand } from '../input'
import { RaidTimeline } from '../raid/timeline'
import { dayNight } from '../village/state'
import { openWindow, WindowLayer } from '../window'
import type { ActorKind } from '../world'
import { EditorControls } from './editor-controls'
import { EditorPanel } from './editor-panel'
import { ActorPanel, LegendPanel, RoutePanel, TeamPanel } from './panels'
import { PhaseBadge } from './phase-badge'
import {
  NightPhasePanel,
  RaidPhasePanel,
  ResultPhasePanel,
  TagPhasePanel,
} from './phase-panels'
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

  const { phase } = dayNight.value
  const editing = phase === 'night' || phase === 'raid'

  return (
    <main class={phase === 'tag' ? 'app is-day' : 'app'}>
      <header class="topbar">
        <h1>Feed the Floor · Tag/Nacht-Schleife</h1>
        <div class="topbar__actions">
          <PhaseBadge />
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
          {phase === 'tag' && <TagPhasePanel />}
          {phase === 'night' && <NightPhasePanel />}
          {editing && <EditorControls />}
          {editing && <EditorPanel />}
          {phase === 'raid' && <RaidPhasePanel />}
          {phase === 'raid' && <RaidTimeline />}
          {phase === 'result' && <ResultPhasePanel />}
          <p class="hint" aria-live="polite">
            {lastDrop.value}
          </p>
        </aside>
      </section>
    </main>
  )
}
