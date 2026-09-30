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
  type SnapshotRaidInput,
} from '@floor/sim-core'
import { fixture, fixtureRaid } from '../fixture-data'
import { dayNight } from '../village/state'

/**
 * Die Aufstellung, aus der **beide** Kampfwege ihren Lauf bauen.
 *
 * Probelauf und Timeline gingen über zwei Aufrufe, die ihre Eingaben selbst
 * zusammenbauten — Team, Verteidiger, Seed und Etage an zwei Stellen. Jede neue
 * Kampf-Eingabe musste damit an beiden landen; am 2026-09-29 brauchte das erst
 * eine eigene Ableitung, weil die Nachwirkung sonst nur im Auftrag angekommen
 * wäre. Diese Funktion ist jetzt die einzige Ableitung, und
 * `buildFixtureUpload` wie `snapshotInput` lesen beide hier.
 */
export function fixtureAufstellung(): Pick<
  UploadRequest,
  'activeTeam' | 'monsterSlots' | 'tactics'
> {
  return {
    activeTeam: fixture.team.map((hero) => ({
      heroId: hero.id,
      temporaryFatigue: hero.fatigue,
      temporaryInjury: hero.injury,
    })),
    monsterSlots: fixture.monsterSlots.map((slot) => ({ ...slot })),
    tactics: fixture.team.map((hero) => [...hero.tactics]),
  }
}

/**
 * Dieselbe Aufstellung als Eingabe des Core-Aufrufs.
 *
 * `floor` ist ein Parameter und keine Konstante, weil genau hier die beiden Wege
 * eine verschiedene Frage beantworten: Das Dorf zählt die Etage, die es in
 * Besitz hält, ein eingefrorener Auftrag die Etage, unter der er entstanden ist.
 * Ein Replay kauft keine Etage nach. Die Etage wandert in die Envelope und nicht
 * in den Log — die Simulationslogik kennt sie nicht —, deshalb liefern beide
 * Wege heute denselben Lauf. `test/raid-timeline.test.ts` pinnt genau das über
 * beide Wege, damit diese Zeile nicht still falsch wird.
 */
export function snapshotInput(
  grid: DungeonGrid,
  floor: number,
): SnapshotRaidInput {
  const { activeTeam, monsterSlots } = fixtureAufstellung()
  return {
    grid,
    teamSize: activeTeam.length,
    team: activeTeam,
    defenders: monsterSlots.map((slot) => ({ baseId: slot.monsterId })),
    seed: fixtureRaid.seed,
    floor,
    token: fixtureRaid.jobId,
  }
}

/**
 * Versionierter Upload aus dem Editor-Grid und der Fixture-Aufstellung.
 * `contractVersion` und `simVersion` kommen aus `@floor/contracts` und werden
 * hier nicht als Zahl abgeschrieben.
 *
 * Der Client *rechnet* hier nichts: Aufstellung und Taktiken kommen aus den
 * Fixture-Daten, der Bestand aus dem Dorf-Owner, das Grid aus dem Editor-State;
 * der Core entscheidet anschließend allein, was daraus wird. Die Aufstellung
 * steht in einer Datei namens `fixture-data.ts` und ist trotzdem Produktstand:
 * sie bestimmt, wer angreift und wer verteidigt.
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
    dungeon: fromDungeonGrid(grid),
    ...fixtureAufstellung(),
  }
}

/**
 * Lokaler Probelauf ohne Server, Queue und Uhr. Ergebnis, Fehler und
 * Auftrags-Timeout kommen als validierter Auftrag zurück.
 */
export function runLocalFixtureRaid(grid: DungeonGrid): TerminalRaidJob {
  // Seed, Token und Etage kommen aus derselben Ableitung wie die Timeline; der
  // Auftrag fügt nur den Upload hinzu, den `runFixtureRaid` erst validiert.
  const eingang = snapshotInput(grid, dayNight.value.village.floors)
  return runFixtureRaid({
    upload: buildFixtureUpload(grid),
    jobId: eingang.token,
    seed: eingang.seed,
    floor: eingang.floor,
    createdAt: fixtureRaid.createdAt,
    observedAt: fixtureRaid.observedAt,
  })
}
