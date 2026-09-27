import { createDungeonGrid, findPath } from '@floor/sim-core'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { grid, resetGrid } from '../src/dungeon-editor/state'
import { loadRaidLog, unloadRaidLog } from '../src/raid/combat-source'
import {
  playbackLog,
  playbackPaused,
  playbackRouteIndex,
  setPlaybackLog,
  setScrubTick,
  stepPlayback,
} from '../src/raid/playback'
import {
  completeRaid,
  finishResult,
  startNight,
  triggerRaid,
} from '../src/village/phase-actions'
import { resetDayNight } from '../src/village/state'
import { blockedGrid, FAILED, fixtureRaidLog, JOB } from './raid-fixtures'

/**
 * Die Verdrahtung zwischen Takt und Timeline: der Tick kommt aus dem
 * Playback-Store, nicht aus der Szene. Sonst überschreibt der laufende
 * Playback jeden am Scrubber gesetzten Stand sofort wieder, und im Dorf — wo
 * keine Szene existiert — stünde die Anzeige still.
 */
beforeEach(() => {
  setPlaybackLog(null)
  playbackPaused.value = false
})

/** 60 Hz: der Frame, den der Renderer wirklich liefert. */
const FRAME_MS = 16.7

/** Fährt `frames` echte Frames und liefert den erreichten Tick. */
function runFrames(frames: number): number {
  let tick = 0
  for (let frame = 0; frame < frames; frame += 1) {
    tick = stepPlayback(FRAME_MS)
  }
  return tick
}

describe('RaidTimeline-Verdrahtung', () => {
  it('hält den Tick ohne Log an', () => {
    expect(stepPlayback(1000)).toBe(0)
  })

  it('holt über echte Frames auf, statt am Rest zu scheitern', () => {
    const { log } = fixtureRaidLog()
    setPlaybackLog(log)
    const tickRate = log.config.tickRate
    // 50 ms je Tick bei Rate 20: ein Frame ist kürzer als ein Tick.
    expect(1000 / tickRate).toBeGreaterThan(FRAME_MS)

    expect(runFrames(1)).toBe(0)
    // Drei Frames später ist die erste Tickgrenze überschritten.
    expect(runFrames(3)).toBe(1)
    // 64 Frames à 16,7 ms sind 1068,8 ms, also 21 Ticks bei Rate 20.
    expect(runFrames(60)).toBe(21)
  })

  it('übernimmt einen gesetzten Scrubber-Stand und läuft ohne Pause weiter', () => {
    const { log } = fixtureRaidLog()
    setPlaybackLog(log)
    const tickRate = log.config.tickRate

    setScrubTick(12)
    // Der Rest wandert mit dem Stand, sonst holt der nächste Frame auf.
    expect(runFrames(3)).toBe(13)
    // Ein einzelner Frame darf weiterhin mehr als einen Tick nachholen.
    expect(stepPlayback((1000 / tickRate) * 2.5)).toBe(15)
  })

  it('friert den Scrubber-Stand bei Pause ein', () => {
    const { log } = fixtureRaidLog()
    setPlaybackLog(log)
    playbackPaused.value = true
    setScrubTick(4)
    expect(stepPlayback(1000)).toBe(4)
    // Nach dem Pause-Ende läuft es vom eingefrorenen Stand weiter.
    playbackPaused.value = false
    expect(runFrames(3)).toBe(5)
  })

  it('zeigt die Route am Scrubber-Tick statt an der Helmenposition', () => {
    const route = findPath(createDungeonGrid())
    setPlaybackLog(fixtureRaidLog().log)

    setScrubTick(0)
    expect(playbackRouteIndex.value).toBe(-1)

    const { log } = fixtureRaidLog()
    setScrubTick(log.ticks)
    const atEnd = playbackRouteIndex.value
    expect(atEnd).toBeGreaterThan(-1)
    expect(atEnd).toBeLessThan(route.path.length)
  })
})

/**
 * Der Besitzer des Logs: der Raid, nicht eine Szene. Genau dieser Block
 * beschreibt den Dorffall — im Test existiert keine Pixi-Szene, die Timeline
 * muss trotzdem laufen.
 */
describe('Raid-Log-Besitzer', () => {
  beforeEach(() => {
    unloadRaidLog()
    resetDayNight()
    resetGrid()
  })

  it('lädt den Lauf in der Raid-Phase auch ohne Szene', () => {
    expect(startNight()).toBe(true)
    expect(triggerRaid()).toBe(true)
    const rate = playbackLog.value?.log.config.tickRate ?? 0
    expect(playbackLog.value).not.toBeNull()
    // 1000 ms sind bei Rate n genau n Ticks — ohne Dungeon-Szene.
    expect(stepPlayback(1000)).toBe(rate)
  })

  it('folgt dem Plan, solange der Raid läuft', async () => {
    startNight()
    triggerRaid()
    expect(playbackLog.value).not.toBeNull()
    // Das Grid ist im Raid-Editor noch löschbar; die Timeline folgt ihm.
    grid.value = blockedGrid()
    await vi.waitFor(() => {
      expect(playbackLog.value).toBeNull()
    })
    expect(playbackRouteIndex.value).toBe(-1)
  })

  it('verlangt einen gültigen Plan, sonst gibt es keine Timeline', () => {
    grid.value = blockedGrid()
    expect(triggerRaid()).toBe(false)
    expect(loadRaidLog()).toBeNull()
    expect(playbackLog.value).toBeNull()
  })

  it('beendet den Lauf mit dem Tag und hält ihn beim erneuten Versuch', () => {
    startNight()
    triggerRaid()
    completeRaid(FAILED)
    // Ein gescheiterter Auftrag läuft weiter: der Log bleibt derselbe Lauf.
    expect(playbackLog.value).not.toBeNull()
    finishResult(FAILED)
    expect(playbackLog.value).not.toBeNull()
  })

  it('räumt den Lauf auf, sobald der Tag abgeschlossen ist', () => {
    startNight()
    triggerRaid()
    expect(playbackLog.value).not.toBeNull()
    completeRaid(JOB)
    expect(playbackLog.value).not.toBeNull()
    finishResult(JOB)
    expect(playbackLog.value).toBeNull()
  })
})
