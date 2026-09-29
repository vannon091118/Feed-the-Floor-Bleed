import { describe, expect, it } from 'vitest'
import { behaviorForTrait, MONSTER_BEHAVIORS } from './behavior'
import { TRAIT_IDS } from './types'

/**
 * Die Zuordnung Trait → Verhalten ist die Naht zwischen Erbgut und Zug.
 *
 * Das Profil ist abgeleitet: wer eine Kreuzung züchtet, deren Erbgut den Trait
 * wechselt, bekommt damit ein anderes Verhalten. Zwei Dinge können hier
 * kaputtgehen, und beide kosten später eine Kampfbalance statt einen roten
 * Test: eine Tabelle mit einer Lücke (ein Trait ohne Verhalten, still auf
 * `undefined`) und eine Tabelle, die ein Profil vergibt, das im Kampf keinen
 * Leser hat. Deshalb prüft hier nicht die Zuordnung allein, sondern ihre
 * Vollständigkeit gegen die Trait-Liste — dieselbe Liste, die `registry.ts`
 * gegen den Pool stellt.
 */
describe('Verhalten aus dem Genom', () => {
  it('kennt für jeden der sechs Traits ein Verhalten aus dem Kanon', () => {
    const mapped = TRAIT_IDS.map((trait) => behaviorForTrait(trait))
    expect(mapped).toHaveLength(TRAIT_IDS.length)
    expect(mapped.every((value) => MONSTER_BEHAVIORS.includes(value))).toBe(
      true,
    )
    // Ein einziges Verhalten für alles hieße, die Tabelle wäre eine Umformung
    // der Trait-Liste statt einer Entscheidung.
    expect(new Set(mapped).size).toBeGreaterThan(1)
  })

  it('vergibt die Profile an genau die Traits, die sie tragen sollen', () => {
    // Diese sechs Zeilen sind die `[K]`-Entscheidung selbst: Zähigkeit und
    // Schwertritt halten die Fläche, der scharfe Angriff sucht das schwache
    // Glied, der ruhige Zug wählt das gefährlichste Ziel, und Tempo-Traits
    // bleiben beim Grundfall.
    expect(behaviorForTrait('toughHide')).toBe('tank')
    expect(behaviorForTrait('heavyTread')).toBe('tank')
    expect(behaviorForTrait('keenEdge')).toBe('hunter')
    expect(behaviorForTrait('focused')).toBe('control')
    expect(behaviorForTrait('restless')).toBe('none')
    expect(behaviorForTrait('deepLungs')).toBe('none')
  })

  it('führt nur Profile, die auch im Kampf eine Entscheidung treffen', () => {
    // `ambush`, `support` und `swarm` bleiben draußen, solange die Mechanik
    // dahinter fehlt — ein Profil ohne Wirkung wäre ein Feld ohne Leser.
    expect([...MONSTER_BEHAVIORS]).toEqual([
      'none',
      'tank',
      'hunter',
      'control',
    ])
  })
})
