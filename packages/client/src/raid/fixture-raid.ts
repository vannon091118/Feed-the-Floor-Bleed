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
  type TeamCondition,
} from '@floor/sim-core'
import { fixture, fixtureRaid } from '../fixture-data'
import { dayNight } from '../village/state'

/**
 * Der Zustand des Teams, wie er in den Kampf reist.
 *
 * `activeTeam` im Upload und die Nachwirkung am Kampf-Spec sind dieselben zwei
 * Zahlen aus derselben Fixture; sie hier einmal abzuleiten hält sie an einer
 * Quelle statt an einer je Aufrufer.
 */
export function fixtureTeamConditions(): TeamCondition[] {
  return fixture.team.map((hero) => ({
    temporaryFatigue: hero.fatigue,
    temporaryInjury: hero.injury,
  }))
}

/**
 * Versionierter Upload aus dem Editor-Grid und der Fixture-Aufstellung.
 * `contractVersion` und `simVersion` kommen aus `@floor/contracts` und werden
 * hier nicht als Zahl abgeschrieben.
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
  const conditions = fixtureTeamConditions()
  return {
    contractVersion: CONTRACT_VERSION,
    simVersion: sim_version,
    resources: { ...dayNight.value.village.resources },
    monsterSlots: fixture.monsterSlots.map((slot) => ({ ...slot })),
    activeTeam: fixture.team.map((hero, index) => ({
      heroId: hero.id,
      ...conditions[index],
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
