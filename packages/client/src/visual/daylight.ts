import { PHASE_ORDER, type Phase } from '../village/phase'

/**
 * Tagesstimmung der Schleife als Präsentationsdeskriptor.
 *
 * Die vier Tönungen standen als vier Regeln in `ui/styles/shell.css`, also in der
 * Schicht, die den Überzug malt, nicht in der, die die Darstellung beschreibt.
 * Hier liegen sie neben den übrigen Deskriptoren; das Stylesheet behält nur die
 * Fläche, ihre Lage und ihren Übergang. Der Zugriff ist über die Phase-Union
 * erschöpfend — eine neue Phase ist ein Typfehler und keine stumm fehlende
 * Tönung.
 *
 * Jede Phase bekommt eine eigene Ebene, sonst wäre der Wechsel ein Sprung: eine
 * `transition` auf `background` interpoliert keinen Gradienten, Chromium tauscht
 * ihn aus. Die Deckkraft interpoliert es zuverlässig, und die trägt den Wechsel.
 *
 * Wie die Deckkräfte beim Wechsel verteilt werden, rechnet dieser Owner:
 * `daylightTargets` ist der Ruhezustand, `daylightFadeStarts` der Start einer
 * Blende. Die Startwerte sind komplementär, damit die Summe der Deckkräfte zu
 * jedem Zeitpunkt 1 bleibt — auch dann, wenn eine Blende in die nächste läuft.
 */
const TINTS: Record<Phase, string> = {
  tag: 'radial-gradient(120% 80% at 50% 0%, rgba(224, 173, 85, 0.16), transparent 62%)',
  night:
    'radial-gradient(120% 90% at 50% 100%, rgba(96, 126, 196, 0.22), rgba(6, 8, 14, 0.42) 72%)',
  raid: 'radial-gradient(120% 90% at 50% 100%, rgba(216, 119, 106, 0.2), rgba(10, 6, 8, 0.44) 72%)',
  result:
    'linear-gradient(180deg, rgba(224, 173, 85, 0.1), rgba(8, 10, 16, 0.34))',
}

/**
 * Name des Überzugs, der die Ebenen trägt.
 *
 * Er steht hier und nicht im Stylesheet, weil beide Seiten ihn kennen müssen:
 * die Shell setzt ihn als Klasse, `shell.css` hängt die Überzugsregeln daran.
 * Der Test bindet die beiden Namen aneinander, damit ein umbenannter Deskriptor
 * nicht stumm ohne Wirkung bleibt. Der Überzug ist ein echtes Element und kein
 * `::after`, damit die Zeichenketten aus diesem Deskriptor direkt als
 * Inline-Hintergrund auf der Fläche landen — ohne Zwischenstation.
 */
export const DAYLIGHT_CLASS = 'daylight'

/** Name der Ebenen im Überzug; `shell.css` hängt Deckkraft und Übergang daran. */
export const DAYLIGHT_LAYER_CLASS = 'daylight__layer'

/**
 * Länge einer Blende in Millisekunden.
 *
 * Die Zahl steht auch in `shell.css` am Ebenenübergang — CSS liest keine
 * TypeScript-Konstanten; der Test vergleicht beide Seiten, damit sie nicht
 * auseinanderlaufen.
 */
export const DAYLIGHT_FADE_MS = 900

/** Eine Überzugsebene: die Tönung einer Phase. */
export interface DaylightLayer {
  phase: Phase
  tint: string
}

/**
 * Alle Ebenen des Überzugs in fester Reihenfolge: Tag warm von oben, Nacht kühl
 * von unten, Raid rot, Ergebnis Dämmerung.
 *
 * Die Liste ist unabhängig von der Phase und vollständig — jede Phase behält
 * ihren Platz, auch wenn sie unsichtbar ist. Eine entfernte Ebene wäre kein
 * Ausblenden, sondern ein harter Schnitt, und ein Neuaufbau beim Wechsel würde
 * die laufende Blende abräumen.
 */
export function daylightLayers(): DaylightLayer[] {
  return PHASE_ORDER.map((phase) => ({ phase, tint: TINTS[phase] }))
}

/** Index der Phase in der Ebenenreihenfolge; dieselbe Ordnung wie die Liste. */
export function daylightActiveIndex(phase: Phase): number {
  return PHASE_ORDER.indexOf(phase)
}

/** Deckkraft jeder Ebene im Ruhezustand: genau eine sichtbar, Summe 1. */
export function daylightTargets(activeIndex: number): number[] {
  return PHASE_ORDER.map((_, index) => (index === activeIndex ? 1 : 0))
}

/**
 * Startwerte einer Blende von der aktuell gemalten Verteilung auf `activeIndex`.
 *
 * Die Summe der Deckkräfte bleibt damit zu jedem Zeitpunkt 1: die ausgehenden
 * Ebenen starten auf ihrem Ist-Wert und fallen gemeinsam auf 0, die neue startet
 * auf dem Komplement und steigt auf 1. Beides läuft über dieselbe Dauer und
 * dieselbe Kurve aus `shell.css`, also wiegt die Summe in jeder Zwischenstufe
 * genau so viel wie im Ruhezustand.
 *
 * Ohne diese Rechnung kehrt der Browser eine laufende Blende um und kürzt sie;
 * gemessen fiel die Summe dabei auf 0,49 — die Tönung wurde sichtbar dünner.
 */
export function daylightFadeStarts(
  current: readonly number[],
  activeIndex: number,
): number[] {
  const others = current.reduce(
    (sum, value, index) => (index === activeIndex ? sum : sum + clamp01(value)),
    0,
  )
  const start = clamp01(1 - others)
  return current.map((value, index) =>
    index === activeIndex ? start : clamp01(value),
  )
}

/** Deckkraft auf [0, 1]; die Summe soll nicht an einem Ausreißer kippen. */
function clamp01(value: number): number {
  return Math.min(1, Math.max(0, value))
}
