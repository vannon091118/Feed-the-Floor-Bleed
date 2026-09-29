import { describe, expect, it } from 'vitest'
import { baseGenome, breed, mutate } from './mutation'
import { baseMonsters } from './registry'
import {
  elementBudget,
  lootProfile,
  slotLootProfile,
  strengthOfElements,
} from './strength'

/**
 * Die Stärkeskala ist eine `[K]`-Zahl, und eine Verschiebung fällt nicht auf,
 * wenn niemand nachsieht. Dieser Test nennt deshalb jede Art mit ihrer Stufe.
 * Wer ein Element verändert, sieht hier sofort, welche Art wohin rutscht —
 * das ist der Zweck, nicht die Vollständigkeit der Liste.
 */

describe('Stärke einer Basis-Art', () => {
  it('verteilt die zwanzig Arten über alle sechs Stufen', () => {
    const counts = [0, 0, 0, 0, 0, 0]
    for (const base of baseMonsters()) {
      counts[strengthOfElements(base.elements)] += 1
    }
    expect(counts.reduce((a, b) => a + b, 0)).toBe(20)
    // Jede Stufe trägt mindestens zwei und höchstens fünf Arten. Eine leere
    // Stufe hieße, dass die Skala eine Zahl trägt, die niemand erreicht.
    for (const count of counts) {
      expect(count).toBeGreaterThanOrEqual(2)
      expect(count).toBeLessThanOrEqual(5)
    }
  })

  it('hält die gemessene Zuordnung fest', () => {
    const expected: Record<string, number> = {
      'shade-prowler': 0,
      'grave-moth': 0,
      'shard-imp': 0,
      'cinder-wisp': 1,
      'mire-hound': 1,
      'frost-wolf': 2,
      'mire-witch': 2,
      'peat-crawler': 2,
      'bone-thrall': 2,
      'hollow-warden': 3,
      'ash-revenant': 3,
      'bone-elder': 3,
      'ember-cub': 3,
      'bramble-guard': 3,
      'marsh-horror': 4,
      'iron-crawler': 4,
      'deep-lurker': 4,
      'frost-herald': 4,
      'stone-golem': 5,
      'ember-titan': 5,
    }
    const actual = Object.fromEntries(
      baseMonsters().map((base) => [
        base.id,
        strengthOfElements(base.elements),
      ]),
    )
    expect(actual).toEqual(expected)
  })

  it('legt zwei Arten mit gleichem Budget in dieselbe Stufe', () => {
    // Drei Arten teilen sich das Budget 15400. Eine nach Rang vergebene Stufe
    // könnte sie auseinanderwerfen; eine aus dem Budget kann es nicht.
    const found = baseMonsters().filter(
      (base) => elementBudget(base.elements) === 15400,
    )
    expect(found.length).toBe(3)
    const strengths = new Set(
      found.map((base) => strengthOfElements(base.elements)),
    )
    expect(strengths.size).toBe(1)
  })

  it('folgt dem Budget und nicht einer festen Artentabelle', () => {
    const light: [number, number, number] = [1000, 1000, 1000]
    const heavy: [number, number, number] = [9000, 9000, 9000]
    expect(strengthOfElements(light)).toBe(0)
    expect(strengthOfElements(heavy)).toBe(5)
  })
})

describe('Beute-Profil eines Genoms', () => {
  it('liefert Stärke und Generation aus dem Genom', () => {
    expect(lootProfile(baseGenome('stone-golem'))).toEqual({
      strength: 5,
      generation: 1,
    })
    expect(lootProfile(baseGenome('shade-prowler'))).toEqual({
      strength: 0,
      generation: 1,
    })
  })

  it('führt die Generation mit jeder Zucht weiter', () => {
    const parent = baseGenome('stone-golem')
    const child = breed([parent, parent], 99)
    expect(lootProfile(child).generation).toBe(2)
  })
})

describe('Beute-Profil eines eingefrorenen Slots', () => {
  it('liest Stärke aus der Art und Generation aus dem Slot', () => {
    expect(
      slotLootProfile({ monsterId: 'stone-golem', generation: 3 }),
    ).toEqual({
      strength: 5,
      generation: 3,
    })
  })

  it('gilt ein fehlendes Feld als Generation 1', () => {
    // Alte Stände ohne das Feld bleiben lesbar und meinen ein Basis-Monster.
    expect(slotLootProfile({ monsterId: 'frost-wolf' })).toEqual({
      strength: 2,
      generation: 1,
    })
  })

  it('ergibt null für einen leeren Platz', () => {
    expect(slotLootProfile({ monsterId: null, generation: 2 })).toBeNull()
  })

  it('ergibt null für eine Art, die es nicht gibt', () => {
    // Keine erfundene Beute: eine unbekannte Art rechnet nichts.
    expect(slotLootProfile({ monsterId: 'nicht-im-pool' })).toBeNull()
  })

  it('berührt keinen Zucht-Seed — derselbe Slot zählt immer gleich', () => {
    // Die Generation steht am Slot und **nicht** in `monsterId`. Wäre sie im
    // String, ginge sie als Salz in `deriveSeed` ein und jeder Zuchtwurf
    // hinge an der Beute-Kennzeichnung. Der Beleg: das Profil ist eine reine
    // Lesefunktion, und die Mutation desselben Genoms ändert daran nichts.
    const slot = { monsterId: 'stone-golem', generation: 4 }
    const before = slotLootProfile(slot)
    const genome = mutate(baseGenome('stone-golem'), 4242)
    const after = slotLootProfile(slot)
    expect(after).toEqual(before)
    // Und die Generation des Genoms ist unabhängig von der des Slots: ein
    // Slot Generation 4 ist nicht dasselbe wie vier Mutationen.
    expect(lootProfile(genome).generation).toBe(2)
  })
})
