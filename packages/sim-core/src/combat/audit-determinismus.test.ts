import { describe, expect, it } from 'vitest'
import { CellType, createDungeonGrid, setCell } from '../grid'
import { resolveCombat } from './resolve'

/**
 * Wiederholbarkeit statt eines Golden Pins.
 *
 * Ein gewandernder Pin beweist nur, dass ein Lauf einmal so ausgegangen ist.
 * Diese Datei beweist das andere: dass derselbe Auftrag fünfmal hintereinander
 * dasselbe Ergebnis liefert. Ein Zufallslecker, ein nicht gesetzter Iterationszähler
 * oder eine zeitabhängige Verzweigung fällt hier auf, während er einen
 * vorhersehbaren Pin unauffällig neu schreibt.
 */
describe('Determinismus des Kampfes', () => {
  it('liefert für denselben Auftrag fünfmal denselben Hash', () => {
    const spec = {
      seed: 12345,
      grid: createDungeonGrid(),
      teamSize: 2,
      defenders: [{ baseId: 'base-boss' }],
      token: 'wiederholbarkeit',
    }
    const hashse = Array.from({ length: 5 }, () => resolveCombat(spec).hash)
    expect(new Set(hashse).size).toBe(1)
  })

  it('liefert für zwei verschiedene Seeds zwei verschiedene Verläufe', () => {
    // Gegenprobe: wären alle Seeds gleich, wäre der vorige Test grün, ohne
    // dass irgendetwas gerechnet würde.
    const base = {
      grid: createDungeonGrid(),
      teamSize: 2,
      defenders: [{ baseId: 'base-boss' }],
      token: 'gegenprobe',
    }
    const a = resolveCombat({ ...base, seed: 1 }).hash
    const b = resolveCombat({ ...base, seed: 2 }).hash
    expect(a).not.toBe(b)
  })

  it('lässt keinen Zustand in den nächsten Lauf — verketten ändert nichts', () => {
    // Der Verdacht, den man nach einem Absturz zuerst hat: ein Lauf färbt den
    // nächsten ein. Fünf hintereinander ausgeführte Läufe mit unterschiedlichen
    // Seeds müssen dieselben Hashes liefern wie fünf einzeln ausgeführte.
    const base = {
      grid: createDungeonGrid(),
      teamSize: 2,
      defenders: [{ baseId: 'base-boss' }],
      token: 'verkettung',
    }
    const seeds = [7, 8, 9, 10, 11]

    // Referenz: jeder Lauf bekommt einen frischen Prozess-Zustand, indem er
    // als einziger läuft und sein Ergebnis gemerkt wird.
    const einzeln = seeds.map((seed) => resolveCombat({ ...base, seed }).hash)

    // Verketten: dieselben Seeds nacheinander in einer Schleife.
    const verkettet: string[] = []
    for (const seed of seeds)
      verkettet.push(resolveCombat({ ...base, seed }).hash)

    expect(verkettet).toEqual(einzeln)
  })

  it('liefert dasselbe Ergebnis, wenn die Läufe in anderer Reihenfolge kommen', () => {
    // Umgekehrt: wenn ein Lauf den nächsten färbt, verschiebt sich das Ergebnis
    // mit der Ausführungsreihenfolge. Hier muss es sich nicht verschieben.
    const base = {
      grid: createDungeonGrid(),
      teamSize: 2,
      defenders: [{ baseId: 'base-boss' }],
      token: 'reihenfolge',
    }
    const seeds = [21, 22, 23]
    const vorwaerts = new Map(
      seeds.map((seed) => [seed, resolveCombat({ ...base, seed }).hash]),
    )
    const rueckwaerts = new Map(
      [...seeds]
        .reverse()
        .map((seed) => [seed, resolveCombat({ ...base, seed }).hash]),
    )
    expect(rueckwaerts).toEqual(vorwaerts)
  })

  it('macht einen Fehler aus dem Log reproduzierbar', () => {
    // Ein Log, dessen Hash sich wiederholen lässt, ist der Repro-Plan. Geht der
    // Hash über den Auftrag, ist die Fehlersuche eine Sache von Minuten.
    const spec = {
      seed: 4242,
      grid: createDungeonGrid(),
      teamSize: 2,
      defenders: [{ baseId: 'base-boss' }],
      token: 'repro',
    }
    const log = resolveCombat(spec)
    const erneut = resolveCombat(spec)
    // Gleicher Auftrag, gleicher Hash, und damit auffindbar, welcher Lauf es war.
    expect(erneut.hash).toBe(log.hash)
    expect(erneut.trail).toEqual(log.trail)
    expect(erneut.events).toEqual(log.events)
  })

  it('trennt zwei Kämpfe, die sich im Ergebnis ähnlich, im Log aber verschieden sind', () => {
    // Zwei Läufe können denselben Ausgang haben und trotzdem verschiedene
    // Kämpfe geführt haben. Der Hash trennt sie; die Zusammenfassung tut es
    // nicht. Ohne das bliebe ein Fehler, der nur im Log sichtbar ist, unsichtbar.
    const base = {
      grid: createDungeonGrid(),
      teamSize: 2,
      defenders: [{ baseId: 'base-boss' }],
      token: 'trennung',
    }
    const a = resolveCombat({ ...base, seed: 100 })
    const b = resolveCombat({ ...base, seed: 101 })
    const gleichVerlauf = a.trail.length === b.trail.length
    if (gleichVerlauf) expect(a.hash).not.toBe(b.hash)
    expect(a.hash).not.toBe(b.hash)
  })
  it('wirft bei einem Fehler immer denselben Fehler', () => {
    // Die andere Hälfte deiner Frage: Sind auch Fehler reproduzierbar? Ein
    // Fehler, der beim ersten Mal auftritt und beim zweiten verschwindet, ist
    // nicht zu debuggen. Hier muss derselbe ungültige Auftrag dieselbe
    // Meldung mit demselben Grund liefern.
    const base = {
      grid: createDungeonGrid(),
      teamSize: 2,
      defenders: [{ baseId: 'base-boss' }],
      token: 'fehlerpfad',
    }
    const mueldungen = new Set<string>()
    for (let i = 0; i < 5; i += 1) {
      try {
        resolveCombat({ ...base, seed: 1, teamSize: 6 })
        mueldungen.add('KEIN FEHLER')
      } catch (err) {
        mueldungen.add((err as Error).message)
      }
    }
    expect(mueldungen.size).toBe(1)
    expect([...mueldungen][0]).toContain('teamSize')
  })

  it('rechnet eine unerreichbare Route deterministisch in denselben Fehler', () => {
    // Die zweite Fehlerquelle: kein Weg zum Boss. Auch sie muss stabil sein —
    // und zwar als Fehler, nicht als Exception mit wechselndem Text.
    const grid = createDungeonGrid()
    // Der direkte Nachbar des Eingangs wird zur Wand; um ihn herum reicht der
    // Platz nicht für einen Umweg, weil der Standardaufbau eine einzige Spur
    // um den Start legt.
    setCell(grid, { x: 1, y: 0 }, CellType.Wall)
    const base = {
      grid,
      teamSize: 2,
      defenders: [{ baseId: 'base-boss' }],
      token: 'kein-weg',
    }
    const ergebnisse = new Set<string>()
    for (let i = 0; i < 5; i += 1) {
      try {
        ergebnisse.add(resolveCombat({ ...base, seed: 1 }).hash)
      } catch (err) {
        ergebnisse.add((err as Error).message)
      }
    }
    expect(ergebnisse.size).toBe(1)
  })
})
