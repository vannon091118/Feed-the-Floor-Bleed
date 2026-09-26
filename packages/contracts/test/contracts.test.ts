import { describe, expect, it } from 'vitest'
import {
  CellType,
  createDungeonGrid,
  findPath,
  setCell,
} from '../../sim-core/src'
import {
  DungeonGridSchema,
  ErrorCodeSchema,
  ErrorPayloadSchema,
  MatchResponseSchema,
  PathResultSchema,
  ResultPayloadSchema,
  UploadRequestSchema,
} from '../src'
import {
  dungeon,
  raidSnapshot,
  result as resultFixture,
  upload,
  versions,
} from './raid-fixtures'

function straightCorridor() {
  const grid = createDungeonGrid()
  for (let y = 0; y < 64; y += 1)
    for (let x = 0; x < 64; x += 1)
      if ((x !== 0 || y !== 0) && (x !== 63 || y !== 63))
        setCell(grid, { x, y }, CellType.Wall)
  for (let x = 1; x < 64; x += 1) setCell(grid, { x, y: 0 }, CellType.Empty)
  for (let y = 1; y < 63; y += 1) setCell(grid, { x: 63, y }, CellType.Empty)
  return grid
}

describe('Versionierte Contracts', () => {
  it('akzeptiert die dokumentierten Upload-, Match- und Result-Payloads', () => {
    const request = upload()
    const match = { ...versions, seed: 42, snapshot: raidSnapshot(), floor: 1 }
    const result = resultFixture()

    expect(UploadRequestSchema.safeParse(request).success).toBe(true)
    expect(MatchResponseSchema.safeParse(match).success).toBe(true)
    expect(ResultPayloadSchema.safeParse(result).success).toBe(true)
  })

  it('lehnt ungültige Match- und Result-Payloads ab', () => {
    const match = { ...versions, seed: 42, snapshot: raidSnapshot(), floor: 1 }
    const result = resultFixture()
    expect(MatchResponseSchema.safeParse({ ...match, seed: -1 }).success).toBe(
      false,
    )
    expect(MatchResponseSchema.safeParse({ ...match, floor: 0 }).success).toBe(
      false,
    )
    expect(
      ResultPayloadSchema.safeParse({ ...result, token: '' }).success,
    ).toBe(false)
    expect(
      ResultPayloadSchema.safeParse({ ...result, hash: 123 }).success,
    ).toBe(false)
    expect(
      ResultPayloadSchema.safeParse({ ...result, hash: 'A1B2C3D4' }).success,
    ).toBe(false)
    expect(
      ResultPayloadSchema.safeParse({
        ...result,
        summary: { ...result.summary, gold: 12 },
      }).success,
    ).toBe(false)
  })

  it('erkennt alle vom Contract dokumentierten Fehlerklassen und lehnt andere ab', () => {
    for (const code of ErrorCodeSchema.options)
      expect(ErrorPayloadSchema.safeParse({ ...versions, code }).success).toBe(
        true,
      )
    expect(
      ErrorPayloadSchema.safeParse({ ...versions, code: 'unknown' }).success,
    ).toBe(false)
  })

  it('lehnt inkompatible Vertrags- und Sim-Versionen ab', () => {
    const payload = upload()
    expect(
      UploadRequestSchema.safeParse({ ...payload, contractVersion: 1 }).success,
    ).toBe(false)
    expect(
      UploadRequestSchema.safeParse({ ...payload, contractVersion: 2 }).success,
    ).toBe(false)
    expect(
      UploadRequestSchema.safeParse({ ...payload, simVersion: '0.0.1' })
        .success,
    ).toBe(false)
  })

  it('lehnt fehlende Pflichtfelder, unbekannte Felder und unvollständige Taktiken ab', () => {
    const payload = upload()
    expect(
      UploadRequestSchema.safeParse({ ...payload, activeTeam: undefined })
        .success,
    ).toBe(false)
    expect(
      UploadRequestSchema.safeParse({ ...payload, clientResult: true }).success,
    ).toBe(false)
    expect(
      UploadRequestSchema.safeParse({ ...payload, tactics: [] }).success,
    ).toBe(false)
  })

  it('validiert Grid-Marker und reale Pathfinding-Ergebnisse', () => {
    const runtimeGrid = createDungeonGrid()
    expect(
      DungeonGridSchema.safeParse({
        ...runtimeGrid,
        cells: Array.from(runtimeGrid.cells),
      }).success,
    ).toBe(true)
    expect(
      PathResultSchema.safeParse(findPath(createDungeonGrid())).success,
    ).toBe(true)
    const trapGrid = straightCorridor()
    setCell(trapGrid, { x: 1, y: 0 }, CellType.Trap)
    setCell(trapGrid, { x: 2, y: 0 }, CellType.Trap)
    const trapResult = findPath(trapGrid)
    expect(trapResult.mode).toBe('trap-fallback')
    expect(PathResultSchema.safeParse(trapResult).success).toBe(true)
    const blockedGrid = straightCorridor()
    setCell(blockedGrid, { x: 63, y: 62 }, CellType.Wall)
    setCell(blockedGrid, { x: 62, y: 63 }, CellType.Wall)
    const unreachableResult = findPath(blockedGrid)
    expect(unreachableResult.mode).toBe('unreachable')
    expect(PathResultSchema.safeParse(unreachableResult).success).toBe(true)
    expect(
      PathResultSchema.safeParse({
        mode: 'within-budget',
        path: [{ x: 0, y: 0 }],
        movementCost: 0,
        detourCost: 0,
      }).success,
    ).toBe(true)
    expect(
      PathResultSchema.safeParse({
        mode: 'unreachable',
        path: [],
        movementCost: Number.POSITIVE_INFINITY,
        detourCost: Number.POSITIVE_INFINITY,
      }).success,
    ).toBe(true)
    expect(
      PathResultSchema.safeParse({
        mode: 'unreachable',
        path: [],
        movementCost: 0,
        detourCost: 0,
      }).success,
    ).toBe(false)
    const invalid = dungeon()
    invalid.cells[1] = 3
    expect(
      UploadRequestSchema.safeParse({
        ...upload(),
        dungeon: invalid,
      }).success,
    ).toBe(false)
  })
})
