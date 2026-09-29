import { summarizeCombat } from '@floor/sim-core'
import { playbackLog } from './playback'
import {
  ambushEvents,
  clusterEvents,
  type EventCluster,
  eventsByPhase,
  PHASE_LABELS,
  STAGE_LABELS,
  TRAIL_BADGE_LABELS,
  trailBadge,
} from './timeline-model'

const CLUSTER_LABELS: Record<EventCluster['type'], string> = {
  move: 'Bewegung',
  attack: 'Angriff',
  death: 'Tod',
  ambush: 'Hinterhalt',
  ability: 'Fähigkeit',
  reveal: 'Aufdeckung',
  end: 'Ende',
}

/** Routen-Phase: Trail-Zellen mit Platzierungs-, Spawn- und Boss-Markierung. */
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
        Platzierung, Spawn und Boss hervorgehoben; Klick springt zum Tick.
      </p>
    </section>
  )
}

/**
 * Kampf-Phase: Ereignisse geclustert nach Ticker-Klasse, der Hinterhalt einzeln.
 *
 * Die Klasse zählt, der Hinterhalt steht als eigener Eintrag mit seinem Tick
 * darunter: er ist ein einmaliges Ereignis pro Verteidiger und keine Menge, die
 * man nur als Zahl liest. Ein Klick auf den Eintrag springt zum Tick — dieselbe
 * Geste wie bei den Trail-Zellen der Routen-Phase.
 */
export function CombatPhase(props: { scrub: (tick: number) => void }) {
  const current = playbackLog.value
  if (!current) return null
  const buckets = eventsByPhase(current.log, current.sections)
  const clusters = clusterEvents(buckets.combat)
  const ambushes = ambushEvents(current.log)
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
      {ambushes.length > 0 && (
        <ol class="timeline-events">
          {ambushes.map((ambush) => (
            <li key={`${ambush.actorId}-${ambush.tick}`}>
              <button
                type="button"
                class="timeline-event"
                onClick={() => props.scrub(ambush.tick)}
              >
                Hinterhalt bei Tick {ambush.tick}: ein Verteidiger überrascht{' '}
                {ambush.target}
              </button>
            </li>
          ))}
        </ol>
      )}
    </section>
  )
}

/**
 * Ergebnis-Phase: Stage, Überlebende und Boss-Status als Karte.
 *
 * Die Zahlen kommen aus `summarizeCombat` und nicht aus einer zweiten Zählung:
 * dieselbe Funktion erzeugt die Summary des Auftrags und damit die Bilanz im
 * Dorf und im Ergebnis-Panel. Die Timeline hält nur den Log, nicht den Auftrag,
 * deshalb leitet sie die Kurzfassung aus dem Log ab statt sie zu kopieren.
 */
export function ResultPhase() {
  const current = playbackLog.value
  if (!current) return null
  const summary = summarizeCombat(current.log)
  const timeout = summary.stage === 'timeout'
  return (
    <section class="timeline-phase" data-phase="result">
      <h3>{PHASE_LABELS.result}</h3>{' '}
      <output
        class={
          timeout
            ? 'timeline-result timeline-result--timeout'
            : `timeline-result timeline-result--${summary.stage}`
        }
      >
        {timeout
          ? 'Zeitlimit erreicht — kein Sieger'
          : STAGE_LABELS[summary.stage]}
      </output>
      <dl class="timeline-facts">
        <dt>Überlebende Helden</dt>
        <dd>{summary.heroesAlive}</dd>
        <dt>Überlebende Monster</dt>
        <dd>{summary.monstersAlive}</dd>
        <dt>Boss</dt>
        <dd>{summary.bossAlive ? 'steht' : 'gefällt'}</dd>
      </dl>
    </section>
  )
}
