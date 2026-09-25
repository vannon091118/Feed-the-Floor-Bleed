import {
  CONTRACT_VERSION,
  type TerminalRaidJob,
  type UploadRequest,
  sim_version,
} from '@floor/contracts'
import {
  type DungeonGrid,
  fromDungeonGrid,
  runFixtureRaid,
} from '@floor/sim-core'
import { fixture, fixtureRaid } from '../fixture-data'

/**
 * Contract-v2-Upload aus dem Editor-Grid und der Fixture-Aufstellung.
 *
 * Der Client *erfindet* hier nichts: Aufstellung, Ressourcen und Taktiken
 * kommen aus den Fixture-Daten, das Grid aus dem Editor-State. Der Core
 * entscheidet anschließend allein, was daraus wird.
 */
export function buildFixtureUpload(grid: DungeonGrid): UploadRequest {
  return {
    contractVersion: CONTRACT_VERSION,
    simVersion: sim_version,
    resources: { ...fixture.resources },
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
    floor: fixtureRaid.floor,
    createdAt: fixtureRaid.createdAt,
    observedAt: fixtureRaid.observedAt,
  })
}
