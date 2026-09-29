import { describe, expect, it } from 'vitest'
import { baseMonsters } from '../genome/registry'
import { UNIT_BASE } from '../units'
import { buildCombatUnits } from './rules'

/**
 * Der Kampf kennt die Art des Verteidigers.
 *
 * `resolveCombat` nahm bis zur Verdrahtung nur die **Anzahl** belegter Plätze
 * entgegen; die Art aus dem eingefrorenen Snapshot ging auf dem Weg von
 * `RaidSnapshotSchema` bis `buildCombatUnits` verloren, und fünf Slots waren
 * fünf Kopien. Ein Filter, der eine Angabe in eine andere Form bringt, ist kein
 * Detail. Die Tests stehen an der Naht, weil nur dort der Verlust auffällt.
 */

describe('Die Art des Verteidigers im Kampf', () => {
  it('gibt jedem Verteidiger die Werte seiner Art', () => {
    const units = buildCombatUnits({
      teamSize: 1,
      defenders: [{ baseId: 'ember-titan' }, { baseId: 'shard-imp' }],
      routeLength: 2,
    })
    const monsters = units.filter((unit) => unit.role === 'monster')
    expect(monsters).toHaveLength(2)
    // Ember-Titan ist Stärke 5, Shard-Imp Stärke 0 — der Bias muss sich zeigen.
    expect(monsters[0].maxHp).toBeGreaterThan(monsters[1].maxHp)
  })

  it('unterscheidet zwei Arten an ihren Werten', () => {
    const hp = (baseId: string) =>
      buildCombatUnits({
        teamSize: 1,
        defenders: [{ baseId }],
        routeLength: 2,
      }).find((unit) => unit.role === 'monster')?.maxHp
    expect(hp('frost-wolf')).not.toBe(hp('stone-golem'))
  })

  it('überlebt eine Art, die es nicht gibt', () => {
    // Ein veralteter Snapshot darf die Expedition nicht abbrechen. Der
    // Platzhalter trägt die Basiswerte, damit ein unbekanntes Wesen sichtbar
    // bleibt, statt den Lauf zu töten.
    const monster = buildCombatUnits({
      teamSize: 1,
      defenders: [{ baseId: 'gibt-es-nicht' }],
      routeLength: 2,
    }).find((unit) => unit.role === 'monster')
    expect(monster?.maxHp).toBe(UNIT_BASE.monster.maxHp)
  })

  it('zählt leere Plätze nicht als Verteidiger', () => {
    const units = buildCombatUnits({
      teamSize: 1,
      defenders: [{ baseId: null }, { baseId: 'frost-wolf' }, { baseId: null }],
      routeLength: 2,
    })
    expect(units.filter((unit) => unit.role === 'monster')).toHaveLength(1)
  })

  it('rechnet jede der zwanzig Arten zu einem anderen Wesen', () => {
    // Keine Kollision: derselbe Wert für zwei Arten hieße, das System hätte
    // wieder zusammengefasst, wo es trennen sollte.
    const values = baseMonsters().map((base) => {
      const monster = buildCombatUnits({
        teamSize: 1,
        defenders: [{ baseId: base.id }],
        routeLength: 2,
      }).find((unit) => unit.role === 'monster')
      return `${monster?.maxHp}/${monster?.attack}/${monster?.defense}`
    })
    expect(new Set(values).size).toBe(baseMonsters().length)
  })
})
