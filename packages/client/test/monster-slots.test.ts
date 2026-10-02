import { baseMonsters } from '@floor/sim-core'
import { describe, expect, it } from 'vitest'
import { baseIdsBySlot } from '../src/raid/combat-source'
import { placeMonster } from '../src/village/monster-slots'
import { dayNight, resetDayNight } from '../src/village/state'

/**
 * Die Wahl seiner Gegner gehört dem Spieler.
 *
 * Vorher stand die Belegung in `fixture.monsterSlots`, und der Spielerpfad las
 * genau diese Konstante: Die Wahl war eine Eingabe ohne Ausgabe. Der Test prüft
 * beides getrennt — dass der Befehl den Bestand schreibt und dass der Kampf
 * daraus liest. Ein Test nur für den Befehl wäre grün, während der Kampf die
 * Konstante weiterbenutzt.
 */
describe('Die Monster-Plätze folgen der Wahl des Spielers', () => {
  it('schreibt die gewählte Art in den Dorfbestand', () => {
    resetDayNight()
    const vorher = dayNight.value.village.monsterSlots[0].monsterId
    const gewaehlt = baseMonsters()[1].id
    expect(gewaehlt).not.toBe(vorher)

    const ergebnis = placeMonster(0, gewaehlt)
    expect(ergebnis.ok).toBe(true)
    expect(dayNight.value.village.monsterSlots[0].monsterId).toBe(gewaehlt)
  })

  it('liest im Kampf die Wahl und nicht die Fixture-Konstante', () => {
    resetDayNight()
    const gewaehlt = baseMonsters()[2].id
    placeMonster(1, gewaehlt)
    const ids = baseIdsBySlot()
    expect(ids[1]).toBe(gewaehlt)
  })

  it('lehnt eine Art ab, die es nicht gibt, und lässt den Platz unverändert', () => {
    resetDayNight()
    const vorher = dayNight.value.village.monsterSlots[1].monsterId
    const ergebnis = placeMonster(1, 'gibt-es-nicht')
    expect(ergebnis).toEqual({
      ok: false,
      reason: 'unknown-monster',
      monsterId: 'gibt-es-nicht',
    })
    expect(dayNight.value.village.monsterSlots[1].monsterId).toBe(vorher)
  })

  it('lehnt einen Platz ab, den es nicht gibt, und nennt ihn', () => {
    resetDayNight()
    const ergebnis = placeMonster(99, null)
    expect(ergebnis).toEqual({ ok: false, reason: 'unknown-slot', slot: 99 })
  })

  it('leert einen Platz mit null, ohne die Länge zu ändern', () => {
    resetDayNight()
    const vorher = dayNight.value.village.monsterSlots.length
    expect(placeMonster(0, null).ok).toBe(true)
    expect(dayNight.value.village.monsterSlots[0].monsterId).toBeNull()
    expect(dayNight.value.village.monsterSlots).toHaveLength(vorher)
  })
})
