import { playbackLog } from './playback'
import {
  clusterEvents,
  type EventCluster,
  eventsByPhase,
  PHASE_LABELS,
  resultCard,
  STAGE_LABELS,
  TRAIL_BADGE_LABELS,
  trailBadge,
} from './timeline-model'

const CLUSTER_LABELS: Record<EventCluster['type'], string> = {
  move: 'Bewegung',
  attack: 'Angriff',
  death: 'Tod',
  end: 'Ende',
}

/** Routen-Phase: Trail-Zellen mit Falle-, Spawn- und Boss-Markierung. */
export function RoutePhase(props: {
  scrub: (tick: number) => void
  active: number
}) {
  const current = playbackLog.value
  if (!current) return null
  return (
    <section class="timeline-phase" data-phase="route">
      <h3>{PHASE_LABELS.route}</h3>
      <dl class="timeline-facts">
        <dt>Trail-Zellen</dt>
        <dd>{current.sections.trail.length}</dd>
        <dt>Dauer</dt>
        <dd>
          {current.sections.routeEnd} Ticks (0–{current.sections.routeEnd})
        </dd>
      </dl>
      <ol class="timeline-trail">
        {current.sections.trail.map((step) => {
          const badge = trailBadge(step.entry.cell)
          return (
            <li key={step.index}>
              <button
                type="button"
                class={
                  badge
                    ? `timeline-cell timeline-cell--${badge}`
                    : 'timeline-cell'
                }
                aria-current={step.index === props.active ? 'true' : undefined}
                title={`Zelle ${step.index}: ${step.entry.x},${step.entry.y}${badge ? ` (${TRAIL_BADGE_LABELS[badge]})` : ''}`}
                onClick={() =>
                  props.scrub(Math.min(step.index, current.sections.routeEnd))
                }
              >
                {step.index}
              </button>
            </li>
          )
        })}
      </ol>
      <p class="timeline-hint">
        Falle, Spawn und Boss hervorgehoben; Klick springt zum Tick.
      </p>
    </section>
  )
}

/** Kampf-Phase: Ereignisse geclustert nach Ticker-Klasse. */
export function CombatPhase() {
  const current = playbackLog.value
  if (!current) return null
  const buckets = eventsByPhase(current.log, current.sections)
  const clusters = clusterEvents(buckets.combat)
  return (
    <section class="timeline-phase" data-phase="combat">
      <h3>{PHASE_LABELS.combat}</h3>
      <p class="timeline-hint">
        {buckets.combat.length} Ereignisse, geclustert nach Klasse:
      </p>
      <ul class="timeline-clusters">
        {clusters.map((cluster) => (
          <li key={cluster.type}>
            <span class="timeline-cluster-type">
              {CLUSTER_LABELS[cluster.type]}
            </span>{' '}
            × {cluster.count}
          </li>
        ))}
      </ul>
    </section>
  )
}

/** Ergebnis-Phase: Stage, Überlebende und Boss-Status als Karte. */
export function ResultPhase() {
  const current = playbackLog.value
  if (!current) return null
  const card = resultCard(current.log)
  return (
    <section class="timeline-phase" data-phase="result">
      <h3>{PHASE_LABELS.result}</h3>{' '}
      <output
        class={
          card.timeout
            ? 'timeline-result timeline-result--timeout'
            : `timeline-result timeline-result--${card.stage}`
        }
      >
        {card.timeout
          ? 'Zeitlimit erreicht — kein Sieger'
          : STAGE_LABELS[card.stage]}
      </output>
      <dl class="timeline-facts">
        <dt>Überlebende Helden</dt>
        <dd>{card.heroes}</dd>
        <dt>Überlebende Monster</dt>
        <dd>{card.monsters}</dd>
        <dt>Boss</dt>
        <dd>{card.bossAlive ? 'steht' : 'gefällt'}</dd>
      </dl>
    </section>
  )
}
