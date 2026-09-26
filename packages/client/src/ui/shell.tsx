import { useCallback } from 'preact/hooks'
import type { DragDropCommand } from '../input'
import { openWindow } from '../window'
import type { ActorKind } from '../world'
import { actorLabel } from './actor-label'
import { recordDrop } from './drop-status'
import { Sidebar } from './sidebar'
import { Stage } from './stage'
import { Topbar } from './topbar'

/**
 * Die Shell ist nur noch Layout.
 *
 * Sie kennt keine Phase, keine Phase-Aktion und keinen Dorfzustand: Topbar,
 * Bühne und Sidebar lesen ihre Stores selbst. Die zwei Rückrufe hier sind
 * Verdrahtung — ein Klick auf eine Kreatur öffnet ein Fenster, ein Zug meldet
 * sich im Werkzeugstatus.
 */
export function Shell() {
  const handleActorClick = useCallback((actorId: string, kind: ActorKind) => {
    openWindow({
      id: `actor:${kind}:${actorId}`,
      title: actorLabel(actorId),
      x: 320,
      y: 180,
      width: 240,
      height: 150,
    })
  }, [])

  const handleDrop = useCallback((command: DragDropCommand) => {
    recordDrop(command)
  }, [])

  return (
    <main class="app">
      <Topbar />
      <section class="stage">
        <Stage onActorClick={handleActorClick} onDrop={handleDrop} />
        <Sidebar />
      </section>
    </main>
  )
}
