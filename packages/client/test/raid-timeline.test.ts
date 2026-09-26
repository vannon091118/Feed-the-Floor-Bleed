import { RaidLogPayloadSchema } from '@floor/contracts'
import {
  CellType,
  createDungeonGrid,
  findPath,
  resolveSnapshotRaid,
  setCell,
} from '@floor/sim-core'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
  playbackLog,
  playbackPaused,
  playbackRouteIndex,
  playbackTick,
  setPlaybackLog,
  setScrubTick,
  stepPlayback,
} from '../src/raid/playback'
import {
  buildTimelineSections,
  clusterEvents,
  eventsByPhase,
  phaseForTick,
  resultCard,
  trailBadge,
} from '../src/raid/timeline-model'
import { buildCombatLog } from '../src/showcase/combat-source'

function fixtureLog() {
  const grid = createDungeonGrid()
  const route = findPath(grid)
  const raid = resolveSnapshotRaid({
    grid,
    seed: 4242,
    teamSize: 3,
    monsterSlots: 2,
    floor: 1,
    token: 'timeline-test',
  })
  return { grid, route, payload: raid.log, log: raid.log.log }
}

beforeEach(() => {
  setPlaybackLog(null)
  playbackPaused.value = false
})

describe('RaidTimeline-Phasen', () => {
  it('zeigt die richtige Anzahl Ereignisse pro Phase', () => {
    const { log } = fixtureLog()
    const sections = buildTimelineSections(log)
    const buckets = eventsByPhase(log, sections)

    let total = 0
    for (const event of log.events) total += 1
    expect(
      buckets.route.length + buckets.combat.length + buckets.result.length,
    ).toBe(total)
    expect(buckets.result).toHaveLength(1)
    expect(buckets.result[0].type).toBe('end')
    expect(buckets.combat.length).toBeGreaterThan(0)

    const clusters = clusterEvents(buckets.combat)
    let clustered = 0
    for (const cluster of clusters) clustered += cluster.count
    expect(clustered).toBe(buckets.combat.length)
    expect(sections.phases).toHaveLength(3)
  })

  it('ordnet die Phasen über phaseForTick korrekt', () => {
    const { log } = fixtureLog()
    const sections = buildTimelineSections(log)
    expect(sections.combatStart).toBeGreaterThan(0)
    expect(phaseForTick(sections, 0)).toBe('route')
    expect(phaseForTick(sections, sections.combatStart - 1)).toBe('route')
    expect(phaseForTick(sections, sections.combatStart)).toBe('combat')
    expect(phaseForTick(sections, sections.lastTick)).toBe('result')
    expect(phaseForTick(sections, sections.lastTick + 5)).toBe('result')
  })

  it('markiert Falle-, Spawn- und Boss-Zellen im Trail', () => {
    expect(trailBadge(CellType.Empty)).toBeNull()
    expect(trailBadge(CellType.Wall)).toBeNull()
    expect(trailBadge(CellType.Trap)).toBe('trap')
    expect(trailBadge(CellType.Spawn)).toBe('spawn')
    expect(trailBadge(CellType.Boss)).toBe('boss')
    const { log } = fixtureLog()
    const badges = new Set(
      log.trail
        .map((entry) => trailBadge(entry.cell))
        .filter((badge) => badge !== null),
    )
    expect(badges.has('spawn')).toBe(true)
    expect(badges.has('boss')).toBe(true)
  })
})

