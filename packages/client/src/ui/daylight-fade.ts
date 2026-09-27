import {
  DAYLIGHT_LAYER_CLASS,
  daylightFadeStarts,
  daylightTargets,
} from '../visual/daylight'

/**
 * Fährt die Blende des Tagesüberzugs ein.
 *
 * Der Visual-Owner liefert die Startwerte (`daylightFadeStarts`) und den
 * Ruhezustand (`daylightTargets`), `shell.css` trägt Dauer und Kurve; hier steht
 * nur der Griff ins DOM.
 *
 * Der Umweg über `transition: none` und einen erzwungenen Stilwechsel ist der
 * Kern: läuft noch eine Blende, kehrt und verkürzt der Browser sie beim neuen
 * Ziel, und der Tönung fehlt mitten im Wechsel die halbe Deckkraft. Mit dem
 * Zwischenschritt steht jede Ebene zuerst auf ihrem Ist-Wert, und die neue
 * Blende startet von dort in voller Länge.
 */
export function fadeDaylight(overlay: HTMLElement, activeIndex: number): void {
  const layers = [
    ...overlay.querySelectorAll<HTMLElement>(`.${DAYLIGHT_LAYER_CLASS}`),
  ]
  if (layers.length === 0) return
  const starts = daylightFadeStarts(
    layers.map((layer) => Number(getComputedStyle(layer).opacity)),
    activeIndex,
  )
  const targets = daylightTargets(activeIndex)

  for (const [index, layer] of layers.entries()) {
    layer.style.transition = 'none'
    layer.style.opacity = String(starts[index])
  }
  // Der Stil muss stehen, bevor die Ziele folgen: in derselben Änderung stünde
  // der Startwert schon fest, und es gäbe keine Blende.
  void overlay.offsetHeight
  for (const [index, layer] of layers.entries()) {
    layer.style.transition = ''
    layer.style.opacity = String(targets[index])
  }
}
