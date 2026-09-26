import {
  PHASE_LABELS,
  type PhaseId,
  type TimelineSections,
} from './timeline-model'

export interface PhaseNavProps {
  sections: TimelineSections
  activePhase: PhaseId
  onSelect: (tick: number) => void
}

/**
 * Drei Abschnitts-Knöpfe: Klick setzt den Scrubber auf den Phasenbeginn.
 * Ein `phase`-Datenattribut pro Knopf hält das Styling in der Stringmatrix.
 */
export function PhaseNav(props: PhaseNavProps) {
  const starts: Record<PhaseId, number> = {
    route: 0,
    combat: props.sections.combatStart,
    result: props.sections.lastTick,
  }
  const order: PhaseId[] = ['route', 'combat', 'result']
  return (
    <nav class="timeline-phase-nav" aria-label="Raid-Phasen">
      {order.map((phase) => (
        <button
          type="button"
          key={phase}
          class={`timeline-phase-step${phase === props.activePhase ? ' is-active' : ''}`}
          onClick={() => props.onSelect(starts[phase])}
        >
          {PHASE_LABELS[phase]}
        </button>
      ))}
    </nav>
  )
}
