import type { TerminalRaidJob } from '@floor/contracts'
import { recordRaidJob, setPhase } from './state'
import { depositLoot, settleVillageDay } from './treasury'

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
 * Core entgegen, legt ihn im Store ab, stellt die daraus abgeleitete Beute zum
 * Verkauf bereit und schaltet auf `result` um. Nur aus der Raid-Phase
 * zulässig.
 */
export function completeRaid(job: TerminalRaidJob): boolean {
  if (!recordRaidJob(job)) return false
  depositLoot(job)
  return setPhase('result')
}

export function triggerRaid(): boolean {
  return setPhase('raid')
}

/**
 * Ergebnisphase abschließen. Ein abgeschlossener Auftrag zählt den Tag hoch,
 * rechnet die Wirtschaft ab und startet den nächsten Morgen; jeder andere
 * Auftrag führt zurück in den Raid und lässt die Nacht weiterlaufen, dann wird
 * nichts abgerechnet. Beides geht über dieselbe Guarde.
 */
export function finishResult(job: TerminalRaidJob): boolean {
  const target = job.status === 'completed' ? 'tag' : 'raid'
  if (!setPhase(target)) return false
  if (target === 'tag') settleVillageDay()
  return true
}

/** UI-Frage: darf der Raid nach einem Ergebnis noch einmal laufen? */
export function retryAfterResult(job: TerminalRaidJob): boolean {
  return job.status !== 'completed'
}
