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

/**
 * Die drei Phasen des geladenen Raid-Logs plus Scrubber.
 *
 * Die Timeline konsumiert nur den hereingereichten CombatLog aus dem
 * Playback-Store; sie rechnet keinen Core-Aufruf und triggert kein Replay.
 * Der Scrubber schreibt ausschließlich den `playbackTick`-Signalwert, den die
 * Szene als Sendezeit in `observe()` liest.
 */
export function RaidTimeline() {
  const current = playbackLog.value
  if (!current) return null
  const { sections } = current

  const active = useComputed(() =>
    Math.min(playbackTick.value, sections.lastTick),
  )
  const phase = useComputed(() => phaseForTick(sections, playbackTick.value))

  const scrub = (tick: number): void => {
    setScrubTick(tick)
    playbackPaused.value = true
  }

  return (
    <div class="raid-timeline">
      <PhaseNav
        sections={sections}
        activePhase={phase.value}
        onSelect={(tick) => scrub(tick)}
      />
      <RoutePhase scrub={scrub} active={active.value} />
      <CombatPhase />
      <ResultPhase />
      <div class="timeline-scrubber">
        <button
          type="button"
          class="timeline-scrub-step"
          aria-label="Ein Tick zurück"
          onClick={() => scrub(Math.max(0, active.value - 1))}
        >
          −
        </button>
        <input
          type="range"
          min={0}
          max={sections.lastTick}
          value={active.value}
          aria-label="Tick-Index"
          onInput={(event) => scrub(Number(event.currentTarget.value))}
        />
        <span class="timeline-scrub-readout">
          Tick {active.value}/{sections.lastTick} · {PHASE_LABELS[phase.value]}
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
    </div>
  )
}
