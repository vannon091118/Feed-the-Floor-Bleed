import { describe, expect, it } from 'vitest'
import { behaviorForTrait } from '../genome/behavior'
import { buildCombatUnits } from './rules'
import { chooseOpponent } from './state'
import { noPlacements, trailOf } from './trail-fixture'
import type { CombatUnitState } from './types'

/**
 * Das Verhaltensprofil entscheidet nur über die Zielwahl.
 *
 * Genau eine Stelle im Kampf liest das Profil: `chooseOpponent` in `state.ts`.
 * Der Grundfall `none` muss dabei exakt die alte Regel sein — das nächste Ziel,
 * Gleichstand zugunsten des zuerst gefundenen Kandidaten —, weil jeder andere
 * Grundfall jeden bisher gespeicherten Ablauf verschieben würde. Die drei
 * Profile müssen sich dagegen sichtbar unterscheiden, sonst wären sie Felder
 * ohne Leser.
 *
 * Die Szenarien liegen bewusst in einem Zug: dieselbe Aufstellung, vier
 * Profile, vier Antworten. Ein Profil, das hier still mit `none` zusammenfällt,
 * fällt im Kampf auf, bevor eine Balance es erklärt.
 */

/** Ein Zustand mit den Feldern, die die Zielwahl liest. */
function state(overrides: Partial<CombatUnitState>): CombatUnitState {
  return {
    id: 'kampf-nah',
    side: 'monsters',
    role: 'monster',
    behavior: 'none',
    maxHp: 100,
    hp: 100,
    attack: 10,
    defense: 0,
    initiative: 100,
    moveCooldown: 1,
    attackCooldown: 1,
    routeIndex: 5,
    ambushZoneId: -1,
    ambushAvailable: false,
    alive: true,
    zoneId: 0,
    nextActionTick: 0,
    ...overrides,
  }
}

/**
 * Drei Helden gegen einen Verteidiger: der erste ist am nächsten, der zweite
 * am vollsten und am schnellsten, der dritte ist am schwächsten.
 */
function stand(behavior: CombatUnitState['behavior']): string | undefined {
  const actor = state({ behavior })
  const close = state({
    id: 'held-nah',
    side: 'heroes',
    routeIndex: 6,
    hp: 30,
    initiative: 100,
  })
  const full = state({
    id: 'held-voll',
    side: 'heroes',
    routeIndex: 7,
    hp: 100,
    initiative: 800,
  })
  const weak = state({
    id: 'held-schwach',
    side: 'heroes',
    routeIndex: 9,
    hp: 10,
    initiative: 500,
  })
  return chooseOpponent([actor, close, full, weak], actor)?.id
}

describe('Die Zielwahl nach Verhaltensprofil', () => {
  it('greift mit `none` das nächste Ziel an wie vor dem Slice', () => {
    expect(stand('none')).toBe('held-nah')
  })

  it('lässt den `tank` das vollste Ziel suchen, auch wenn es weiter weg steht', () => {
    expect(stand('tank')).toBe('held-voll')
  })

  it('schickt den `hunter` auf das schwächste Glied der Kette', () => {
    expect(stand('hunter')).toBe('held-schwach')
  })

  it('lässt den `control` nach Initiative wählen', () => {
    expect(stand('control')).toBe('held-voll')
  })

  it('ignoriert tote und gleichseitige Kandidaten', () => {
    const actor = state({ behavior: 'none' })
    const dead = state({
      id: 'gefallen',
      side: 'heroes',
      routeIndex: 6,
      alive: false,
    })
    const ally = state({ id: 'kamerad', routeIndex: 6 })
    const last = state({ id: 'held-fern', side: 'heroes', routeIndex: 12 })
    expect(chooseOpponent([actor, dead, ally, last], actor)?.id).toBe(
      'held-fern',
    )
  })

  it('bleibt bei Gleichstand beim zuerst gefundenen Kandidaten', () => {
    // Beide Helden stehen gleich weit weg und tragen dasselbe
    // Lebensverhältnis: die Reihenfolge im Zustandsarray entscheidet, und sie
    // entscheidet deterministisch — derselbe Lauf, dieselbe Wahl.
    const actor = state({ behavior: 'tank' })
    const left = state({
      id: 'erste-wahl',
      side: 'heroes',
      routeIndex: 6,
      hp: 50,
    })
    const right = state({
      id: 'zweite-wahl',
      side: 'heroes',
      routeIndex: 4,
      hp: 50,
    })
    expect(chooseOpponent([actor, left, right], actor)?.id).toBe('erste-wahl')
    expect(chooseOpponent([actor, right, left], actor)?.id).toBe('zweite-wahl')
  })
})

describe('Das Profil kommt aus dem Genom und steht im Spec', () => {
  const placement = { trail: trailOf(4), ...noPlacements } as const

  it('leitet das Verhalten aus dem Trait der Art ab', () => {
    const defenders = [{ baseId: 'stone-golem' }, { baseId: 'frost-wolf' }]
    const units = buildCombatUnits({
      ...placement,
      teamSize: 1,
      defenders,
    })
    const monsters = units.filter((unit) => unit.role === 'monster')
    expect(monsters.map((unit) => unit.behavior)).toEqual([
      behaviorForTrait('toughHide'),
      behaviorForTrait('restless'),
    ])
  })

  it('setzt Helden, Boss und unbekannte Arten auf den Grundfall', () => {
    const units = buildCombatUnits({
      ...placement,
      teamSize: 2,
      defenders: [{ baseId: 'gibt-es-nicht' }],
    })
    // Der Platzhalter für eine veraltete Art trägt die Basiswerte und kein
    // Profil: ein erfundenes Verhalten wäre eine Entscheidung ohne Beleg.
    expect(units.every((unit) => unit.behavior === 'none')).toBe(true)
  })
})
