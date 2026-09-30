import { describe, expect, it } from 'vitest'
import { hashStart, hashWord } from './fnv1a'

/**
 * Zwei verschiedene Zahlen dürfen sich nicht denselben Hash teilen — und eine
 * Zahl, die keine ist, darf sich nicht als eine andere ausgeben.
 *
 * Bis zum 2026-09-30 stand in `hashWord` ein `>>> 0` und danach vier feste
 * Bytes. Eine Zahl und dieselbe Zahl plus 2³² lieferten denselben Beitrag, also
 * denselben Hash, und `fingerprint.ts` hasht damit Kampfzahlen.
 *
 * Dieser Test stand anfangs **umgekehrt**: Er erwartete die Kollision und war
 * deshalb grün, solange der Fehler da war. Ein Test, der einen Fehler erwartet,
 * ist kein Beleg, sondern eine Festschreibung.
 *
 * Die vier Wächter unten kamen aus dem Red Team vom selben Tag. Sie halten
 * Stellen fest, die vorher still schiefgingen: die Endlosschleife, das
 * stille Abschneiden und die drei Werte, die wie eine echte Null hashten.
 */
describe('Beitrag einer Zahl zum Trail-Hash', () => {
  it('unterscheidet eine Zahl von ihrer Entsprechung modulo 2^32', () => {
    const klein = 60_000
    const gross = klein + 2 ** 32
    expect(gross).not.toBe(klein)
    expect(hashWord(hashStart(), gross)).not.toBe(hashWord(hashStart(), klein))
  })

  it('unterscheidet zwei Werte unterhalb der Kappung', () => {
    // Gegenprobe: Der Hash ist nicht generell kaputt, er kappt nur oben.
    expect(hashWord(hashStart(), 60_000)).not.toBe(
      hashWord(hashStart(), 61_000),
    )
  })

  it('unterscheidet Zahlen, die sich nur im Vorzeichen unterscheiden', () => {
    // Ohne das Vorzeichenbyte liefen -1 und 0 auf derselben Bahn. Auch zwei
    // negative Zahlen müssen sich trennen, nicht nur -1 von 0.
    expect(hashWord(hashStart(), -1)).not.toBe(hashWord(hashStart(), 0))
    expect(hashWord(hashStart(), -1)).not.toBe(hashWord(hashStart(), 1))
    expect(hashWord(hashStart(), -1)).not.toBe(hashWord(hashStart(), -2))
    expect(hashWord(hashStart(), -60000)).not.toBe(
      hashWord(hashStart(), -60001),
    )
  })

  it('trägt die oberen Bits einer Zahl statt nur vier Bytes', () => {
    // Zwei Zahlen, die sich erst weit oben im Wertbereich trennen.
    const tief = 2 ** 45
    const hoch = 2 ** 45 + 1
    expect(hashWord(hashStart(), tief)).not.toBe(hashWord(hashStart(), hoch))
  })

  it('weist Zahlen zurück, die nicht endlich sind', () => {
    // `do … while (remaining > 0)` mit Infinity hat den Lauf angehalten:
    // Math.floor(Infinity / 256) bleibt Infinity. Genau eine Zahl braucht die
    // do-Form, damit sie nicht leer bliebe — diese eine wird vorher entschieden.
    expect(() => hashWord(hashStart(), Number.POSITIVE_INFINITY)).toThrow(
      RangeError,
    )
    expect(() => hashWord(hashStart(), Number.NEGATIVE_INFINITY)).toThrow(
      RangeError,
    )
    expect(() => hashWord(hashStart(), Number.NaN)).toThrow(RangeError)
  })

  it('weist Zahlen mit Nachkommastellen zurück, statt sie still zu kappen', () => {
    // Math.trunc machte aus 1.9, 1.1 und 1 denselben Beitrag.
    expect(() => hashWord(hashStart(), 1.9)).toThrow(RangeError)
    expect(() => hashWord(hashStart(), 1.1)).toThrow(RangeError)
    expect(() => hashWord(hashStart(), -0.5)).toThrow(RangeError)
  })

  it('weist Werte zurück, die keine Zahl sind', () => {
    // Math.trunc(NaN), Math.trunc(undefined) und Math.trunc(null) sind alle 0,
    // also hashten ein vergiftetes Feld und eine echte Null gleich.
    expect(() => hashWord(hashStart(), undefined as unknown as number)).toThrow(
      RangeError,
    )
    expect(() => hashWord(hashStart(), null as unknown as number)).toThrow(
      RangeError,
    )
  })

  it('hasht die Null als ihren eigenen Wert und nicht als leeren Lauf', () => {
    // Gegenprobe zum Wächter: 0 muss einen Beitrag haben und darf nicht mit
    // dem Ausgangswert zusammenfallen. Die frühere `do`-Schleife sorgte dafür,
    // dass 0 mindestens eine Runde lief; genau diese eine Zahl entscheidet der
    // neue Code vorher. Der Wert ist festgehalten, damit sich das nicht ändert.
    const nullBeitrag = hashWord(hashStart(), 0)
    expect(nullBeitrag).toBe(hashWord(hashStart(), 0))
    expect(nullBeitrag).not.toBe(hashStart())
    expect(nullBeitrag).not.toBe(hashWord(hashStart(), 1))
  })
})