describe('RaidTimeline-Scrubber', () => {
  it('löst keinen Core-Replay aus: Log-Wechsel nur bei neuem Log-Objekt', () => {
    const spy = vi.spyOn(Math, 'random')
    try {
      const first = fixtureLog()
      setPlaybackLog(first.log)
      expect(playbackLog.value?.log).toBe(first.log)

      setPlaybackLog(first.log)
      expect(playbackLog.value?.log).toBe(first.log)

      const again = fixtureLog()
      setPlaybackLog(again.log)
      expect(playbackLog.value?.log).toBe(again.log)
      expect(playbackTick.value).toBe(0)

      setScrubTick(7)
      expect(playbackTick.value).toBe(7)
      expect(Math.random).not.toHaveBeenCalled()
    } finally {
      spy.mockRestore()
    }
  })

  it('klemmt Scrub-Ticks aufs Log-Ende und pausiert deterministisch', () => {
    const { payload } = fixtureLog()
    setPlaybackLog(payload.log)
    const lastTick = payload.log.ticks
    setScrubTick(lastTick + 100)
    expect(playbackTick.value).toBe(lastTick)
    setScrubTick(-5)
    expect(playbackTick.value).toBe(0)
    expect(playbackLog.value?.sections.lastTick).toBe(lastTick)
  })

  it('stepPlayback läuft weiter, Pause friert den Scrubber ein', () => {
    const { payload } = fixtureLog()
    setPlaybackLog(payload.log)
    setScrubTick(0)
    const tickRate = payload.log.config.tickRate
    const first = stepPlayback(1000 / tickRate, tickRate)
    expect(first).toBe(1)
    playbackPaused.value = true
    expect(stepPlayback(1000 / tickRate, tickRate)).toBe(1)
    playbackPaused.value = false
    expect(stepPlayback(1000 / tickRate, tickRate)).toBe(2)
  })

  it('leitet die aktive Route-Zelle aus move-Ereignissen ab', () => {
    const { payload } = fixtureLog()
    setPlaybackLog(payload.log)
    setScrubTick(0)
    expect(playbackRouteIndex.value).toBe(-1)
    const firstMove = payload.log.events.find((event) => event.type === 'move')
    if (!firstMove) throw new Error('Fixture-Log ohne move-Ereignis')
    setScrubTick(firstMove.tick)
    expect(playbackRouteIndex.value).toBe(firstMove.toIndex)
  })
})

describe('RaidTimeline-Ergebnis-Phase', () => {
  it('zeigt die Timeout-Karte bei Stage timeout', () => {
    const { payload } = fixtureLog()
    const log = payload.log
    const timeoutLog = {
      ...log,
      stage: 'timeout' as const,
      events: [
        ...log.events.slice(0, -1),
        { ...log.events[log.events.length - 1], stage: 'timeout' as const },
      ],
    }
    const card = resultCard(timeoutLog)
    expect(card.stage).toBe('timeout')
    expect(card.timeout).toBe(true)
    const plain = resultCard(log)
    expect(plain.timeout).toBe(false)
    expect(plain.stage).not.toBe('timeout')
  })

  it('zählt Überlebende aus Todesereignissen ohne zweite Simulation', () => {
    const { payload } = fixtureLog()
    const log = payload.log
    const card = resultCard(log)
    const dead = log.events.filter((event) => event.type === 'death').length
    const survivors = log.units.length - dead
    expect(card.heroes + card.monsters + (card.bossAlive ? 1 : 0)).toBe(
      survivors,
    )
    expect(RaidLogPayloadSchema.safeParse(payload).success).toBe(true)
  })
})

describe('RaidTimeline-Szenenquelle', () => {
  it('liefert für blockierte Route null und leert den Store', () => {
    const grid = createDungeonGrid()
    grid.cells[63 * 64 + 62] = CellType.Wall
    grid.cells[62 * 64 + 63] = CellType.Wall
    const route = findPath(grid)
    const combat = buildCombatLog(grid, route)
    expect(combat).toBeNull()
    expect(playbackLog.value).toBeNull()
    expect(playbackRouteIndex.value).toBe(-1)
  })

  it('reicht denselben Log an den Store weiter, den die Szene nutzt', () => {
    const grid = createDungeonGrid()
    const route = findPath(grid)
    const combat = buildCombatLog(grid, route)
    expect(combat).not.toBeNull()
    expect(playbackLog.value?.log).toBe(combat)
    expect(playbackLog.value?.sections.trail.length).toBe(route.path.length)
  })
})
