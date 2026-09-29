import { resolveSnapshotRaid } from '@floor/sim-core'
import { afterEach, describe, expect, it } from 'vitest'
import { startDungeon } from '../src/dungeon-editor/model'
import { fixture } from '../src/fixture-data'
import { fixtureTeamConditions } from '../src/raid/fixture-raid'
import { fallenLootProfiles } from '../src/raid/loot-source'
import { setPlaybackLog } from '../src/raid/playback'
import { fixtureRaidLog } from './raid-fixtures'

/**
 * Die Beutequelle des Laufs.
 *
 * `goldForRun` in `village/loot.ts` war freigegeben, gebaut und geprüft und
 * hatte keinen Leser im Spielerpfad: die Formel rechnete, der Bestand wuchs
 * nicht. Dieser Test prüft die Naht, an der ein Lauf seine Beute wird — welche
 * Gegner gefallen sind und wie sie auf die eingefrorenen Plätze zeigen. Die
 * Zahlen selbst sind in `loot.test.ts` und `strength.test.ts` absolut gepinnt.
 */
afterEach(() => {
  setPlaybackLog(null)
})

describe('Beutequelle des geladenen Laufs', () => {
  it('liefert ohne Log nichts', () => {
    setPlaybackLog(null)
    expect(fallenLootProfiles()).toEqual([])
  })

  it('liest die gefallenen Verteidiger mit ihrer Stufe', () => {
    const { log } = fixtureRaidLog()
    setPlaybackLog(log)
    // Frostwolf Stärke 2, Steingolem Stärke 5, beide Generation 1. Beide
    // sterben — und seit dem 2026-09-29 gewinnen **auch die Helden**, weil der
    // Boss von 200000/16000/5000/700 auf 132000/12000/1000/500 gegangen ist.
    // Die Zeile ist eine Voraussetzung des Laufs, nicht der geprüfte Gegenstand:
    // die Beute bleibt dieselbe, weil beide Monster wie vorher fallen.
    expect(log.stage).toBe('heroes-win')
    expect(fallenLootProfiles()).toEqual([
      { strength: 2, generation: 1 },
      { strength: 5, generation: 1 },
    ])
  })

  it('zählt belegte Plätze und nicht die Nummer des Slots', () => {
    const { log } = fixtureRaidLog()
    setPlaybackLog(log)
    // Derselbe Lauf, ein anderer eingefrorener Stand: der erste Slot ist leer.
    // `monster-0` ist der **erste belegte** Platz, nicht Slot 0 — ein Index in
    // der Slot-Liste zeigte hier auf den Frostwolf und meinte den Steingolem.
    const mitLeeremErstenPlatz = [
      { monsterId: null },
      { monsterId: 'stone-golem' },
      { monsterId: 'frost-wolf' },
      { monsterId: null },
      { monsterId: null },
    ]
    expect(fallenLootProfiles(mitLeeremErstenPlatz)).toEqual([
      { strength: 5, generation: 1 },
      { strength: 2, generation: 1 },
    ])
  })

  it('übergeht eine unbekannte Art, statt eine Stufe zu erfinden', () => {
    const { log } = fixtureRaidLog()
    setPlaybackLog(log)
    expect(
      fallenLootProfiles([
        { monsterId: 'nicht-im-pool' },
        { monsterId: 'stone-golem' },
        { monsterId: null },
        { monsterId: null },
        { monsterId: null },
      ]),
    ).toEqual([{ strength: 5, generation: 1 }])
  })

  it('zahlt für den Boss nichts, auch wenn er allein fällt', () => {
    // Ohne Verteidiger gewinnen die Helden; gefallen ist dann nur der Boss.
    const bossAllein = resolveSnapshotRaid({
      grid: startDungeon(),
      seed: 4242,
      teamSize: fixture.team.length,
      team: fixtureTeamConditions(),
      defenders: [],
      floor: 1,
      token: 'beute-ohne-verteidiger',
    }).log.log
    expect(bossAllein.stage).toBe('heroes-win')
    expect(bossAllein.events.some((event) => event.type === 'death')).toBe(true)
    setPlaybackLog(bossAllein)
    expect(fallenLootProfiles()).toEqual([])
  })
})
