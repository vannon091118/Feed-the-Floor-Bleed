import { describe, expect, it } from 'vitest'
import {
  baseGenome,
  baseMonster,
  baseMonsters,
  ELEMENT_MAX,
  ELEMENT_MIN,
  mutate,
} from './index'

describe('genome registry', () => {
  it('führt genau zwanzig verschiedene Basis-Monster', () => {
    const ids = new Set(baseMonsters().map((monster) => monster.id))
    expect(ids.size).toBe(20)
    expect(baseMonsters()).toHaveLength(20)
  })

  it('hält jedes Element zwischen 1,00 und 10,00', () => {
    for (const monster of baseMonsters()) {
      for (const element of monster.elements) {
        expect(element).toBeGreaterThanOrEqual(ELEMENT_MIN)
        expect(element).toBeLessThanOrEqual(ELEMENT_MAX)
      }
    }
  })

  it('wirft bei unbekannter Basis-ID', () => {
    expect(() => baseMonster('gibt-es-nicht')).toThrow(/unbekannt/)
  })
})

describe('basisgenom', () => {
  it('trägt die Basiswerte, den Trait und den Bonus der Art', () => {
    const base = baseMonster('frost-wolf')
    const genome = baseGenome('frost-wolf')
    expect(genome.generation).toBe(1)
    expect(genome.elements).toEqual([...base.elements])
    expect(genome.traits).toEqual([base.trait])
    expect(genome.bonuses).toEqual([base.bonus])
  })
})

describe('mutationskette', () => {
  it('mutiert deterministisch — gleicher Seed, gleiches Ergebnis', () => {
    const genome = baseGenome('frost-wolf')
    expect(mutate(genome, 1234)).toEqual(mutate(genome, 1234))
  })

  it('verschiebt jedes Element nur im Rahmen der Grenzen', () => {
    let genome = baseGenome('stone-golem')
    for (let seed = 0; seed < 50; seed += 1) {
      genome = mutate(genome, seed)
      for (const element of genome.elements) {
        expect(element).toBeGreaterThanOrEqual(ELEMENT_MIN)
        expect(element).toBeLessThanOrEqual(ELEMENT_MAX)
      }
    }
  })

  it('erhöht die Generation mit jeder Mutation', () => {
    const once = mutate(baseGenome('ember-cub'), 7)
    expect(once.generation).toBe(2)
    expect(mutate(once, 7).generation).toBe(3)
  })

  it('hält jedes Element nach der Mutation ganzzahlig', () => {
    const genome = mutate(baseGenome('bramble-guard'), 99)
    for (const element of genome.elements) {
      expect(Number.isInteger(element)).toBe(true)
    }
  })
})
