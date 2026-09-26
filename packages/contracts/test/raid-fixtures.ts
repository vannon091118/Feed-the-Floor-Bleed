import {
  CONTRACT_VERSION,
  type CombatLog,
  type CombatSummary,
  type RaidJob,
  type RaidSnapshot,
  sim_version,
  type UploadRequest,
} from '../src'

export const versions = {
  contractVersion: CONTRACT_VERSION,
  simVersion: sim_version,
}

export function dungeon() {
  const cells = Array(4096).fill(0) as Array<0 | 1 | 2 | 3 | 4>
  cells[0] = 3
  cells[4095] = 4
  return { cells, spawn: { x: 0, y: 0 }, boss: { x: 63, y: 63 } }
}

export function raidSnapshot(): RaidSnapshot {
  return {
    ...versions,
    resources: { gold: 120, materials: 7 },
    monsterSlots: [
      { monsterId: 'monster-1' },
      { monsterId: 'monster-2' },
      { monsterId: null },
      { monsterId: null },
      { monsterId: null },
    ],
    activeTeam: [{ heroId: 'hero-1', temporaryFatigue: 2, temporaryInjury: 0 }],
    dungeon: dungeon(),
  }
}

export function upload(): UploadRequest {
  return { ...raidSnapshot(), tactics: [['guard']] }
}

export const HASH = 'a1b2c3d4'

export function combatLog(): CombatLog {
  return {
    seed: 7,
    config: {
      tickRate: 20,
      maxTicks: 1800,
      attackRange: 1,
      damageFloor: 1000,
      variancePermille: 900,
      varianceSwing: 100,
    },
    units: [
      {
        id: 'hero-0',
        side: 'heroes',
        role: 'hero',
        maxHp: 60000,
        attack: 12000,
        defense: 3000,
        initiative: 500,
        moveCooldown: 2,
        attackCooldown: 3,
        routeIndex: 0,
      },
      {
        id: 'boss-0',
        side: 'monsters',
        role: 'boss',
        maxHp: 200000,
        attack: 16000,
        defense: 5000,
        initiative: 700,
        moveCooldown: 4,
        attackCooldown: 3,
        routeIndex: 3,
      },
    ],
    events: [
      {
        tick: 0,
        actorId: 'hero-0',
        targetId: '',
        fromIndex: 0,
        toIndex: 1,
        type: 'move',
        amount: 0,
        stage: 'running',
      },
      {
        tick: 5,
        actorId: '',
        targetId: '',
        toIndex: 0,
        fromIndex: 0,
        type: 'end',
        amount: 0,
        stage: 'timeout',
      },
    ],
    stage: 'timeout',
    ticks: 5,
    hash: HASH,
    trail: [
      { x: 0, y: 0, cell: 3 },
      { x: 1, y: 0, cell: 0 },
      { x: 2, y: 0, cell: 0 },
      { x: 3, y: 0, cell: 4 },
    ],
  }
}

export function combatSummary(): CombatSummary {
  return {
    stage: 'timeout',
    ticks: 5,
    hash: HASH,
    events: 2,
    attacks: 0,
    damage: 0,
    heroesAlive: 1,
    monstersAlive: 1,
    bossAlive: true,
  }
}

export function result() {
  return {
    ...versions,
    token: 'job-1',
    floor: 1,
    hash: HASH,
    summary: combatSummary(),
  }
}

export function logPayload() {
  return { ...versions, token: 'job-1', floor: 1, hash: HASH, log: combatLog() }
}

const jobBase = {
  ...versions,
  id: 'job-1',
  floor: 1,
  seed: 7,
  revision: 1,
  expiresAt: 900000,
}

export function acceptedJob(): RaidJob {
  return { ...jobBase, status: 'accepted' }
}

export function completedJob(): RaidJob {
  return { ...jobBase, status: 'completed', result: result() }
}

export function failedJob(): RaidJob {
  return {
    ...jobBase,
    status: 'failed',
    error: { ...versions, code: 'invalid-request', detail: 'tactics.0.1' },
  }
}

export function expiredJob(): RaidJob {
  return {
    ...jobBase,
    status: 'expired',
    error: { ...versions, code: 'timeout' },
  }
}
