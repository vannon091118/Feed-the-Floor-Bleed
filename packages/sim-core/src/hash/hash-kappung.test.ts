import { describe, expect, it } from 'vitest'
import { hashStart, hashWord } from './fnv1a'

/**
 * Zwei verschiedene Zahlen dürfen sich nicht denselben Hash teilen.
 *
 * Bis zum 2026-09-30 stand in `hashWord` ein `>>> 0` und danach vier feste
 * Bytes. Eine Zahl und dieselbe Zahl plus 2³² lieferten damit denselben
 * Beitrag, also denselben Hash — und `fingerprint.ts` hasht damit Kampfzahlen.
 * Zwei verschiedene Kämpfe konnten denselben Trail-Hash tragen, und der Server
 * akzeptierte einen gefälschten Log, weil der Hash stimmte.
 *
 * Dieser Test stand anfangs **umgekehrt**: Er erwartete die Kollision und war
 * deshalb grün, solange der Fehler da war. Seit dem Fix verbietet er sie. Der
 * erste Test fällt wieder, sobald jemand den Beitrag auf 32 Bit zurückkappt —
 * nur jetzt ist das ein Fehler und kein Beweis.
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
    // Ohne das Vorzeichenbyte liefen -1 und 0 auf derselben Bahn.
    expect(hashWord(hashStart(), -1)).not.toBe(hashWord(hashStart(), 0))
    expect(hashWord(hashStart(), -1)).not.toBe(hashWord(hashStart(), 1))
  })

  it('trägt die oberen Bits einer Zahl statt nur vier Bytes', () => {
    // Zwei Zahlen, die sich erst weit oben im Wertbereich trennen.
    const tief = 2 ** 45
    const hoch = 2 ** 45 + 1
    expect(hashWord(hashStart(), tief)).not.toBe(hashWord(hashStart(), hoch))
  })
})
