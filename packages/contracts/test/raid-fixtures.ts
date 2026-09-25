import {
  CONTRACT_VERSION,
  type RaidSnapshot,
  type UploadRequest,
  sim_version,
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
