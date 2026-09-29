import { describe, expect, it } from 'vitest'
import {
  baseGenome,
  baseMonsters,
  breed,
  ELEMENT_MAX,
  ELEMENT_MIN,
  type Genome,
  mutate,
  resolveStats,
} from './index'

const a = baseGenome('frost-wolf')
const b = baseGenome('ember-titan')

describe('züchtung', () => {
  it('ist deterministisch — gleiche Eltern, gleicher Seed, gleiches Kind', () => {
    expect(breed([a, b], 555)).toEqual(breed([a, b], 555))
  })

  it('gibt dem Kind die Generation des jüngeren Eltenteils plus eins', () => {
    const young = mutate(a, 1)
    const child = breed([young, b], 42)
    expect(child.generation).toBe(Math.max(young.generation, b.generation) + 1)
  })

  it('vererbt Eigenschaften aus dem Pool beider Eltern', () => {
    for (let seed = 0; seed < 40; seed += 1) {
      const child = breed([a, b], seed)
      for (const trait of child.traits) {
        expect([...a.traits, ...b.traits]).toContain(trait)
      }
      for (const bonus of child.bonuses) {
        expect([...a.bonuses, ...b.bonuses]).toContain(bonus)
      }
    }
  })

  it('zieht die Basisart aus einer der beiden Eltern', () => {
    for (let seed = 0; seed < 40; seed += 1) {
      expect([a.baseId, b.baseId]).toContain(breed([a, b], seed).baseId)
    }
  })

  it('hält alle Elemente nach der Kopplung in den Grenzen', () => {
    for (let seed = 0; seed < 100; seed += 1) {
      for (const element of breed([b, b], seed).elements) {
        expect(element).toBeGreaterThanOrEqual(ELEMENT_MIN)
        expect(element).toBeLessThanOrEqual(ELEMENT_MAX)
      }
    }
  })
})

describe('gekoppelte Elemente', () => {
  /**
   * Die Zusage der Kette: ein starkes Element zieht sein Gegenstück nach
   * unten. Ein Kind kann deshalb nicht in allen drei Achsen zugleich das
   * Elternmaximum erreichen.
   */
  it('erreicht nicht überall gleichzeitig das Elternmaximum', () => {
    const anyChildHitAllThree = Array.from({ length: 200 }, (_, seed) =>
      breed([a, b], seed).elements.every(
        (value, axis) =>
          value >= Math.max(a.elements[axis], b.elements[axis]) - 200,
      ),
    ).some(Boolean)
    expect(anyChildHitAllThree).toBe(false)
  })
})

describe('werteableitung', () => {
  it('gibt den Basis-Monstern überwiegend verschiedene Kampfwerte', () => {
    const seen = new Set<string>()
    for (const monster of baseMonsters()) {
      const stats = resolveStats(baseGenome(monster.id))
      seen.add(
        `${stats.maxHp}:${stats.attack}:${stats.defense}:${stats.initiative}`,
      )
    }
    expect(seen.size).toBeGreaterThan(12)
  })

  it('lässt einen Trait den Bonus verstärken — Reihenfolge ist die Regel', () => {
    const bare: Genome = {
      baseId: 'stone-golem',
      generation: 1,
      elements: [8600, 2600, 7800],
      traits: [],
      bonuses: ['bulwark'],
    }
    const withTrait: Genome = { ...bare, traits: ['toughHide'] }
    expect(resolveStats(withTrait).defense).toBeGreaterThan(
      resolveStats(bare).defense,
    )
  })

  it('hält alle abgeleiteten Werte positiv und in den Cooldown-Grenzen', () => {
    for (let seed = 0; seed < 60; seed += 1) {
      const parent = baseGenome(baseMonsters()[seed % 20].id)
      const stats = resolveStats(breed([parent, b], seed))
      expect(stats.maxHp).toBeGreaterThan(0)
      expect(stats.attack).toBeGreaterThan(0)
      expect(stats.defense).toBeGreaterThanOrEqual(0)
      expect(stats.moveCooldown).toBeGreaterThanOrEqual(1)
      expect(stats.attackCooldown).toBeGreaterThanOrEqual(1)
    }
  })
})
