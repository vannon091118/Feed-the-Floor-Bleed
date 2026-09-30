/**
 * Der Referenzzähler — die Vorschrift nachgerechnet, ohne sie aufzurufen.
 *
 * **Warum es diese Datei gibt.** Ein Test, der `nextUint32` mit sich selbst
 * vergleicht, prüft Stabilität. Determinismus heißt aber nicht Stabilität,
 * sondern: der Lauf ist der, den die Vorschrift vorschreibt. Die erste Fassung
 * der Determinismus-Kette hat genau das verwechselt — sie blieb grün, nachdem
 * drei verschiedene Brüche am PRNG eingebaut waren.
 *
 * **Die Herleitung ist absichtlich dumm.** Sie rechnet in BigInt nach, was
 * `mulberry32` in `Number` tut, und benutzt dabei **keinen** Aufruf aus
 * `prng/`. Wer den echten Zähler kaputtmacht, muss diese Datei nicht mitkaputt
 * machen, und der Unterschied fällt auf. Zwei Fehler standen hier, bevor sie
 * stimmte, und beide fielen als roter Test auf:
 *
 *   - In der zweiten Mischstufe steht `value | 61`, **nicht** `61`. `value` ist
 *     zu diesem Zeitpunkt bereits das Ergebnis der ersten Stufe.
 *   - Die Addition in derselben Stufe läuft in JS mit **signed** Werten, weil
 *     `Math.imul` signed liefert. Wer sie vorzeichenlos rechnet, bekommt einen
 *     anderen Vektor.
 *
 * Beides sind Fehler, die ein Test nicht findet, indem er denselben Code zweimal
 * aufruft. Sie findet man nur, indem man ihn nachrechnet.
 */

/** Zählt die Inkrementkonstante von `mulberry32` nach. */
const INKREMENT = 0x6d2b79f5n

/** `Math.imul(a, b)` — vorzeichenbehaftet, wie in JavaScript. */
const imul = (a: bigint, b: bigint) =>
  BigInt.asIntN(32, BigInt.asUintN(32, a * b))

/** Produkt modulo 2³², vorzeichenlos. */
const mul = (a: bigint, b: bigint) => BigInt.asUintN(32, a * b)

/** Rechtsverschiebung um `n` Bit, auf 32 Bit gekürzt. */
const shr = (x: bigint, n: bigint) => BigInt.asUintN(32, x >> n)

/**
 * Die ersten `ziehungen` Werte des Zählers für `seed`.
 *
 * Der Aufrufer vergleicht das gegen `nextUint32` und erfährt damit nicht nur,
 * dass die Folge gleich ist, sondern dass sie **die richtige** ist.
 */
export function referenzStrom(seed: number, ziehungen: number): number[] {
  let zustand = BigInt(seed >>> 0)
  const folge: number[] = []
  for (let n = 0; n < ziehungen; n += 1) {
    zustand = BigInt.asUintN(32, zustand + INKREMENT)
    let v = zustand
    v = mul(v ^ shr(v, 15n), v | 1n)
    v = BigInt.asUintN(
      32,
      v ^ BigInt.asUintN(32, v + imul(v ^ shr(v, 7n), v | 61n)),
    )
    folge.push(Number(BigInt.asUintN(32, v ^ shr(v, 14n))))
  }
  return folge
}
