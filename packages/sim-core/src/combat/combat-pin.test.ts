import { describe, expect, it } from 'vitest'
import { baseMonsters } from '../genome/registry'
import { CellType, createDungeonGrid, setCell } from '../grid'
import { resolveCombat } from './index'

/**
 * Golden-Pin des Kampf-Hashes.
 *
 * Die Engines sind abgedeckt (gleicher Seed, Seed-Sensitivität, Trail,
 * Replay), aber keine davon pinnt einen absoluten Hash: alle vergleichen zwei
 * Läufe miteinander. Damit bliebe eine beiläufige Änderung an Einheiten,
 * Regelwerten oder Event-Reihenfolge grün, solange sie nur deterministisch
 * ist — und genau diese Änderung verschiebt den Hash jedes gespeicherten
 * Replays, ohne dass eine Version steigt.
 *
 * Diese Datei schließt die Lücke: fester Seed, festes Grid, erwarteter Hash
 * als Konstante. Ein roter Lauf hier ist kein Fehler, sondern eine
 * Entscheidung, die bewusst getroffen werden muss:
 *
 *   1. Ist die Änderung gewollt?
 *   2. Verschiebt sie den Hash, also `sim_version` und `CONTRACT_VERSION`?
 *   3. Sind die betroffenen Doku- und Migrationsstellen nachgezogen?
 *
 * Erst danach werden die Zahlen hier angepasst, und zwar im selben Commit.
 *
 * **Verschiebung vom 2026-09-29 — beide Werte sind neu, und der Grund ist
 * belegt, nicht bequem.** Vorher bekam jeder Verteidiger-Slot dieselben
 * Basiswerte; die Art aus dem Snapshot wurde nie aufgelöst, weil
 * `resolveCombat` nur eine **Anzahl** entgegennahm. Seit der Kampf die Art
 * kennt, rechnet er die echten Werte aus `genome/stats`.
 *
 * Der kürzere Lauf ist der Beleg für einen **Größenordnungsfehler**, nicht für
 * ein Balanceproblem: fünf Monster mit je rund 41000 Gesundheit gegen Helden
 * mit je 60000 beenden den Kampf in 180 statt 401 Ticks. Die Held-Nullpunkte
 * sind seither nie gegen echte Monsterwerte gemessen worden. Die Zahl, die das
 * richtet, ist eine `[K]`-Größe und wird nicht hier erfunden — siehe
 * `docs/CONCEPT_REVIEW.md` Abschnitt 0b.
 *
 * **Zweite Verschiebung vom 2026-09-29 — die Route ist wieder die
 * Bewegungswahrheit.** Ein Zwischenstand ließ Einheiten frei in der Fläche
 * laufen und übergab `simulateCombat` einen zweiten Ortskontext neben dem
 * Trail. Das war mit der Replay-Prüfung unvereinbar: `replayCombat` und
 * `verifyCombatLog` lesen ausschließlich den Log, und eine Begehbarkeit, die
 * nur im Grid steht, hätte jeden gespeicherten Lauf unverifizierbar gemacht.
 * Die Bewegung läuft seither wieder in Schritten auf der Route, die Zonen
 * hängen als `zoneId` am Trail, und die Verteidiger kommen aus ihren
 * Platzierungsgruppen statt aus einer Slot-Ratio über die Routenlänge.
 *
 * Drei Gründe verschieben den Hash, und alle drei sind gewollt: die kürzere
 * Bewegung (weniger Ereignisse), der neue Aufstellungsort der Verteidiger und
 * der Hinterhalt, der beim ersten Angriff eines aufgestellten Verteidigers
 * Rüstung durchdringt und dafür ein eigenes Ereignis schreibt. Das neue Feld
 * `zoneId` am Trail und `ambushZoneId` am Spec stehen im Hash.
 *
 * `sim_version 0.0.5→0.0.6`, `CONTRACT_VERSION 6→7`, Migration
 * `005_contract_v7.sql`.
 *
 * **Dritte Verschiebung vom 2026-09-29 — das Verhalten steht im Log und
 * ändert die Wahl.** Jeder Verteidiger trägt jetzt ein `behavior`, das aus dem
 * Trait seiner Art entsteht (`genome/behavior.ts`), und das Feld gehört zum
 * Hash, weil ein Replay nur den Log liest: wer das nächste Ziel wählt, steht
 * damit nicht mehr im Speicher, sondern im Spec. Zwei Effekte liegen in den
 * neuen Zahlen. Der erste ist rein rechnerisch — ein weiteres Pflichtfeld im
 * `specHash` verschiebt beide Läufe. Der zweite ist eine echte Entscheidung:
 * `tank`, `hunter` und `control` wählen ein anderes Ziel als die alte
 * „nächstes Ziel"-Regel, und auf der Umweg-Route kostet die neue Wahl einen
 * Tick mehr (165→166), während Ereigniszahl und Trail gleich bleiben. Auf dem
 * offenen Fixture-Grid ändert sich nur der Hash — dort fiel die neue Wahl mit
 * der alten zusammen, und das ist der Beleg, dass der Grundfall `none` die
 * alte Regel ist.
 *
 * `sim_version 0.0.6→0.0.7`, `CONTRACT_VERSION 7→8`, Migration
 * `006_contract_v8.sql`.
 */
function observed(
  grid: ReturnType<typeof createDungeonGrid>,
  monsterSlots: number,
) {
  const defenders = baseMonsters()
    .slice(0, monsterSlots)
    .map((base) => ({ baseId: base.id }))
  const log = resolveCombat({ grid, seed: 4242, teamSize: 3, defenders })
  return {
    hash: log.hash,
    stage: log.stage,
    ticks: log.ticks,
    events: log.events.length,
    trail: log.trail.length,
  }
}

/** Zwei versetzte Barrieren erzwingen eine deutlich längere Route als der Direktweg. */
function snakeGrid() {
  const grid = createDungeonGrid()
  for (let x = 0; x < 63; x += 1) setCell(grid, { x, y: 20 }, CellType.Wall)
  for (let x = 1; x < 64; x += 1) setCell(grid, { x, y: 40 }, CellType.Wall)
  return grid
}

describe('Golden-Pin des Kampf-Hashes', () => {
  it('pinnt den Lauf auf dem offenen Fixture-Grid', () => {
    expect(observed(createDungeonGrid(), 2)).toEqual({
      hash: '9f919007',
      stage: 'monsters-win',
      ticks: 216,
      events: 413,
      trail: 127,
    })
  })

  it('pinnt den Lauf auf der Umweg-Route mit voller Belegung', () => {
    expect(observed(snakeGrid(), 5)).toEqual({
      hash: 'f93e3175',
      stage: 'monsters-win',
      ticks: 166,
      events: 674,
      trail: 253,
    })
  })
})
