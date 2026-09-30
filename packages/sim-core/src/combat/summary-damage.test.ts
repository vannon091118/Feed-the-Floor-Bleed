import { describe, expect, it } from 'vitest'
import { baseMonsters } from '../genome/registry'
import { createDungeonGrid } from '../grid'
import { replayCombat } from './replay'
import { resolveCombat } from './resolve'
import { summarizeCombat } from './summary'

/**
 * Die verursachte Schadensmenge je Einheit.
 *
 * `damage` in der Summary sagt nur, **wie viel** Schaden gefallen ist. Die
 * Erfahrung braucht aber, **wer** ihn verursacht hat — ein Wesen erfahrnt nach dem
 * Schaden, den es angerichtet hat, und das auch dann, wenn es dabei stirbt. Ohne
 * diese Aufteilung müsste der Client den Log selbst auswerten.
 *
 * Jeder Fall hier prüft eine Eigenschaft, die ein Gleichheitstest nicht fängt:
 * dass die Bilanz stimmt, dass sie zum Log passt, dass sie sich wiederholen lässt
 * und dass die Summe der Teile die Gesamtzahl ergibt.
 */
const grid = createDungeonGrid()
const base = {
  grid,
  teamSize: 3,
  defenders: baseMonsters()
    .slice(0, 3)
    .map((base) => ({ baseId: base.id })),
}
const lauf = (seed: number) => resolveCombat({ ...base, seed })

describe('Schadensbilanz je Einheit', () => {
  it('weist jedem Verursacher seinen Schaden zu, nicht der Gesamtzahl', () => {
    const log = lauf(42)
    const summary = summarizeCombat(log)

    // Rechnet die Bilanz aus dem Log nach, statt sie zu prüfen, ob sie sich
    // selbst gefällt: Die Quelle der Wahrheit ist der Log, nicht die Summary.
    const erwartet = new Map<string, number>()
    for (const event of log.events) {
      if (event.type !== 'attack') continue
      erwartet.set(
        event.actorId,
        (erwartet.get(event.actorId) ?? 0) + event.amount,
      )
    }

    const alle = [...summary.damageByHero, ...summary.damageByMonster]
    expect(alle).toHaveLength(log.units.length)
    for (const eintrag of alle) {
      expect(eintrag.damage).toBe(erwartet.get(eintrag.unitId) ?? 0)
    }
  })

  it('trennt Helden und Monster nach Seite', () => {
    const log = lauf(42)
    const summary = summarizeCombat(log)
    const heldIds = new Set(
      log.units.filter((u) => u.side === 'heroes').map((u) => u.id),
    )
    const monsterIds = new Set(
      log.units.filter((u) => u.side === 'monsters').map((u) => u.id),
    )
    for (const eintrag of summary.damageByHero) {
      expect(heldIds.has(eintrag.unitId)).toBe(true)
    }
    for (const eintrag of summary.damageByMonster) {
      expect(monsterIds.has(eintrag.unitId)).toBe(true)
    }
  })

  it('führt auch Einheiten mit null Schaden auf', () => {
    // Gegenprobe zur Kürze: Eine Liste nur der Treffer wäre kürzer, aber sie
    // beantwortet die Frage nicht, die die Erfahrung braucht — ein Wesen ohne
    // Schaden hat trotzdem einen Eintrag und damit den Beweis, dass es lief.
    const log = lauf(7)
    const summary = summarizeCombat(log)
    const alle = [...summary.damageByHero, ...summary.damageByMonster]
    expect(alle.every((e) => e.damage >= 0)).toBe(true)
    expect(alle).toHaveLength(log.units.length)
  })

  it('summiert sich zur Gesamtzahl auf', () => {
    const summary = summarizeCombat(lauf(42))
    const summe = [...summary.damageByHero, ...summary.damageByMonster].reduce(
      (summe, e) => summe + e.damage,
      0,
    )
    expect(summe).toBe(summary.damage)
  })

  it('liefert für denselben Seed dieselbe Bilanz in derselben Reihenfolge', () => {
    // Die Reihenfolge entsteht aus dem Log; sie darf nicht von einer
    // Implementierungsentscheidung abhängen. Deshalb ist sie sortiert, und das
    // wird hier festgehalten.
    const erste = summarizeCombat(lauf(42))
    const zweite = summarizeCombat(lauf(42))
    expect(zweite.damageByHero).toEqual(erste.damageByHero)
    expect(zweite.damageByMonster).toEqual(erste.damageByMonster)
    for (const liste of [erste.damageByHero, erste.damageByMonster]) {
      const ids = liste.map((e) => e.unitId)
      expect(ids).toEqual([...ids].sort())
    }
  })

  it('überlebt das Replay, weil der Log die Quelle bleibt', () => {
    // Ein Replay liest nur den Log. Wenn die Bilanz nur in der Summary stünde,
    // wäre sie nach der Übertragung nicht mehr nachrechenbar.
    const log = lauf(42)
    const erneut = replayCombat(log)
    const original = summarizeCombat(log)
    const ausReplay = summarizeCombat(erneut)
    expect(ausReplay.damageByHero).toEqual(original.damageByHero)
    expect(ausReplay.damageByMonster).toEqual(original.damageByMonster)
  })
})
