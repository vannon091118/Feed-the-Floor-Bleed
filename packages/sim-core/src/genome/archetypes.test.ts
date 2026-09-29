import { describe, expect, it } from 'vitest'
import { baseGenome, baseMonster, baseMonsters, breed, mutate } from './index'
import { ARCHETYPE_IDS, type ArchetypeId } from './types'

/**
 * Die Rollenverteilung des Pools, festgehalten statt gemessen.
 *
 * **Die Zahlen sind `[K]`** — die Kampfbalance ist laut
 * `docs/VISUAL_GRUNDSATZ.md` offen, und die Verteilung ist Teil dessen, was
 * offen ist. Sie steht hier als Sollwert, damit eine spätere Umverteilung
 * eine bewusste Handlung ist und nicht ein Nebeneffekt einer Zahlenänderung.
 * Wer sie ändert, ändert damit die Balance und muss `docs/CHANGELOG.md` und
 * die Messung in `combat/balance-report.test.ts` mitziehen.
 */
const VERTEILUNG: Record<ArchetypeId, number> = {
  tank: 6,
  damage: 4,
  support: 3,
  ambusher: 3,
  controller: 2,
  swarm: 2,
}

function zaehle(): Record<string, number> {
  const counts: Record<string, number> = {}
  for (const monster of baseMonsters()) {
    counts[monster.archetype] = (counts[monster.archetype] ?? 0) + 1
  }
  return counts
}

describe('Archetypen des Pools', () => {
  it('gibt jedem Basis-Monster eine der sechs Rollen', () => {
    for (const monster of baseMonsters()) {
      expect(ARCHETYPE_IDS).toContain(monster.archetype)
    }
  })

  it('verwendet alle sechs Rollen und keine darüber hinaus', () => {
    const counts = zaehle()
    expect(Object.keys(counts).sort()).toEqual([...ARCHETYPE_IDS].sort())
  })

  it('hält die freigegebene Verteilung fest', () => {
    expect(zaehle()).toEqual(VERTEILUNG)
  })

  it('gibt einem Kind die Rolle eines Elternteils, nicht eine dritte', () => {
    // Die Rolle wandert nicht durch das Genom: sie hängt an der Art, und die
    // Art folgt bei der Zucht einem Elternteil. Deshalb genügt der Blick auf
    // `baseId` — ein zweites Rollenfeld im Genom wäre eine zweite Wahrheit.
    const paare: [string, string][] = [
      ['stone-golem', 'mire-witch'],
      ['frost-wolf', 'shade-prowler'],
      ['ember-titan', 'grave-moth'],
      ['frost-herald', 'mire-hound'],
    ]
    for (const [elternA, elternB] of paare) {
      const erlaubt = [
        baseMonster(elternA).archetype,
        baseMonster(elternB).archetype,
      ]
      for (let seed = 0; seed < 8; seed += 1) {
        const kind = breed([baseGenome(elternA), baseGenome(elternB)], seed)
        expect(erlaubt).toContain(baseMonster(kind.baseId).archetype)
      }
    }
  })

  it('behaelt die Rolle ueber eine Mutation', () => {
    const vorher = baseGenome('shade-prowler')
    const nachher = mutate(vorher, 11)
    expect(baseMonster(nachher.baseId).archetype).toBe(
      baseMonster(vorher.baseId).archetype,
    )
  })
})
