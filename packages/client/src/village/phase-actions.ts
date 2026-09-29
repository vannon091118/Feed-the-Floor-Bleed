import type { TerminalRaidJob } from '@floor/contracts'
import { loadRaidLog, unloadRaidLog } from '../raid/combat-source'
import { fallenLootProfiles } from '../raid/loot-source'
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

/**
 * Raid starten. Der angenommene Übergang lädt den Lauf in den Playback-Store:
 * Die Timeline hängt am Raid, nicht an einer Ansicht, also darf sie weder im
 * Dorf noch im Dungeon auf eine Szene warten.
 */
export function triggerRaid(): boolean {
  const started = setPhase('raid')
  if (started) loadRaidLog()
  return started
}

/**
 * Ergebnisphase abschließen. Ein abgeschlossener Auftrag zählt den Tag hoch
 * und startet den nächsten Morgen, jeder andere Auftrag führt zurück in den
 * Raid und lässt die Nacht weiterlaufen. Beides geht über dieselbe Guarde.
 * Mit dem Tag endet auch der Lauf: Log und Tick gehören dem neuen Tag nicht.
 *
 * Der abgeschlossene Lauf zahlt seine Beute im selben Zug: die Gefallenen
 * kommen aus dem noch geladenen Log, und zwar **vor** dem Entladen — danach
 * gäbe es keine Quelle mehr für sie.
 */
export function finishResult(job: TerminalRaidJob): boolean {
  if (job.status !== 'completed') return setPhase('raid')
  if (!setPhase('tag', fallenLootProfiles())) return false
  unloadRaidLog()
  return true
}

/** UI-Frage: darf der Raid nach einem Ergebnis noch einmal laufen? */
export function retryAfterResult(job: TerminalRaidJob): boolean {
  return job.status !== 'completed'
}
