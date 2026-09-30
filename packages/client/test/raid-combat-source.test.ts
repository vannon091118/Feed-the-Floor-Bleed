import { findPath, resolveSnapshotRaid, summarizeCombat } from '@floor/sim-core'
import { beforeEach, describe, expect, it } from 'vitest'
import { startDungeon } from '../src/dungeon-editor/model'
import { buildCombatLog } from '../src/raid/combat-source'
import { runLocalFixtureRaid, snapshotInput } from '../src/raid/fixture-raid'
import { playbackLog, setPlaybackLog } from '../src/raid/playback'
import { blockedGrid, fixtureRaidLog } from './raid-fixtures'

/**
 * Die Naht zwischen den beiden Kampfwegen.
 *
 * `combat-source.ts` hatte keine eigene Testdatei: Die Tests des Timeline-Modells
 * prüften den Log mit, gerechnet wurde er in `fixture-raid.ts`. Damit stand hier
 * nie die Frage, die vorher niemand stellte — rechnen der Auftrag, den das Dorf
 * abrechnet, und die Timeline denselben Lauf? Der Fall stand in der
 * Timeline-Datei und verglich zwei Aufrufe derselben Form; die Aufteilung folgt
 * dem globalen LOC-Cap.
 */
beforeEach(() => {
  setPlaybackLog(null)
})
describe('Raid-Log aus dem Core', () => {
  it('rechnet denselben Lauf wie die Route, ohne den Store anzufassen', () => {
    const { grid, route, log } = fixtureRaidLog()
    const combat = buildCombatLog(grid, route)
    expect(combat).toEqual(log)
    expect(combat?.trail.length).toBe(route.path.length)
    expect(playbackLog.value).toBeNull()
  })

  it('liefert für eine blockierte Route null', () => {
    const blocked = blockedGrid()
    expect(buildCombatLog(blocked, findPath(blocked))).toBeNull()
  })

  it('rechnet für denselben Plan den Lauf, den der Auftrag des Dorfes abgerechnet hat', () => {
    // Der Auftrag trägt keinen Log, nur Hash und Kurzfassung — der Hash deckt
    // Seed, Einheiten, jeden Tick und jeden Trail-Schritt ab. Gleiche Hash und
    // gleiche Kurzfassung heißen deshalb: beide Wege haben denselben Lauf
    // gerechnet, nicht zwei ähnliche.
    const grid = startDungeon()
    const job = runLocalFixtureRaid(grid)
    if (job.status !== 'completed') throw new Error(`Auftrag ${job.status}`)
    const timeline = buildCombatLog(grid, findPath(grid))
    if (!timeline) throw new Error('Der Startdungeon liefert keinen Lauf')
    expect(timeline.hash).toBe(job.result.hash)
    expect(summarizeCombat(timeline)).toEqual(job.result.summary)
    expect(playbackLog.value).toBeNull()
  })

  it('rechnet denselben Log auf jeder Etage — der Auftrag nimmt die des Dorfes, der Replay seine', () => {
    // Genau diese Zusage trägt den Fall davor. Die Etage wandert in die
    // Envelope und nicht in den Log; fiele sie in die Simulation, wären die
    // beiden Wege nach dem ersten Etagenkauf auseinander.
    const grid = startDungeon()
    const aufEins = resolveSnapshotRaid(snapshotInput(grid, 1)).log.log
    const aufDrei = resolveSnapshotRaid(snapshotInput(grid, 3)).log.log
    expect(aufDrei.hash).toBe(aufEins.hash)
  })

  it('würde ohne die Nachwirkung einen anderen Lauf rechnen', () => {
    // Gegenprobe: fiele die Aufstellung aus dem einen Weg, muss dieser Test
    // rot werden. Ein Gleichheitstest, der auch dann grün bleibt, wenn die
    // Nachwirkung fehlt, prüft nichts.
    const grid = startDungeon()
    const job = runLocalFixtureRaid(grid)
    if (job.status !== 'completed') throw new Error(`Auftrag ${job.status}`)
    const ohneNachwirkung = resolveSnapshotRaid({
      ...snapshotInput(grid, 1),
      team: undefined,
    }).log.log
    expect(ohneNachwirkung.hash).not.toBe(job.result.hash)
  })
})
