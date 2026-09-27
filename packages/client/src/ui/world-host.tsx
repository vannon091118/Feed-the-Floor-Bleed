import type { ComponentChildren } from 'preact'
import { useEffect, useRef } from 'preact/hooks'
import type { DragDropCommand } from '../input'
import { stepPlayback } from '../raid/playback'
import { createVisualRuntime, type VisualRuntime } from '../render'
import { CAMERA_KEY_HINT, cameraSurfaceProps } from '../render/camera-keys'
import type { RenderMode } from '../render/modes'
import type { ActorKind } from '../world'
import { createSceneSwitch, type SceneSwitch } from './scene-switch'

export interface WorldHostProps {
  onActorClick: (actorId: string, kind: ActorKind) => void
  onDrop: (command: DragDropCommand) => void
  onBuildingClick: (buildingId: string) => void
  mode: RenderMode
  children?: ComponentChildren
}

/** Preact liefert nur den Host-Knoten; Szenen und Pixi gehören `scene-switch.ts`. */
export function WorldHost({
  onActorClick,
  onBuildingClick,
  onDrop,
  mode,
  children,
}: WorldHostProps) {
  const hostRef = useRef<HTMLDivElement>(null)
  const runtimeRef = useRef<VisualRuntime | null>(null)
  const sceneRef = useRef<SceneSwitch | null>(null)
  const propsRef = useRef({ onActorClick, onBuildingClick, onDrop })
  const modeRef = useRef(mode)
  propsRef.current = { onActorClick, onBuildingClick, onDrop }

  useEffect(() => {
    const host = hostRef.current
    if (!host) return
    let disposed = false
    let observer: ResizeObserver | null = null
    let stopPlayback: (() => void) | null = null

    const boot = async (): Promise<void> => {
      const runtime = await createVisualRuntime(host)
      if (disposed) {
        runtime.dispose()
        return
      }
      runtimeRef.current = runtime
      // Der Replay-Takt hängt am Runtime-Ticker, nicht an der lebenden Szene:
      // an der Szene gezogen liefe er nur im Dungeon und stünde im Dorf still.
      stopPlayback = runtime.onTick(({ deltaMs }) => {
        stepPlayback(deltaMs)
      })
      const scenes = createSceneSwitch(runtime, host, modeRef.current, {
        onActorClick: (id, kind) => propsRef.current.onActorClick(id, kind),
        onBuildingClick: (id) => propsRef.current.onBuildingClick(id),
        onDrop: (command) => propsRef.current.onDrop(command),
      })
      sceneRef.current = scenes
      const resize = (): void => {
        runtime.resize(host.clientWidth, host.clientHeight)
        scenes.resize(host.clientWidth, host.clientHeight)
      }
      resize()
      observer = new ResizeObserver(resize)
      observer.observe(host)
    }
    void boot()

    return () => {
      disposed = true
      observer?.disconnect()
      stopPlayback?.()
      stopPlayback = null
      sceneRef.current?.destroy()
      sceneRef.current = null
      runtimeRef.current?.dispose()
      runtimeRef.current = null
    }
  }, [])

  useEffect(() => {
    sceneRef.current?.setMode(mode)
  }, [mode])

  return (
    <div class="world-host" data-render-mode={mode}>
      {/* Tragefläche für Zeiger und Tastatur der Kamera; fokussierbar und
          benannt, damit die Pfeiltasten hier ankommen. */}
      {/* Zeiger und Tastatur der Kamera hängen an dieser Fläche; ihre
          Tastatur-Props liefert der Kamera-Owner. */}
      <section
        class="world-host__canvas"
        ref={hostRef}
        aria-label={CAMERA_KEY_HINT}
        {...cameraSurfaceProps()}
      />
      {children && <div class="world-host__content">{children}</div>}
    </div>
  )
}
