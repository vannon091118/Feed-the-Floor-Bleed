import {
  createDungeonGrid,
  findPath,
  resolveSnapshotRaid,
} from '@floor/sim-core'
import { beforeEach, describe, expect, it } from 'vitest'
import {
  playbackPaused,
  playbackRouteIndex,
  setPlaybackLog,
  setScrubTick,
  stepPlayback,
} from '../src/raid/playback'

/**
 * Die Verdrahtung zwischen Szene und Timeline: `showcase/scene.ts` muss den
 * Tick aus dem Store lesen statt selbst zu zählen, sonst überschreibt der
 * laufende Playback jeden am Scrubber gesetzten Stand sofort wieder.
 */
function fixtureLog() {
  const raid = resolveSnapshotRaid({
    grid: createDungeonGrid(),
    seed: 4242,
    teamSize: 3,
    monsterSlots: 2,
    floor: 1,
    token: 'playback-wiring',
  })
  return raid.log.log
}

beforeEach(() => {
  setPlaybackLog(null)
  playbackPaused.value = false
})

describe('RaidTimeline-Verdrahtung', () => {
  it('hält den Tick ohne Log an', () => {
    expect(stepPlayback(1000, 20)).toBe(0)
  })

  it('lässt den Tick im Spiel laufen', () => {
    const log = fixtureLog()
    setPlaybackLog(log)
    // 50 ms je Tick bei Rate 20, 60 ms müssen mindestens einen Tick bringen.
    const step = (1000 / log.config.tickRate) * 1.2
    const first = stepPlayback(step, log.config.tickRate)
    const second = stepPlayback(step, log.config.tickRate)
    expect(second).toBeGreaterThan(first)
  })

  it('übernimmt einen gesetzten Scrubber-Stand und läuft ohne Pause weiter', () => {
    const log = fixtureLog()
    setPlaybackLog(log)
    const step = (1000 / log.config.tickRate) * 1.2

    setScrubTick(12)
    expect(stepPlayback(step, log.config.tickRate)).toBe(13)
  })

  it('friert den Scrubber-Stand bei Pause ein', () => {
    const log = fixtureLog()
    setPlaybackLog(log)
    playbackPaused.value = true
    setScrubTick(4)
    expect(stepPlayback(1000, log.config.tickRate)).toBe(4)
  })

  it('zeigt die Route am Scrubber-Tick statt an der Helmenposition', () => {
    const route = findPath(createDungeonGrid())
    setPlaybackLog(fixtureLog())

    setScrubTick(0)
    expect(playbackRouteIndex.value).toBe(-1)

    const log = fixtureLog()
    setScrubTick(log.ticks)
    const atEnd = playbackRouteIndex.value
    expect(atEnd).toBeGreaterThan(-1)
    expect(atEnd).toBeLessThan(route.path.length)
  })
})
