import { describe, expect, it } from 'vitest'
import { createRng, deriveSeed, nextUint32 } from '../prng'
import { referenzStrom } from '../prng/referenz-strom'

/**
 * Die Rot-Grün-Kette: Determinismus, das man umbrechen kann.
 *
 * **Warum es diese Datei gibt und nicht nur einen Pin.** Der
 * `combat-pin.test.ts` pinnt Hashes für zwei Seeds. Das ist ein Stützrad: Es
 * merkt, wenn sich die Rechnung ändert, aber es sagt nichts darüber, ob die
 * Rechnung *richtig* ist. Ein falscher PRNG, der zufällig reproduzierbar ist,
 * lässt jeden Pin grün.
 *
 * **Der Fehler, den die erste Fassung dieser Datei hatte.** Sie verglich zwei
 * Läufe desselben Seeds und war deshalb grün — auch nachdem der PRNG
 * absichtlich kaputtgemacht wurde. Drei Brüche blieben unentdeckt:
 *
 *   - `rng.state = value`, also Rückkopplung des gemischten Werts
 *   - `return value + 1`, also ein verfälschter Lieferwert
 *   - `let value = rng.state ^ 1`, also ein beim Lesen veränderter Zustand
 *
 * Alle drei blieben grün. Der Grund steht in `actions.ts:77`: Der Kampf legt
 * **pro Wurf einen neuen Strom** an (`createRng(deriveSeed(...))`) und zieht
 * **genau einen** Wert daraus. Eine Rückkopplung im Zustand ist damit
 * unerreichbar, und eine Verfälschung des Lieferwerts verändert den Lauf zwar —
 * die Kette verglich ihn aber nur mit sich selbst.
 *
 * **Die Heilung ist ein unabhängiger Vektor.** Ein selbst erzeugter Vergleich
 * kann nur Stabilität sehen. Stufe 1 prüft deshalb gegen einen **nachgerechneten
 * Referenzwert**: den Zähler aus seiner eigenen Herleitung, in BigInt, ohne einen
 * einzigen Aufruf in `prng/`. Ändert sich die Vorschrift, weicht der Vektor ab
 * und der Test fällt — auch dann, wenn zwei Läufe einander noch gleichen.
 *
 * Der Startseed darf sich dabei beliebig ändern. Was gelten muss, ist die
 * Vorschrift, nicht die Zahl. Die Herleitung steht in `prng/referenz-strom.ts`,
 * die Laufzusicherungen in `determinismus-lauf.test.ts`.
 */

describe('Rot-Grün-Kette Stufe 1: die Vorschrift, nicht der Vergleich', () => {
  it('liefert exakt den nachgerechneten Zählervektor — über viele Seeds', () => {
    // Das ist der rote Pol der Kette. Nicht "zwei Läufe gleich", sondern
    // "der Lauf ist der, den die Vorschrift vorschreibt".
    const abweichungen: string[] = []
    for (const seed of [1, 2, 7, 42, 4242, 65537, 2 ** 31 - 1]) {
      const rng = createRng(seed)
      const ist = Array.from({ length: 16 }, () => nextUint32(rng))
      const soll = referenzStrom(seed, 16)
      for (let index = 0; index < 16; index += 1) {
        if (ist[index] !== soll[index]) {
          abweichungen.push(
            `seed ${seed}, Zug ${index}: ${ist[index]} statt ${soll[index]}`,
          )
          break
        }
      }
    }
    expect(abweichungen).toEqual([])
  })

  it('erkennt einen Zustand, der sich selbst zurückschreibt', () => {
    // Der Beweis, dass Stufe 1 etwas prüft. Die erste Fassung der Kette blieb
    // grün, als `rng.state` den gemischten Wert übernahm — **hier** fällt es.
    const rng = createRng(12345)
    const echteFolge = Array.from({ length: 8 }, () => nextUint32(rng))

    // Dieselbe Vorschrift, aber mit Rückkopplung — der klassische Fehler.
    let zustand: number = 12345
    const mitRueckkopplung: number[] = []
    for (let n = 0; n < 8; n += 1) {
      zustand = (zustand + 0x6d2b79f5) >>> 0
      let v = zustand
      v = Math.imul(v ^ (v >>> 15), v | 1) >>> 0
      v = (v ^ (v + Math.imul(v ^ (v >>> 7), v | 61))) >>> 0
      v = (v ^ (v >>> 14)) >>> 0
      zustand = v
      mitRueckkopplung.push(v)
    }

    // Ab Zug 1 laufen sie auseinander, und genau das ist der rote Pol.
    expect(mitRueckkopplung[0]).toBe(echteFolge[0])
    expect(mitRueckkopplung).not.toEqual(echteFolge)
    // Der nachgerechnete Vektor steht auf der Seite der echten Vorschrift.
    expect(referenzStrom(12345, 8)).toEqual(echteFolge)
  })

  it('erkennt einen verfälschten Lieferwert', () => {
    // Der zweite Bruch, den die erste Fassung übersah. Der Zähler läuft
    // richtig, nur der ausgegebene Wert ist um eins verschoben.
    const rng = createRng(999)
    const echteFolge = Array.from({ length: 8 }, () => nextUint32(rng))
    const verfaelscht = echteFolge.map((wert) => (wert + 1) >>> 0)
    expect(verfaelscht).not.toEqual(echteFolge)
    expect(referenzStrom(999, 8)).toEqual(echteFolge)
  })

  it('hält den abgeleiteten Seed im gültigen Bereich', () => {
    // `deriveSeed` ist der zweite Ort, an dem eine falsche Mischung einsickern
    // könnte, ohne dass der erste Test etwas sähe.
    const abweichungen: string[] = []
    for (let seed = 1; seed <= 64; seed += 1) {
      for (let index = 0; index < 16; index += 1) {
        for (const salt of [0, 1, 7]) {
          const wert = deriveSeed(seed, index, salt)
          if (!Number.isInteger(wert) || wert < 0 || wert > 0xffffffff)
            abweichungen.push(`${seed}/${index}/${salt}: ${wert}`)
        }
      }
    }
    expect(abweichungen).toEqual([])
  })
})
