import { describe, expect, it } from 'vitest'
import { createDungeonGrid } from '../grid'
import { UNIT_BASE } from '../units'
import { heroInitiative, NEUTRAL_CONDITION } from './conditions'
import { resolveCombat } from './index'

const BASE = UNIT_BASE.hero.initiative

const condition = (temporaryInjury = 0, temporaryFatigue = 0) => ({
  temporaryInjury,
  temporaryFatigue,
})

describe('Nachwirkung auf die Initiative', () => {
  it('lässt einen unversehrten Helden unangetastet', () => {
    // Der Grundfall ist die alte Regel: ohne Wunde und ohne Erschöpfung steht
    // die Ausgangsinitiative, und kein Lauf von vorher ändert sich.
    expect(heroInitiative(BASE, NEUTRAL_CONDITION)).toBe(BASE)
  })

  it('kostet eine Wunde 20 % und eine Erschöpfungsstufe 10 %', () => {
    expect(heroInitiative(BASE, condition(1, 0))).toBe(400)
    expect(heroInitiative(BASE, condition(0, 1))).toBe(450)
    expect(heroInitiative(BASE, condition(1, 1))).toBe(360)
  })

  it('verkettet die Abzüge, statt sie zu addieren', () => {
    // Zwei Wunden kosten 36 % und nicht 40 %: die Freigabe nennt einen
    // Multiplikator. Der Unterschied ist die ganze Aussage dieser Zeile.
    expect(heroInitiative(BASE, condition(2, 0))).toBe(320)
    expect(heroInitiative(BASE, condition(0, 2))).toBe(405)
  })

  it('kappt die Stufen bei fünf, wie in Abschnitt 0c freigegeben', () => {
    // `temporaryInjury` ist ein Contract-Feld ohne Obergrenze; ohne die Grenze
    // wäre ein Upload mit einer Million Stufen eine Million Rechenschritte.
    const capped = heroInitiative(BASE, condition(5, 0))
    expect(capped).toBe(163)
    expect(heroInitiative(BASE, condition(50, 0))).toBe(capped)
    expect(heroInitiative(BASE, condition(0, 1742))).toBe(
      heroInitiative(BASE, condition(0, 5)),
    )
  })

})

describe('Die Nachwirkung erreicht den Log', () => {
  const heroInitiatives = (team?: ReturnType<typeof condition>[]) => {
    const log = resolveCombat({
      grid: createDungeonGrid(),
      seed: 7,
      teamSize: 2,
      team,
      defenders: [],
    })
    return log.units
      .filter((unit) => unit.role === 'hero')
      .map((unit) => unit.initiative)
  }

  it('schreibt die geminderte Initiative in den Spec', () => {
    // Ohne diese Zusage wäre die Nachwirkung im Replay nicht vorhanden: der
    // Log ist die einzige Quelle, aus der ein Lauf rekonstruiert wird.
    expect(heroInitiatives()).toEqual([BASE, BASE])
    expect(heroInitiatives([condition(1, 0), condition(0, 0)])).toEqual([
      400,
      BASE,
    ])
    expect(heroInitiatives([condition(2, 1), condition(0, 1)])).toEqual([
      288, 450,
    ])
  })
})
