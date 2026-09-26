import { afterEach, describe, expect, it } from 'vitest'
import { showView, stageView } from '../src/ui/view'
import { startNight } from '../src/village/phase-actions'
import { dayNight, resetDayNight } from '../src/village/state'

afterEach(() => {
  resetDayNight()
  showView('village')
})

describe('Bühnenblick: Dorf oder Dungeon', () => {
  it('startet im Dorf, weil der erste Eindruck der Ort sein soll', () => {
    expect(stageView.value).toBe('village')
  })

  it('wechselt den Blick, ohne die Phase zu verändern', () => {
    showView('dungeon')
    expect(stageView.value).toBe('dungeon')
    expect(dayNight.value.phase).toBe('tag')
  })

  it('bleibt in jeder Phase unabhängig von der Schleife wählbar', () => {
    showView('dungeon')
    expect(startNight()).toBe(true)
    expect(dayNight.value.phase).toBe('night')
    showView('village')
    expect(stageView.value).toBe('village')
    expect(dayNight.value.phase).toBe('night')
  })
})
