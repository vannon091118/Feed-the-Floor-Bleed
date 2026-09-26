import type { TerminalRaidJob } from '@floor/contracts'
import { signal } from '@preact/signals'
import { fixture } from '../fixture-data'
import { type Phase, resolvePhaseTransition } from './phase'

/**
 * DayNightState: einziger Owner der Schleifenphase.
 *
 * Die UI liest und schreibt nur über diesen Store. `phase` hält den
 * Schleifenzustand, `day` zählt abgeschlossene Tage hoch, `job` hält das
 * TerminalRaidJob-Ergebnis der letzten Nacht. Keine zweite Phase-Wahrheit
 * in Komponenten, kein lokaler useState neben dem Store.
 */
export interface DayNightState {
  phase: Phase
  day: number
  job: TerminalRaidJob | null
}

export const dayNight = signal<DayNightState>({
  phase: 'tag',
  day: fixture.day,
  job: null,
})

/**
 * Einziger Schreibpfad auf die Phase. Übergänge laufen durch
 * `resolvePhaseTransition`; ein abgelehnter Übergang verändert nichts und
 * meldet `false`. Der Aufrufer entscheidet, ob eine Abweisung sichtbar wird.
 */
export function setPhase(to: Phase): boolean {
  const current = dayNight.value
  const next = resolvePhaseTransition(current.phase, to)
  if (next === null) return false
  const completed = current.phase === 'result' && next === 'tag'
  dayNight.value = {
    phase: next,
    day: completed ? current.day + 1 : current.day,
    job: next === 'tag' ? null : current.job,
  }
  return true
}

/**
 * Terminaler Fixture-Auftrag der laufenden Nacht. Nur in der Raid-Phase
 * zulässig; der Auftrag wird gespeichert, die Phase bleibt unverändert.
 */
export function recordRaidJob(job: TerminalRaidJob): boolean {
  if (dayNight.value.phase !== 'raid') return false
  dayNight.value = { ...dayNight.value, job }
  return true
}

/** Test- und Demo-Hilfe: exakt der Startzustand der Schleife. */
export function resetDayNight(): void {
  dayNight.value = { phase: 'tag', day: fixture.day, job: null }
}
