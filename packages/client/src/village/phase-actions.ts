import type { TerminalRaidJob } from '@floor/contracts'
import { recordRaidJob, setPhase } from './state'

/**
 * Phasen-Kommandos der UI: jedes Kommando ist ein benannter Übergang und
 * enthält selbst keine Spielregel. Die Result-Nachfolge entscheidet der
 * Auftragsstatus, nicht die Komponente.
 */
export function startNight(): boolean {
  return setPhase('night')
}

/**
 * Fixture-Raid der laufenden Nacht: nimmt den terminalen Auftrag aus dem
 * Core entgegen, legt ihn im Store ab und schaltet auf `result` um. Nur
 * aus der Raid-Phase zulässig.
 */
export function completeRaid(job: TerminalRaidJob): boolean {
  if (!recordRaidJob(job)) return false
  return setPhase('result')
}

export function triggerRaid(): boolean {
  return setPhase('raid')
}

/**
 * Ergebnisphase abschließen. Ein abgeschlossener Auftrag zählt den Tag hoch
 * und startet den nächsten Morgen, jeder andere Auftrag führt zurück in den
 * Raid und lässt die Nacht weiterlaufen. Beides geht über dieselbe Guarde.
 */
export function finishResult(job: TerminalRaidJob): boolean {
  return setPhase(job.status === 'completed' ? 'tag' : 'raid')
}

/** UI-Frage: darf der Raid nach einem Ergebnis noch einmal laufen? */
export function retryAfterResult(job: TerminalRaidJob): boolean {
  return job.status !== 'completed'
}
