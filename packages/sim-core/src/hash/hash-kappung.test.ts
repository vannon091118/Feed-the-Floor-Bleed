import { describe, expect, it } from 'vitest'
import { hashStart, hashWord } from './fnv1a'

/**
 * Zwei verschiedene Zahlen, ein Hash.
 *
 * `hashWord` schneidet mit `>>> 0` auf 32 Bit. Alles oberhalb 2³² fällt auf
 * denselben Wert zurück — und `fingerprint.ts` hasht damit Zahlen aus dem Kampf.
 * Zwei verschiedene Kämpfe können so denselben Trail-Hash tragen, und der Server
 * akzeptiert einen gefälschten Log, weil der Hash stimmt.
 *
 * Dieser Test ist der Beweis, nicht der Bericht über einen Beweis: Er fällt bei
 * einem ungekürzten Hash nicht aus, sondern zeigt die Kollision direkt.
 */
describe('32-Bit-Kappung im Trail-Hash', () => {
  it('bildet eine Zahl und ihre Entsprechung modulo 2^32 auf denselben Hash ab', () => {
    const klein = 60_000
    const gross = klein + 2 ** 32
    expect(gross).toBeGreaterThan(klein)
    expect(gross).not.toBe(klein)
    // Die Zahlen sind verschieden — der Hash ist es nicht.
    expect(hashWord(hashStart(), gross)).toBe(hashWord(hashStart(), klein))
  })

  it('unterscheidet zwei Werte unterhalb der Kappung', () => {
    // Gegenprobe: Der Hash ist nicht generell kaputt, er kappt nur oben.
    expect(hashWord(hashStart(), 60_000)).not.toBe(
      hashWord(hashStart(), 61_000),
    )
  })
})
