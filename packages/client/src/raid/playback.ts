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
 * Laufzeit mit Rest, nicht nur der angezeigte Tick.
 *
 * `playbackTick` zeigt ganze Ticks; der Rest muss daneben überleben. Wird er
 * pro Frame weggeworfen, kommt der Lauf nie voran: ein 60-Hz-Frame dauert
 * 16,7 ms, ein Tick bei Rate 20 dagegen 50 ms — der Playback bliebe bei 0
 * stehen, bis ein einzelnes Frame länger als ein ganzer Tick dauert.
 */
let tickBudget = 0

/** Setzt Anzeige und Rest gemeinsam; nur so bleiben beide konsistent. */
function setTick(tick: number): void {
  tickBudget = tick
  playbackTick.value = tick
}

/**
 * Setzt Log und Timeline-Abschnitte in einem Zug.
 *
 * Der Log kommt aus dem Raid-Fach (`raid/combat-source.ts`), nicht aus einer
 * Szene und nicht aus diesem Store: er löst hier kein `resolveSnapshotRaid` aus
 * und kann damit auch kein Core-Replay triggern. Wechsel nur bei wirklich
 * anderem Log.
 */
export function setPlaybackLog(log: CombatLog | null): void {
  const current = playbackLog.value
  if (log === (current?.log ?? null)) return
  playbackLog.value = log ? { log, sections: buildTimelineSections(log) } : null
  setTick(0)
}

/**
 * Setzt den Scrubber auf einen Tick und klemmt ihn aufs Log-Ende.
 *
 * Der Schreiber ändert ausschließlich Signalwerte: Weder hier noch in den
 * Konsumierenden entsteht ein Core-Aufruf — die Szene rechnet den Zustand
 * zum Tick rein aus dem hereingereichten Log. Der Rest wandert mit, sonst
 * überschriebe der nächste Frame den gesetzten Stand sofort wieder.
 */
export function setScrubTick(tick: number): void {
  const lastTick = playbackLog.value?.sections.lastTick ?? 0
  setTick(Math.min(Math.max(0, tick), lastTick))
}

/**
 * Führt den Loop-Schritt aus: ohne Pause schiebt der Tick weiter, bei Pause
 * bleibt der Scrubber-Stand liegen. Die Takt-Rate kommt aus dem geladenen Log,
 * damit kein Aufrufer eine zweite Zahlenquelle anfassen muss. Rückgabe ist der
 * wirksame Playback-Tick.
 */
export function stepPlayback(deltaMs: number): number {
  const current = playbackLog.value
  if (!current || playbackPaused.value) return playbackTick.value
  const total = current.sections.lastTick + LOOP_REST_TICKS
  const next = tickBudget + deltaMs / (1000 / current.log.config.tickRate)
  // Am Loop-Ende bleibt nur der Überstand für den neuen Durchlauf.
  tickBudget = next > total ? next - total : next
  playbackTick.value = Math.floor(tickBudget)
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
