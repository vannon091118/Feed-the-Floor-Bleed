import { useEffect, useRef } from 'preact/hooks'
import { grid, route } from '../dungeon-editor/state'
import type { DragDropCommand } from '../input'
import { createVisualRuntime } from '../render'
import { type Showcase, createShowcase } from '../showcase'
import type { ActorKind } from '../world'

export interface WorldHostProps {
  onActorClick: (actorId: string, kind: ActorKind) => void
  onDrop: (command: DragDropCommand) => void
}

/**
 * Stabiler DOM-Mountpunkt für die Spielwelt.
 *
 * Preact erzeugt genau ein Host-Element und startet einmalig die Runtime.
 * Danach besitzt Pixi Stage, Ticker und Display Objects; die UI rendert keine
 * Sprites als Komponenten und bleibt von der Szene unabhängig.
 */
export function WorldHost(props: WorldHostProps) {
  const hostRef = useRef<HTMLDivElement>(null)
  const propsRef = useRef(props)
  propsRef.current = props

  useEffect(() => {
    const host = hostRef.current
    if (!host) return
    let showcase: Showcase | null = null
    let disposeRuntime: (() => void) | null = null
    let resizeObserver: ResizeObserver | null = null
    let disposed = false

    const boot = async (): Promise<void> => {
      const runtime = await createVisualRuntime(host)
      if (disposed) {
        runtime.dispose()
        return
      }
      disposeRuntime = () => runtime.dispose()
      showcase = createShowcase({
        runtime,
        element: host,
        getGrid: () => grid.value,
        getRoute: () => route.value,
        onActorClick: (actorId, kind) =>
          propsRef.current.onActorClick(actorId, kind),
        onDrop: (command) => propsRef.current.onDrop(command),
      })
      const applySize = (): void => {
        showcase?.resize(host.clientWidth, host.clientHeight)
      }
      applySize()
      resizeObserver = new ResizeObserver(applySize)
      resizeObserver.observe(host)
    }
    void boot()

    return () => {
      disposed = true
      resizeObserver?.disconnect()
      showcase?.dispose()
      disposeRuntime?.()
    }
  }, [])

  return <div class="world-host" ref={hostRef} />
}
