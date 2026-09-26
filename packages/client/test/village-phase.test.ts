import type { TerminalRaidJob } from '@floor/contracts'
import { describe, expect, it } from 'vitest'
import { fixture } from '../src/fixture-data'
import {
  ALLOWED_TRANSITIONS,
  canAdvancePhase,
  type Phase,
  phaseRank,
  resolvePhaseTransition,
} from '../src/village/phase'
import {
  completeRaid,
  finishResult,
  startNight,
  triggerRaid,
} from '../src/village/phase-actions'
import { dayNight, resetDayNight, setPhase } from '../src/village/state'

const JOB: TerminalRaidJob = {
  status: 'completed',
  id: 'fixture-raid-1',
  result: {
    hash: 'h',
    events: [],
    summary: {
      hash: 'h',
      stage: 'heroes-win',
      ticks: 1,
      events: 0,
      attacks: 0,
      heroesAlive: 3,
      monstersAlive: 0,
      bossAlive: false,
    },
  },
}

const FAILED: TerminalRaidJob = {
  status: 'failed',
  id: 'fixture-raid-1',
  error: { code: 'blocked', detail: 'Route blockiert' },
}

describe('Phase-Reihenfolge', () => {
  it('ordnet die vier Phasen exakt der Schleifenreihenfolge zu', () => {
    expect(ALLOWED_TRANSITIONS).toHaveLength(5)
    expect(phaseRank('tag')).toBe(0)
    expect(phaseRank('night')).toBe(1)
    expect(phaseRank('raid')).toBe(2)
    expect(phaseRank('result')).toBe(3)
  })

  it('erlaubt genau einen Vorwärtsschritt in der Reihenfolge', () => {
    expect(canAdvancePhase('tag', 'night')).toBe(true)
    expect(canAdvancePhase('night', 'raid')).toBe(true)
    expect(canAdvancePhase('raid', 'result')).toBe(true)
    expect(canAdvancePhase('result', 'tag')).toBe(false)
    expect(canAdvancePhase('tag', 'result')).toBe(false)
  })

  it('löst die erlaubten Übergänge auf und verwirft jeden Skip', () => {
    expect(resolvePhaseTransition('tag', 'night')).toBe('night')
    expect(resolvePhaseTransition('night', 'raid')).toBe('raid')
    expect(resolvePhaseTransition('raid', 'result')).toBe('result')
    expect(resolvePhaseTransition('result', 'tag')).toBe('tag')
    expect(resolvePhaseTransition('result', 'raid')).toBe('raid')
    expect(resolvePhaseTransition('tag', 'raid')).toBeNull()
    expect(resolvePhaseTransition('tag', 'result')).toBeNull()
    expect(resolvePhaseTransition('night', 'result')).toBeNull()
    expect(resolvePhaseTransition('raid', 'night')).toBeNull()
    expect(resolvePhaseTransition('night', 'tag')).toBeNull()
    expect(resolvePhaseTransition('result', 'night')).toBeNull()
  })
})

describe('DayNightState-Übergänge', () => {
  it('startet im Tag der Fixture-Region', () => {
    resetDayNight()
    expect(dayNight.value.phase).toBe('tag')
    expect(dayNight.value.day).toBe(fixture.day)
    expect(dayNight.value.job).toBeNull()
  })

  it('durchläuft tag→night→raid→result→tag und zählt den Tag hoch', () => {
    resetDayNight()
    expect(setPhase('night')).toBe(true)
    expect(setPhase('raid')).toBe(true)
    expect(completeRaid(JOB)).toBe(true)
    expect(dayNight.value.phase).toBe('result')
    expect(dayNight.value.job?.status).toBe('completed')
    expect(setPhase('tag')).toBe(true)
    expect(dayNight.value.phase).toBe('tag')
    expect(dayNight.value.day).toBe(fixture.day + 1)
    expect(dayNight.value.job).toBeNull()
  })

  it('verwirft jeden Phasen-Skip und lässt den Zustand unverändert', () => {
    resetDayNight()
    expect(setPhase('raid')).toBe(false)
    expect(dayNight.value.phase).toBe('tag')
    expect(setPhase('result')).toBe(false)
    expect(setPhase('night')).toBe(true)
    expect(setPhase('tag')).toBe(false)
    expect(setPhase('result')).toBe(false)
    expect(dayNight.value.phase).toBe('night')
    expect(dayNight.value.day).toBe(fixture.day)
  })

  it('führt ein fehlgeschlagener Ergebnisabschluss zurück in den Raid', () => {
    resetDayNight()
    setPhase('night')
    setPhase('raid')
    expect(completeRaid(FAILED)).toBe(true)
    expect(dayNight.value.phase).toBe('result')
    expect(finishResult(FAILED)).toBe(true)
    expect(dayNight.value.phase).toBe('raid')
    expect(dayNight.value.job?.status).toBe('failed')
    expect(dayNight.value.day).toBe(fixture.day)
  })

  it('nimmt einen Auftrag nur aus der Raid-Phase entgegen', () => {
    resetDayNight()
    expect(completeRaid(JOB)).toBe(false)
    expect(dayNight.value.phase).toBe('tag')
    expect(dayNight.value.job).toBeNull()
    expect(startNight()).toBe(true)
    expect(triggerRaid()).toBe(true)
    expect(completeRaid(JOB)).toBe(true)
  })
})
