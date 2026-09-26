/**
 * Phasen der Tag/Nacht/Raid-Schleife.
 *
 * Die Reihenfolge der Union ist die Reihenfolge der Schleife: `tag → night →
 * raid → result` und zurück zum `tag`. Jede Logik, die auf der Phase steht,
 * nutzt diese Typen statt eigener Strings.
 */
export type Phase = 'tag' | 'night' | 'raid' | 'result'

export const PHASE_ORDER: readonly Phase[] = ['tag', 'night', 'raid', 'result']

/** Ein erlaubter Übergang von → zu; alles andere ist ein Skip und wird verworfen. */
export interface PhaseTransition {
  from: Phase
  to: Phase
}

export const ALLOWED_TRANSITIONS: readonly PhaseTransition[] = [
  { from: 'tag', to: 'night' },
  { from: 'night', to: 'raid' },
  { from: 'raid', to: 'result' },
  { from: 'result', to: 'tag' },
  { from: 'result', to: 'raid' },
]

const INDEX = new Map<Phase, number>(PHASE_ORDER.map((p, i) => [p, i]))

/** Belt-Rang einer Phase in der Schleife; `undefined` bei unbekannter Phase. */
export function phaseRank(phase: Phase): number | undefined {
  return INDEX.get(phase)
}

function isTransitionAllowed(from: Phase, to: Phase): boolean {
  return ALLOWED_TRANSITIONS.some(
    (edge) => edge.from === from && edge.to === to,
  )
}

/**
 * Zulässige Vorwärtsübergänge: genau ein Schritt in der Schleifenreihenfolge.
 * `result → raid` ist bewusst kein Vorwärtszug, sondern der Retry-Rückweg.
 */
export function canAdvancePhase(from: Phase, to: Phase): boolean {
  const a = phaseRank(from)
  const b = phaseRank(to)
  if (a === undefined || b === undefined) return false
  return b === a + 1
}

/**
 * Einzige Phase-Entscheidung des Stores: erlaubt ist genau ein Schritt
 * vorwärts in der Schleifenreihenfolge oder einer der beiden Rückwege aus
 * dem Ergebnis (`result → tag` nach Abschluss, `result → raid` als Retry).
 * Ein `tag → raid`-Skip oder eine unbekannte Phase liefert `null`.
 */
export function resolvePhaseTransition(from: Phase, to: Phase): Phase | null {
  if (!isTransitionAllowed(from, to)) return null
  const forward = canAdvancePhase(from, to)
  const retry = from === 'result'
  return forward || retry ? to : null
}
