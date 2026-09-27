import { useCallback, useEffect, useRef } from 'preact/hooks'
import type { DragDropCommand } from '../input'
import { dayNight } from '../village/state'
import {
  DAYLIGHT_CLASS,
  DAYLIGHT_LAYER_CLASS,
  daylightActiveIndex,
  daylightLayers,
} from '../visual/daylight'
import { openWindow } from '../window'
import type { ActorKind } from '../world'
import { actorLabel } from './actor-label'
import { fadeDaylight } from './daylight-fade'
import { recordDrop } from './drop-status'
import { Stage } from './stage'
import { Topbar } from './topbar'

/** Die Ebenen des Überzugs sind statisch; nur ihre Deckkraft wechselt. */
const DAYLIGHT_LAYERS = daylightLayers()

/**
 * Die Shell ist Layout, mit genau einer Ausnahme: sie setzt die Tagesstimmung.
 *
 * Sie liest die Phase aus dem Store und setzt deren Ebenen auf den Überzug; die
 * Farben selbst kommen aus dem Visual-Owner, das Stylesheet malt sie aus und
 * trägt mit der Deckkraft den weichen Wechsel. Das ist Darstellung, keine
 * Spielentscheidung: keine
 * Phase-Aktion, kein Dorfzustand, und der Store bleibt in `village/state.ts` der
 * einzige Owner. Topbar, Bühne und Fensterschicht lesen ihre Stores selbst. Die
 * zwei Rückrufe hier sind Verdrahtung — ein Klick auf eine Kreatur öffnet ein
 * Fenster, ein Zug meldet sich im Werkzeugstatus.
 */
export function Shell() {
  const { phase } = dayNight.value
  const overlay = useRef<HTMLDivElement>(null)

  // Die Blende läuft neben dem Renderlauf: der Applier liest die gerade
  // gemalten Deckkräfte und setzt die neuen Ziele. Preact hält nur Tönung und
  // Reihenfolge der Ebenen, sonst überschriebe es die laufende Blende.
  useEffect(() => {
    const element = overlay.current
    if (element) fadeDaylight(element, daylightActiveIndex(phase))
  }, [phase])

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
      </section>
      {/* Letztes Kind: der Überzug belegt dieselbe Ebene (z-index 4) wie die
          Fensterschicht und soll deren Kontextfenster verdecken, also malt ihn
          die DOM-Reihenfolge nach ihr. Je Phase eine Ebene — der Wechsel ist
          die Deckkraft der Ebenen, nicht der Tausch eines Gradienten; ihre
          Startwerte setzt `fadeDaylight`, nicht dieser Renderlauf. */}
      <div class={DAYLIGHT_CLASS} aria-hidden="true" ref={overlay}>
        {DAYLIGHT_LAYERS.map((layer) => (
          <div
            key={layer.phase}
            class={DAYLIGHT_LAYER_CLASS}
            style={{ background: layer.tint }}
          />
        ))}
      </div>
    </main>
  )
}
