import { useComputed } from '@preact/signals'
import { PhaseNav } from './phase-nav'
import { CombatPhase, ResultPhase, RoutePhase } from './phases'
import {
  playbackLog,
  playbackPaused,
  playbackTick,
  setScrubTick,
} from './playback'
import { PHASE_LABELS, phaseForTick } from './timeline-model'

/** Scrubbing pausiert: der gesetzte Stand soll nicht weglaufen. */
function scrubTo(tick: number): void {
  setScrubTick(tick)
  playbackPaused.value = true
}

/**
 * Wiedergabe-Steuerung des Raidfensters, über dem Inhalt und nicht in ihm.
 *
 * Die Trail-Liste ist länger als jedes Fenster, in dem sie steht. Liege die
 * Steuerung am Ende der Spalte, wäre sie genau dann unerreichbar, wenn der
 * Nutzer den Lauf sehen will; am Oberkant ist sie bei jedem Scrollstand
 * sichtbar und bedienbar. Sie liest denselben Store wie die Timeline.
 */
export function TimelineTransport() {
  const current = playbackLog.value
  if (!current) return null
  const lastTick = current.sections.lastTick
  const active = useComputed(() => Math.min(playbackTick.value, lastTick))
  const phase = useComputed(() =>
    phaseForTick(current.sections, playbackTick.value),
  )

  return (
    <div class="timeline-scrubber">
      <button
        type="button"
        class="timeline-scrub-step"
        aria-label="Ein Tick zurück"
        onClick={() => scrubTo(Math.max(0, active.value - 1))}
      >
        −
      </button>
      <input
        type="range"
        min={0}
        max={lastTick}
        value={active.value}
        aria-label="Tick-Index"
        onInput={(event) => scrubTo(Number(event.currentTarget.value))}
      />
      <span class="timeline-scrub-readout">
        Tick {active.value}/{lastTick} · {PHASE_LABELS[phase.value]}
      </span>
      <button
        type="button"
        class={
          playbackPaused.value
            ? 'timeline-scrub-step'
            : 'timeline-scrub-step is-live'
        }
        aria-label={
          playbackPaused.value
            ? 'Wiedergabe fortsetzen'
            : 'Wiedergabe pausieren'
        }
        onClick={() => {
          if (!playbackPaused.value) {
            playbackPaused.value = true
          } else {
            setScrubTick(playbackTick.value + 1)
            playbackPaused.value = false
          }
        }}
      >
        {playbackPaused.value ? '▶' : '❚❚'}
      </button>
    </div>
  )
}

/**
 * Die drei Phasen des geladenen Raid-Logs.
 *
 * Die Timeline konsumiert nur den hereingereichten CombatLog aus dem
 * Playback-Store; sie rechnet keinen Core-Aufruf und triggert kein Replay.
 * Die Steuerung darüber steht als `TimelineTransport` im Fensterkopf des
 * Inhalts, nicht mehr am Ende dieser Spalte.
 */
export function RaidTimeline() {
  const current = playbackLog.value
  if (!current) return null
  const { sections } = current

  const active = useComputed(() =>
    Math.min(playbackTick.value, sections.lastTick),
  )
  const phase = useComputed(() => phaseForTick(sections, playbackTick.value))

  return (
    <div class="raid-timeline">
      <PhaseNav
        sections={sections}
        activePhase={phase.value}
        onSelect={(tick) => scrubTo(tick)}
      />
      <RoutePhase scrub={scrubTo} active={active.value} />
      <CombatPhase />
      <ResultPhase />
    </div>
  )
}
