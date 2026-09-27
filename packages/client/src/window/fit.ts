import { useCallback, useRef } from 'preact/hooks'
import { fittedHeight, visibleArea } from './drag'
import { patchWindow, type WindowState } from './store'

/**
 * Hält die Fensterhöhe am Inhalt.
 *
 * Fit und Zeiger-Resize setzen dieselbe Store-Größe; der Fit liest dabei den
 * gemessenen Inhalt und nicht die eigene Wirkung und überschreibt deshalb
 * keinen Zug am Griff. Nur die Höhe ändert sich, und sie endet an der Falz
 * statt darunter. `window.tsx` hängt die Rückgabe an den Inhaltsblock.
 */
export function useWindowFit(
  win: WindowState,
): (element: HTMLElement | null) => void {
  return useContentHeight((content) =>
    patchWindow(win.id, {
      height: fittedHeight(content, visibleArea(document.body), win.y),
    }),
  )
}

/**
 * Passt die Fensterhöhe an den gemessenen Inhalt an.
 *
 * Der Inhalt kennt seine Höhe erst im DOM, der Store kennt nur Zahlen; dieser
 * Hook übersetzt. Er beobachtet das Inhalts-Element und meldet jede Höhe
 * zurück — ausschließlich die Höhe; Breite und Lage bleiben am Nutzer.
 *
 * Beobachtet wird der Inhaltsblock, nicht der Fensterrumpf: der Rumpf füllt als
 * Flex-Kind genau die Fensterhöhe, er meldete dem Fit also dessen eigene
 * Wirkung zurück und bliese das Fenster bis zum Anschlag auf. Der Block wächst
 * mit seinem Inhalt und wird nur dann kleiner, wenn der Inhalt es wird. Ein
 * neuer Inhalt bekommt über den Wechselkey einen neuen Block und damit ein
 * neues Messintervall, statt das Höhenmaß des Vorgängers zu erben.
 *
 * Der Beobachter entsteht im Ref und nicht in einem Effekt: Effekte laufen nach
 * dem Aufbau, zu dem der Ref den Knoten liefert — beim ersten Aufbau gäbe es
 * sonst nichts zu beobachten und nie eine erste Messung. Der Ref behält seine
 * Identität über die Renderdurchläufe, sonst hinge sich der Beobachter bei
 * jedem Durchlauf neu an und meldete Messungen, die niemand angefordert hat.
 */
export function useContentHeight(
  apply: (height: number) => void,
): (element: HTMLElement | null) => void {
  const observer = useRef<ResizeObserver | null>(null)
  const last = useRef<number | null>(null)
  // Der Beobachter lebt über mehrere Renderdurchläufe; er muss den jüngsten
  // Rückruf rufen, sonst rechnete ein späterer Inhaltswuchs mit alten Werten.
  const latest = useRef(apply)
  latest.current = apply
  return useCallback((element: HTMLElement | null) => {
    observer.current?.disconnect()
    if (!element) return
    observer.current ??= new ResizeObserver((entries) => {
      // Aufrunden: ein angebrochenes Pixel Resthöhe genügt für einen
      // Scrollbalken am Fenster, den der Fit gerade vermeiden soll.
      const height = Math.ceil(entries[0]?.borderBoxSize?.[0]?.blockSize ?? 0)
      if (height > 0 && height !== last.current) {
        last.current = height
        // Nicht mitten in der Zustellung ins Layout greifen: der Patch hebt die
        // Fensterhöhe und damit die Breite des Beobachteten (der Scrollbalken
        // fällt weg). Im nächsten Frame ist das eine gewöhnliche Stiländerung,
        // im Zustellschritt meldet der Browser eine Beobachterschleife.
        requestAnimationFrame(() => latest.current(height))
      }
    })
    observer.current.observe(element)
  }, [])
}
