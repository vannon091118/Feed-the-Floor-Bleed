import type { Phase } from '../village/phase'
import { dayNight } from '../village/state'

const PHASE_TEXT: Record<Phase, string> = {
  tag: 'Tag',
  night: 'Nacht',
  raid: 'Raid',
  result: 'Ergebnis',
}

/**
 * Schleifen-Badge in der Topbar: liest ausschließlich den Phase-Store und
 * beschriftet die aktuelle Phase mit dem laufenden Tag.
 */
export function PhaseBadge() {
  const state = dayNight.value
  const label =
    state.phase === 'tag'
      ? `Tag ${state.day}`
      : `${PHASE_TEXT[state.phase]} · Tag ${state.day}`
  return (
    <span class="phase-badge" aria-live="polite">
      {label}
    </span>
  )
}
