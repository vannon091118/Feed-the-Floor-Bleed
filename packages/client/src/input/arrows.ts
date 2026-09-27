/**
 * Pfeiltasten als Richtungsschritt.
 *
 * Eine Abbildung für beide Tastaturpfade: der Fensterrahmen und die Weltansicht
 * fragen hier, welche Pfeiltaste in welche Richtung zeigt, und multiplizieren das
 * Ergebnis mit ihrer eigenen Schrittweite. Die Abbildung stand vorher zweimal im
 * Repo — je vier Ternäre in `window/keys.ts` und `render/camera-keys.ts`, mit
 * eigenen Konstanten —, und die beiden Kopien hätten auseinanderlaufen können.
 *
 * Rein rechnend und ohne DOM: die Verdrahtung liegt bei den Aufrufern.
 */
export interface ArrowDirection {
  /** −1, 0 oder 1; rechts ist positiv. */
  dx: number
  /** −1, 0 oder 1; unten ist positiv. */
  dy: number
}

/** Richtung je Pfeiltaste; jede andere Taste steht nicht in der Tabelle. */
const DIRECTIONS: Record<string, ArrowDirection> = {
  ArrowRight: { dx: 1, dy: 0 },
  ArrowLeft: { dx: -1, dy: 0 },
  ArrowDown: { dx: 0, dy: 1 },
  ArrowUp: { dx: 0, dy: -1 },
}

/** Richtung einer Pfeiltaste — `null` heißt: die Taste gehört nicht dazu. */
export function arrowDirection(key: string): ArrowDirection | null {
  return DIRECTIONS[key] ?? null
}
