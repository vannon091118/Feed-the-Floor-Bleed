import {
  baseMonsters,
  createDungeonGrid,
  findPath,
  resolveSnapshotRaid,
} from '@floor/sim-core'
import { describe, expect, it } from 'vitest'
import { baseIdsBySlot } from '../src/raid/combat-source'
import { createVisualObserver } from '../src/visual'

/**
 * Die Naht zwischen Store-Slot und Sprite.
 *
 * Die Basisart einer Textur darf nicht aus der Einheiten-ID geraten werden:
 * `monster-0` trägt keine Art, der belegte Slot schon. Diese Tests halten fest,
 * dass die Art aus dem Slot kommt, in Slot-Reihenfolge bleibt und ohne Slot
 * auf die Rollentextur zurückfällt.
 */
describe('Basisart am Actor', () => {
  const grid = createDungeonGrid()
  const route = findPath(grid)

  function raidLog(token: string) {
    return resolveSnapshotRaid({
      grid,
      teamSize: 3,
      monsterSlots: 2,
      seed: 4242,
      floor: 1,
      token,
    }).log.log
  }

  it('trägt die Basisart aus dem Store-Slot in Slot-Reihenfolge', () => {
    const delta = createVisualObserver().observe({
      grid,
      route,
      combat: raidLog('base-ids'),
      baseIds: ['frost-wolf', 'stone-golem', undefined, undefined, undefined],
      playbackTick: 0,
    })
    const monsters = delta.actors.filter((actor) => actor.kind === 'monster')
    expect(monsters).toHaveLength(2)
    expect(monsters[0].baseId).toBe('frost-wolf')
    expect(monsters[1].baseId).toBe('stone-golem')
  })

  it('gibt Helden und Boss keine Basisart — sie haben keinen Slot', () => {
    const delta = createVisualObserver().observe({
      grid,
      route,
      combat: raidLog('keine-basis'),
      baseIds: ['frost-wolf', 'stone-golem', undefined, undefined, undefined],
      playbackTick: 0,
    })
    for (const actor of delta.actors) {
      if (actor.kind !== 'monster') expect(actor.baseId).toBeUndefined()
    }
  })

  it('fällt ohne Store-Slot auf die Rollenbesetzung zurück', () => {
    const delta = createVisualObserver().observe({
      grid,
      route,
      combat: raidLog('leerlauf'),
      playbackTick: 0,
    })
    for (const actor of delta.actors) {
      if (actor.kind === 'monster') expect(actor.baseId).toBeUndefined()
    }
  })
})

describe('Slot-Zuordnung', () => {
  it('bildet jeden der fünf Slots ab, belegt wie leer', () => {
    const ids = baseIdsBySlot()
    expect(ids).toHaveLength(5)
    for (const id of ids) {
      if (id !== undefined)
        expect(baseMonsters().some((m) => m.id === id)).toBe(true)
    }
  })

  it('liefert für leere Slots undefined statt einer erfundenen Art', () => {
    const ids = baseIdsBySlot()
    // Der Fixture belegt zwei der fünf Plätze; die übrigen bleiben leer.
    expect(ids.filter((id) => id !== undefined).length).toBe(2)
  })

  it('benennt nur Arten, die es in der Registry wirklich gibt', () => {
    for (const id of baseIdsBySlot()) {
      if (id === undefined) continue
      expect(baseMonsters().map((monster) => monster.id)).toContain(id)
    }
  })
})
