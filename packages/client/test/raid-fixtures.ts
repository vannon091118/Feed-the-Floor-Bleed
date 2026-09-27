import {
  CONTRACT_VERSION,
  sim_version,
  type TerminalRaidJob,
} from '@floor/contracts'
import {
  CellType,
  createDungeonGrid,
  findPath,
  resolveSnapshotRaid,
  setCell,
} from '@floor/sim-core'

/**
 * Auftrags-Literale für die Schleifentests.
 *
 * Die Schleife braucht für ihren Abschluss nur den Auftragsstatus, nicht den
 * echten Core-Lauf. Beide Dateien teilen sich diese zwei Fälle, damit es nur
 * eine Quelle für den Auftrag gibt.
 */
export const JOB: TerminalRaidJob = {
  status: 'completed',
  id: 'fixture-raid-1',
  seed: 1,
  contractVersion: CONTRACT_VERSION,
  simVersion: sim_version,
  floor: 1,
  revision: 1,
  expiresAt: 900000,
  result: {
    hash: 'h',
    token: 'fixture-raid-1',
    floor: 1,
    contractVersion: CONTRACT_VERSION,
    simVersion: sim_version,
    summary: {
      hash: 'h',
      stage: 'heroes-win',
      ticks: 1,
      events: 0,
      attacks: 0,
      damage: 0,
      heroesAlive: 3,
      monstersAlive: 0,
      bossAlive: false,
    },
  },
}

export const FAILED: TerminalRaidJob = {
  status: 'failed',
  id: 'fixture-raid-1',
  seed: 1,
  contractVersion: CONTRACT_VERSION,
  simVersion: sim_version,
  floor: 1,
  revision: 1,
  expiresAt: 900000,
  error: {
    contractVersion: CONTRACT_VERSION,
    simVersion: sim_version,
    code: 'blocked',
    detail: 'Route blockiert',
  },
}

/** Beide Route-Ausgänge zumauern erzwingt einen blockierten Auftrag. */
export function blockedGrid() {
  const grid = createDungeonGrid()
  setCell(grid, { x: 62, y: 63 }, CellType.Wall)
  setCell(grid, { x: 63, y: 62 }, CellType.Wall)
  return grid
}

/**
 * Deterministischer Core-Lauf als Timeline-Quelle.
 *
 * Grid, Route und Log kommen aus einem Aufruf: die Timeline- und die
 * Verdrahtungstests prüfen denselben Lauf, nicht zwei nachgebaute.
 */
export function fixtureRaidLog() {
  const grid = createDungeonGrid()
  const route = findPath(grid)
  const raid = resolveSnapshotRaid({
    grid,
    seed: 4242,
    teamSize: 3,
    monsterSlots: 2,
    floor: 1,
    token: 'fixture-raid-log',
  })
  return { grid, route, payload: raid.log, log: raid.log.log }
}
