import type { CombatLog } from '@floor/contracts'
import { computed, signal } from '@preact/signals'
import { buildTimelineSections, type TimelineSections } from './timeline-model'

export interface PlaybackLog {
  log: CombatLog
  sections: TimelineSections
}

export const playbackLog = signal<PlaybackLog | null>(null)
export const playbackTick = signal(0)
export const playbackPaused = signal(false)

/** Restanzeige nach dem Endzustand, bevor die Schleife von vorn beginnt. */
const LOOP_REST_TICKS = 30

/**
 * Setzt Log und Timeline-Abschnitte in einem Zug.
 *
 * Der Log wird einmalig aus der Szene hereingereicht, nicht hier gerechnet:
 * Der Store löst kein `resolveSnapshotRaid` aus und kann damit auch kein
 * Core-Replay triggern. Wechsel nur bei wirklich anderem Log.
 */
export function setPlaybackLog(log: CombatLog | null): void {
  const current = playbackLog.value
  if (log === (current?.log ?? null)) return
  playbackLog.value = log ? { log, sections: buildTimelineSections(log) } : null
  playbackTick.value = 0
}

/**
 * Führt den Loop-Schritt aus: ohne Pause schiebt der Tick weiter, bei Pause
 * bleibt der Scrubber-Stand liegen. Rückgabe ist der wirksame Playback-Tick.
 */
/**
 * Setzt den Scrubber auf einen Tick und klemmt ihn aufs Log-Ende.
 *
 * Der Schreiber ändert ausschließlich Signalwerte: Weder hier noch in den
 * Konsumierenden entsteht ein Core-Aufruf — die Szene rechnet den Zustand
 * zum Tick rein aus dem hereingereichten Log.
 */
export function setScrubTick(tick: number): void {
  const lastTick = playbackLog.value?.sections.lastTick ?? 0
  playbackTick.value = Math.min(Math.max(0, tick), lastTick)
}

export function stepPlayback(deltaMs: number, tickRate: number): number {
  if (!playbackLog.value || playbackPaused.value) return playbackTick.value
  const lastTick = playbackLog.value.sections.lastTick
  const total = lastTick + LOOP_REST_TICKS
  let tick = playbackTick.value + deltaMs / (1000 / tickRate)
  if (tick > total) tick = 0
  playbackTick.value = Math.floor(tick)
  return playbackTick.value
}

/** Aktive Route-Zelle des Log-Stands — für die Kamerazentrierung der Szene. */
export const playbackRouteIndex = computed(() => {
  const current = playbackLog.value
  const events = current?.log.events
  if (!current || !events) return -1
  const tick = playbackTick.value
  let index = -1
  for (const event of events) {
    if (event.tick > tick) break
    if (event.type === 'move' && event.toIndex > index) index = event.toIndex
  }
  return index
})

export function sectionsOf(): TimelineSections | null {
  return playbackLog.value?.sections ?? null
}
