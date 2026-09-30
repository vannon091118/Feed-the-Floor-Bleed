import { findPath, resolveSnapshotRaid, summarizeCombat } from '@floor/sim-core'
import { beforeEach, describe, expect, it } from 'vitest'
import { startDungeon } from '../src/dungeon-editor/model'
import { buildCombatLog } from '../src/raid/combat-source'
import {
  buildFixtureUpload,
  runLocalFixtureRaid,
} from '../src/raid/fixture-raid'
import { setPlaybackLog } from '../src/raid/playback'

/**
 * Die Naht zwischen den beiden Kampfwegen.
 *
 * Der Auftrag, den das Dorf abrechnet, und die Timeline des Replays rechnen
 * denselben Lauf — beides über `resolveCombat`, aber aus zwei verschiedenen
 * Eingaben. Der Auftrag trägt keinen Log, nur Hash und Kurzfassung; der Hash
 * deckt Seed, Einheiten, jeden Tick und jeden Trail-Schritt ab. Gleiche Hash und
 * gleiche Kurzfassung heißen deshalb: beide Wege haben denselben Lauf gerechnet,
 * nicht zwei ähnliche.
 *
 * Die Fälle, die nur den Log gegen seine Route prüfen, stehen in
 * `raid-timeline.test.ts`; sie sind hier nicht wiederholt.
 */
beforeEach(() => {
  setPlaybackLog(null)
})
describe('Raid-Log aus dem Core', () => {
  it('rechnet denselben Log auf jeder Etage — der Auftrag nimmt die des Dorfes, der Replay seine', () => {
    // Genau diese Zusage trägt den Fall davor. Die Etage wandert in die
    // Envelope und nicht in den Log; fiele sie in die Simulation, wären die
    // beiden Wege nach dem ersten Etagenkauf auseinander.
    const grid = startDungeon()
    const aufEins = runLocalFixtureRaid(grid)
    if (aufEins.status !== 'completed')
      throw new Error(`Auftrag ${aufEins.status}`)
    const replay = buildCombatLog(grid, findPath(grid))
    if (!replay) throw new Error('Der Startdungeon liefert keinen Lauf')
    expect(replay.hash).toBe(aufEins.result.hash)
    expect(summarizeCombat(replay)).toEqual(aufEins.result.summary)
  })

  it('würde ohne die Nachwirkung einen anderen Lauf rechnen', () => {
    // Gegenprobe: fiele die Aufstellung aus dem einen Weg, muss dieser Test
    // rot werden. Ein Gleichheitstest, der auch dann grün bleibt, wenn die
    // Nachwirkung fehlt, prüft nichts.
    const grid = startDungeon()
    const job = runLocalFixtureRaid(grid)
    if (job.status !== 'completed') throw new Error(`Auftrag ${job.status}`)
    const upload = buildFixtureUpload(grid)
    const ohneNachwirkung = resolveSnapshotRaid({
      grid,
      teamSize: upload.activeTeam.length,
      defenders: upload.monsterSlots.map((slot) => ({
        baseId: slot.monsterId,
      })),
      seed: job.seed,
      floor: job.floor,
      token: job.result.token,
      team: undefined,
    }).log.log
    expect(ohneNachwirkung.hash).not.toBe(job.result.hash)
  })
})
