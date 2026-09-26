import type { Phase } from '../village/phase'
import { dayNight } from '../village/state'

const PHASE_TEXT: Record<Phase, string> = {
  tag: 'Tag',
  night: 'Nacht',
  raid: 'Raid',
  result: 'Ergebnis',
}

/**
 * Schleifen-Anzeige in der Topbar.
 *
 * Liest ausschließlich den Phase-Owner und zeigt den laufenden Tag neben der
 * Phase. Kein eigener Zustand, keine Ableitung, keine Spielentscheidung.
 */
export function PhaseBadge() {
  const { phase, day } = dayNight.value
  return (
    <span class="phase-badge" aria-live="polite">
      <span class="phase-badge__day tnum">Tag {day}</span>
      <span class="phase-badge__phase">{PHASE_TEXT[phase]}</span>
    </span>
  )
}
