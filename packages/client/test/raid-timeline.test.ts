import { RaidLogPayloadSchema } from '@floor/contracts'
import { CellType, findPath, summarizeCombat } from '@floor/sim-core'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { buildCombatLog } from '../src/raid/combat-source'
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
  ambushEvents,
  buildTimelineSections,
  clusterEvents,
  eventsByPhase,
  phaseForTick,
  trailBadge,
} from '../src/raid/timeline-model'
import { blockedGrid, fixtureRaidLog } from './raid-fixtures'

beforeEach(() => {
  setPlaybackLog(null)
  playbackPaused.value = false
})

describe('RaidTimeline-Phasen', () => {
  it('zeigt die richtige Anzahl Ereignisse pro Phase', () => {
    const { log } = fixtureRaidLog()
    const sections = buildTimelineSections(log)
    const buckets = eventsByPhase(log, sections)

    const total = log.events.length
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
    const { log } = fixtureRaidLog()
    const sections = buildTimelineSections(log)
    expect(sections.combatStart).toBeGreaterThan(0)
    expect(phaseForTick(sections, 0)).toBe('route')
    expect(phaseForTick(sections, sections.combatStart - 1)).toBe('route')
    expect(phaseForTick(sections, sections.combatStart)).toBe('combat')
    expect(phaseForTick(sections, sections.lastTick)).toBe('result')
    expect(phaseForTick(sections, sections.lastTick + 5)).toBe('result')
  })

  it('nennt jeden Hinterhalt einzeln mit Tick und Ziel, in Log-Reihenfolge', () => {
    const { log } = fixtureRaidLog()
    const counted = log.events.filter((event) => event.type === 'ambush')
    const ambushes = ambushEvents(log)
    // Der Startdungeon trägt zwei Platzierungsgruppen und der Fixture-Raid zwei
    // Verteidiger: der Hinterhalt ist im laufenden Lauf keine leere Menge.
    expect(counted.length).toBeGreaterThan(0)
    expect(ambushes).toHaveLength(counted.length)
    for (const [index, ambush] of ambushes.entries()) {
      expect(ambush.tick).toBe(counted[index].tick)
      expect(ambush.actorId).toBe(counted[index].actorId)
      // Nur Monster werden aufgestellt, und ihre Ziele sind Helden. Die
      // Ausgabe ist ein Wort aus dem Spiel, keine Kennung aus dem Log.
      expect(ambush.target).toBe('einen Helden')
    }
    const badges = new Set(
      log.trail
        .filter((entry) => trailBadge(entry.cell) === 'placement')
        .map((entry) => `${entry.x},${entry.y}`),
    )
    expect(badges.has('30,0')).toBe(true)
  })

  it('markiert Platzierungs-, Spawn- und Boss-Zellen im Trail', () => {
    expect(trailBadge(CellType.Empty)).toBeNull()
    expect(trailBadge(CellType.Wall)).toBeNull()
    expect(trailBadge(CellType.Placement)).toBe('placement')
    expect(trailBadge(CellType.Spawn)).toBe('spawn')
    expect(trailBadge(CellType.Boss)).toBe('boss')
    const { log } = fixtureRaidLog()
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
      const first = fixtureRaidLog()
      setPlaybackLog(first.log)
      expect(playbackLog.value?.log).toBe(first.log)

      setPlaybackLog(first.log)
      expect(playbackLog.value?.log).toBe(first.log)

      const again = fixtureRaidLog()
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
    const { payload } = fixtureRaidLog()
    setPlaybackLog(payload.log)
    const lastTick = payload.log.ticks
    setScrubTick(lastTick + 100)
    expect(playbackTick.value).toBe(lastTick)
    setScrubTick(-5)
    expect(playbackTick.value).toBe(0)
    expect(playbackLog.value?.sections.lastTick).toBe(lastTick)
  })

  it('stepPlayback läuft weiter, Pause friert den Scrubber ein', () => {
    const { payload } = fixtureRaidLog()
    setPlaybackLog(payload.log)
    setScrubTick(0)
    const tickRate = payload.log.config.tickRate
    const first = stepPlayback(1000 / tickRate)
    expect(first).toBe(1)
    playbackPaused.value = true
    expect(stepPlayback(1000 / tickRate)).toBe(1)
    playbackPaused.value = false
    expect(stepPlayback(1000 / tickRate)).toBe(2)
  })

  it('leitet die aktive Route-Zelle aus move-Ereignissen ab', () => {
    const { payload } = fixtureRaidLog()
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
    const { payload } = fixtureRaidLog()
    const log = payload.log
    const timeoutLog = {
      ...log,
      stage: 'timeout' as const,
      events: [
        ...log.events.slice(0, -1),
        { ...log.events[log.events.length - 1], stage: 'timeout' as const },
      ],
    }
    expect(summarizeCombat(timeoutLog).stage).toBe('timeout')
    expect(summarizeCombat(log).stage).not.toBe('timeout')
  })

  it('zählt Überlebende ohne den Boss in monstersAlive und ohne zweite Simulation', () => {
    const { payload } = fixtureRaidLog()
    const log = payload.log
    const summary = summarizeCombat(log)
    const dead = new Set(
      log.events
        .filter((event) => event.type === 'death')
        .map((event) => event.actorId),
    )
    expect(
      summary.heroesAlive + summary.monstersAlive + (summary.bossAlive ? 1 : 0),
    ).toBe(log.units.length - dead.size)
    const monstersOnly = log.units.filter(
      (unit) =>
        unit.side === 'monsters' &&
        unit.role === 'monster' &&
        !dead.has(unit.id),
    ).length
    expect(summary.monstersAlive).toBe(monstersOnly)
    expect(RaidLogPayloadSchema.safeParse(payload).success).toBe(true)
  })
})

describe('Raid-Log aus dem Core', () => {
  it('rechnet denselben Lauf wie die Route, ohne den Store anzufassen', () => {
    const { grid, route, log } = fixtureRaidLog()
    const combat = buildCombatLog(grid, route)
    expect(combat).toEqual(log)
    expect(combat?.trail.length).toBe(route.path.length)
    expect(playbackLog.value).toBeNull()
  })

  it('liefert für eine blockierte Route null', () => {
    const blocked = blockedGrid()
    expect(buildCombatLog(blocked, findPath(blocked))).toBeNull()
  })
})
