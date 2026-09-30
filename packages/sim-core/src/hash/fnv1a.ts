const HASH_OFFSET = 0x811c9dc5
const HASH_PRIME = 0x01000193

export function hashStart(): number {
  return HASH_OFFSET
}

/**
 * **Zwei Fehler hat diese Funktion schon getragen, und beide waren still.**
 *
 * Der erste war `let remaining = word >>> 0` und danach vier feste Bytes: eine
 * Zahl und dieselbe Zahl plus 2³² lieferten denselben Beitrag, also denselben
 * Hash. Da `specHash` und `eventHash` genau das mit `maxHp`, `attack` und `amount`
 * tun, konnten zwei verschiedene Kämpfe denselben Fingerprint tragen. `hash-kappung.test.ts`
 * verbietet das heute.
 *
 * Der zweite kam mit der Reparatur dazu und war schlimmer, weil er nicht still
 * blieb: eine `do`-Schleife mit `while (remaining > 0)` terminiert bei `Infinity`
 * nie, denn `Math.floor(Infinity / 256)` bleibt `Infinity`. Genau eine Zahl (`0`)
 * braucht die `do`-Form, damit sie nicht leer bliebe; diese eine wird jetzt vorher
 * entschieden, und die Schleife läuft `for`.
 *
 * **Was als Zahl gilt, ist jetzt eine Entscheidung und keine Nebenwirkung.**
 * `Math.trunc` schnitt still nach unten: `1.9`, `1.1` und `1` lieferten denselben
 * Beitrag, und `NaN`, `undefined` und `null` wie eine echte `0`. Eine Zahl, die
 * keine ist, wirft jetzt, statt sich als etwas anderes auszugeben.
 *
 * Der Beitrag wandert über alle Bytes der Zahl, das Vorzeichen kommt als eigenes
 * Byte voran. Was das **nicht** macht: Der Zustand bleibt 32 Bit. Ein
 * Geburtstagsangriff auf den Fingerprint bleibt möglich und ist keine Eigenschaft
 * dieser Änderung, sondern der Festlegung des Wire-Formats auf acht Hex-Stellen.
 * Beseitigt ist die rechnerische Vorschrift, die Formerlaubung trug.
 *
 * **Die Null ist kein Sonderfall, sie ist ein Byte.** Eine frühere Fassung gab sie
 * mit `if (word === 0) return current` aus und übersprang damit die Mischung —
 * die `do`-Schleife hatte sie noch getan, und genau daran hing ihr Beitrag. Das
 * verschob jeden Fingerprint eines Laufs, in dem eine Zahl `0` ist: `death` und
 * `move` schreiben `amount: 0`, der Client hasht das für den FX-Seed, und der
 * Spieler hätte eine andere Partikelstreuung und einen anderen Wert im Raid-Panel
 * gesehen, ohne dass sich der Kampf entschieden hätte. Jetzt läuft die Null durch
 * dieselbe Schleife wie jede andere Zahl.
 */
export function hashWord(hash: number, word: number): number {
  if (!Number.isFinite(word))
    throw new RangeError(`hashWord erwartet eine endliche Zahl, bekam ${word}`)
  if (!Number.isInteger(word))
    throw new RangeError(`hashWord erwartet eine ganze Zahl, bekam ${word}`)
  let current = Math.imul(hash >>> 0, HASH_PRIME) >>> 0
  current = Math.imul(current ^ (word < 0 ? 1 : 0), HASH_PRIME) >>> 0
  let remaining = Math.abs(word)
  for (;;) {
    current = Math.imul(current ^ (remaining % 256), HASH_PRIME) >>> 0
    remaining = Math.floor(remaining / 256)
    if (remaining === 0) return current
  }
}

export function hashWords(hash: number, words: readonly number[]): number {
  let current = hash
  for (const word of words) current = hashWord(current, word)
  return current
}

export function hashText(hash: number, text: string): number {
  let current = hash
  for (let index = 0; index < text.length; index += 1) {
    current = hashWord(current, text.charCodeAt(index))
  }
  return current
}

export function hashFinish(hash: number): number {
  return hash >>> 0
}

export function hashToHex(hash: number): string {
  return (hash >>> 0).toString(16).padStart(8, '0')
}
