import {
  CONTRACT_VERSION,
  RaidJobSchema,
  type UploadRequest,
  sim_version,
} from '@floor/contracts'
import { describe, expect, it } from 'vitest'
import { toDungeonGrid } from '../grid'
import { runFixtureRaid } from './fixture-job'
import { replayCombat } from './replay'
import { resolveSnapshotRaid } from './resolve-snapshot'
import { defaultCombatConfig } from './rules'

const base = {
  jobId: 'job-1',
  seed: 42,
  floor: 1,
  createdAt: 1_000,
  observedAt: 2_000,
}

type Cells = UploadRequest['dungeon']['cells']

/** Eigenständiger Core-Test-Upload; bewusst keine Fremd-Domain-Fixture. */
function upload(): UploadRequest {
  const cells = Array(4096).fill(0) as Cells
  cells[0] = 3
  cells[4095] = 4
  return {
    contractVersion: CONTRACT_VERSION,
    simVersion: sim_version,
    resources: { gold: 42, materials: 3 },
    monsterSlots: [
      { monsterId: 'sim-monster-a' },
      { monsterId: 'sim-monster-b' },
      { monsterId: null },
      { monsterId: null },
      { monsterId: null },
    ],
    activeTeam: [
      { heroId: 'sim-hero-1', temporaryFatigue: 0, temporaryInjury: 0 },
    ],
    dungeon: { cells, spawn: { x: 0, y: 0 }, boss: { x: 63, y: 63 } },
    tactics: [['hold']],
  }
}

function blockedUpload(): UploadRequest {
  const source = upload()
  const cells = [...source.dungeon.cells]
  cells[63 * 64 + 62] = 1
  cells[62 * 64 + 63] = 1
  return {
    ...source,
    dungeon: { ...source.dungeon, cells: cells as Cells },
  }
}

describe('Lokale Fixture-Job-Ausführung', () => {
  it('liefert einen abgeschlossenen Job mit Ergebnis und Log', () => {
    const job = runFixtureRaid({ ...base, upload: upload() })
    expect(RaidJobSchema.safeParse(job).success).toBe(true)
    expect(job.status).toBe('completed')
    if (job.status !== 'completed') return
    expect(job.result.hash).toMatch(/^[0-9a-f]{8}$/)
    expect(job.result.summary.hash).toBe(job.result.hash)
    expect(job.result.summary.events).toBeGreaterThan(0)
  })

  it('hält Ergebnis und Log über einen JSON-Roundtrip stabil', () => {
    const job = runFixtureRaid({ ...base, upload: upload() })
    const roundTrip = JSON.parse(JSON.stringify(job))
    expect(roundTrip).toEqual(job)
    expect(RaidJobSchema.parse(roundTrip)).toEqual(job)
  })

  it('replayt den serialisierten Log zu denselben Hash', () => {
    const job = runFixtureRaid({ ...base, upload: upload() })
    if (job.status !== 'completed') throw new Error('Fixture muss abschließen')
    const wire = JSON.parse(JSON.stringify(job.result))
    expect(wire.summary.hash).toBe(job.result.hash)
    expect(wire.summary.hash).toBe(job.result.summary.hash)
    const again = runFixtureRaid({ ...base, upload: upload() })
    if (again.status !== 'completed')
      throw new Error('Fixture muss abschließen')
    expect(again.result.hash).toBe(job.result.hash)
  })

  it('liefert den Log als eigenes Artefakt, das denselben Hash replayt', () => {
    const raid = resolveSnapshotRaid({
      grid: toDungeonGrid(upload().dungeon),
      teamSize: 1,
      monsterSlots: 2,
      seed: base.seed,
      floor: base.floor,
      token: base.jobId,
    })
    expect(raid.log.hash).toBe(raid.result.hash)
    const wire = JSON.parse(JSON.stringify(raid.log))
    expect(replayCombat(wire.log).hash).toBe(raid.log.hash)
  })

  it('meldet einen ungültigen Upload als Fehler mit Feldpfad', () => {
    const job = runFixtureRaid({
      ...base,
      upload: { ...upload(), tactics: [] },
    })
    expect(job.status).toBe('failed')
    if (job.status !== 'failed') return
    expect(job.error.code).toBe('invalid-request')
    expect(job.error.detail).toBe('tactics')
  })

  it('trennt den Auftrags-Timeout vom Ergebnis', () => {
    const job = runFixtureRaid({
      ...base,
      upload: upload(),
      observedAt: 1_000_000,
    })
    expect(job.status).toBe('expired')
    expect(RaidJobSchema.safeParse(job).success).toBe(true)
  })

  it('treatiert den Kampf-Timeout als erfolgreiches Ergebnis', () => {
    const job = runFixtureRaid({
      ...base,
      upload: upload(),
      config: { ...defaultCombatConfig(), maxTicks: 4 },
    })
    expect(job.status).toBe('completed')
    if (job.status !== 'completed') return
    expect(job.result.summary.stage).toBe('timeout')
    expect(job.result.summary.ticks).toBe(4)
  })

  it('blockiert einen Snapshot ohne erreichbare Route', () => {
    const job = runFixtureRaid({ ...base, upload: blockedUpload() })
    expect(job.status).toBe('failed')
    if (job.status !== 'failed') return
    expect(job.error.code).toBe('blocked')
    expect(job.error.detail).toBe('dungeon.route')
  })
})
