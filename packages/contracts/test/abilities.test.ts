import { describe, expect, it } from 'vitest'
import { ABILITY_IDS, HERO_CLASSES, TacticRuleSchema } from '../src'

describe('Taktikregeln und Klassen', () => {
  it('nimmt eine Regel ohne Bedingung', () => {
    // Fehlendes `when` ist `immediate`: die Fähigkeit fällt beim ersten
    // eigenen Zug, sobald sie frei ist.
    expect(TacticRuleSchema.safeParse({ ability: 'hold' }).success).toBe(true)
    expect(
      TacticRuleSchema.safeParse({
        ability: 'mend',
        when: { kind: 'allyBelow', thresholdPermille: 400 },
      }).success,
    ).toBe(true)
  })

  it('lehnt unbekannte Fähigkeiten und Felder ab', () => {
    expect(TacticRuleSchema.safeParse({ ability: 'heal' }).success).toBe(false)
    expect(
      TacticRuleSchema.safeParse({ ability: 'hold', extra: 1 }).success,
    ).toBe(false)
  })

  it('verlangt die Schwelle genau dort, wo sie gelesen wird', () => {
    // Ein unbenutzter Wert wäre eine Zahl ohne Leser: `immediate` entscheidet
    // ohne Bedingung, `bossNear` über die Nähe und nicht über Leben, und beide
    // lesen ausdrücklich keine Promille.
    expect(
      TacticRuleSchema.safeParse({
        ability: 'mend',
        when: { kind: 'allyBelow' },
      }).success,
    ).toBe(false)
    expect(
      TacticRuleSchema.safeParse({
        ability: 'mend',
        when: { kind: 'immediate', thresholdPermille: 400 },
      }).success,
    ).toBe(false)
    expect(
      TacticRuleSchema.safeParse({
        ability: 'frost',
        when: { kind: 'bossNear', thresholdPermille: 1 },
      }).success,
    ).toBe(false)
    expect(
      TacticRuleSchema.safeParse({
        ability: 'shield',
        when: { kind: 'selfBelow', thresholdPermille: 1001 },
      }).success,
    ).toBe(false)
  })

  it('führt `none` als Grundfall der Klassen', () => {
    // `none` ist keine Fähigkeit: klassenlose Helden und Monster tragen ihn,
    // aber es gibt nichts auszuführen. Beide Listen sind Vokabular und dürfen
    // sich selbst nicht doppeln.
    expect(HERO_CLASSES[0]).toBe('none')
    expect(new Set(HERO_CLASSES).size).toBe(HERO_CLASSES.length)
    expect(new Set(ABILITY_IDS).size).toBe(ABILITY_IDS.length)
  })
})
