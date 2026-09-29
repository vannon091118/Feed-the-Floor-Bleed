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
 *
 * **Vierte Verschiebung vom 2026-09-29 — die Klasse steht im Spec, ohne dass
 * sie jemand liest.** Jede Einheit trägt jetzt `class` aus dem Vokabular des
 * Contracts, und weil `specHash` den Spec vollständig hasht, verschiebt das
 * beide Läufe. Sonst ändert sich nichts: die Engine schreibt ausschließlich
 * `none`, und Ticks, Ereignisse, Trail und Stufe unten bleiben deshalb Zeichen
 * für Zeichen dieselben. Der Pin belegt damit genau das, was er soll — der
 * Hash folgt dem Feld, nicht dem Verhalten, und kein Lauf hat sich anders
 * entschieden. Anders als bei der dritten Verschiebung ist hier **kein**
 * Ereignis dazugekommen: `ability` und `reveal` stehen im Vokabular, aber noch
 * schreibt sie niemand.
 *
 * `sim_version 0.0.7→0.0.8`, `CONTRACT_VERSION 8→9`, Migration
 * `007_contract_v9.sql`.
 *
 * **Fünfte Verschiebung vom 2026-09-29 — der Boss war die Wand, und der erste
 * Pin kippt zum ersten Mal auf `heroes-win`.** `BOSS_RULES` gingen von
 * 200000/16000/5000/700 auf 132000/12000/1000/500. Der Grund ist eine
 * Freigabe, keine Abstimmung: mit den Vorgängerwerten gewann das Dreierteam in
 * **0 von 32 Seeds**, auch ohne einen einzigen Platzmonster. 48 Seeds je
 * Verteidigerplatz nach der Änderung ergeben Boss plus drei Platzmonster zu
 * 88 % — dem Zielband des Referenzkampfs aus `docs/CONCEPT_REVIEW.md`
 * Abschnitt 0b.
 *
 * **Der erste Pin ist deshalb der Beleg und nicht nur eine gewanderte Zahl:**
 * `monsters-win` wird `heroes-win`, der Lauf endet nach 196 statt 216 Ticks
 * und 396 statt 413 Ereignissen. Das ist die erste Stelle im Repository, an
 * der ein Lauf nachweislich **gewonnen** wird. Der zweite Lauf bleibt
 * `monsters-win` und verliert genau ein Ereignis — dort ändert sich die
 * Reihenfolge, nicht der Ausgang.
 *
 * `sim_version 0.0.8→0.0.9`: gespeicherte Läufe rechnen mit dem Bosswert
 * weiter, und genau deshalb muss der alte Stand als fremd erkannt werden.
 * `CONTRACT_VERSION` bleibt 9 und es gibt keine Migration — die Form des
 * Wire-Formats ändert sich nicht, nur eine Zahl der Simulation.
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
      hash: '261cd39a',
      stage: 'heroes-win',
      ticks: 196,
      events: 396,
      trail: 127,
    })
  })

  it('pinnt den Lauf auf der Umweg-Route mit voller Belegung', () => {
    expect(observed(snakeGrid(), 5)).toEqual({
      hash: 'ee21afc5',
      stage: 'monsters-win',
      ticks: 166,
      events: 673,
      trail: 253,
    })
  })
})
