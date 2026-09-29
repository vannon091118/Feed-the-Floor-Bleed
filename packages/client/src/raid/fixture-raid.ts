import {
  CONTRACT_VERSION,
  sim_version,
  type TerminalRaidJob,
  type UploadRequest,
} from '@floor/contracts'
import {
  type DungeonGrid,
  fromDungeonGrid,
  runFixtureRaid,
} from '@floor/sim-core'
import { fixture, fixtureRaid } from '../fixture-data'
import { dayNight } from '../village/state'

/**
 * Contract-v4-Upload aus dem Editor-Grid und der Fixture-Aufstellung.
 *
 * Der Client *erfindet* hier nichts: Aufstellung und Taktiken kommen aus den
 * Fixture-Daten, der Bestand aus dem Dorf-Owner, das Grid aus dem Editor-State.
 * Der Core entscheidet anschließend allein, was daraus wird.
 *
 * Der Bestand ist der des Dorfes und nicht der Startbestand der Config: Seit es
 * Bau- und Ausbaukommandos gibt, wäre ein fester Startwert eine Lüge — der
 * Verteidiger schickte dann, was er nie hatte, und der Angreifer rechnete gegen
 * einen Bestand, den es nicht gibt.
 */
export function buildFixtureUpload(grid: DungeonGrid): UploadRequest {
  return {
    contractVersion: CONTRACT_VERSION,
    simVersion: sim_version,
    resources: { ...dayNight.value.village.resources },
    monsterSlots: fixture.monsterSlots.map((slot) => ({ ...slot })),
    activeTeam: fixture.team.map((hero) => ({
      heroId: hero.id,
      temporaryFatigue: hero.fatigue,
      temporaryInjury: hero.injury,
    })),
    dungeon: fromDungeonGrid(grid),
    tactics: fixture.team.map((hero) => [...hero.tactics]),
  }
}

/**
 * Lokaler Probelauf ohne Server, Queue und Uhr. Ergebnis, Fehler und
 * Auftrags-Timeout kommen als validierter Auftrag zurück.
 */
export function runLocalFixtureRaid(grid: DungeonGrid): TerminalRaidJob {
  return runFixtureRaid({
    upload: buildFixtureUpload(grid),
    jobId: fixtureRaid.jobId,
    seed: fixtureRaid.seed,
    floor: dayNight.value.village.floors,
    createdAt: fixtureRaid.createdAt,
    observedAt: fixtureRaid.observedAt,
  })
}
