const HASH_OFFSET = 0x811c9dc5
const HASH_PRIME = 0x01000193

export function hashStart(): number {
  return HASH_OFFSET
}

/**
 * **Der Zustand bleibt 32 Bit, der Beitrag nicht.**
 *
 * Früher stand hier `let remaining = word >>> 0` und danach vier feste Bytes.
 * Das war kein Detail, das war eine Löfflichkeit: eine Zahl und dieselbe Zahl
 * plus 2³² lieferten denselben Beitrag, also denselben Hash. Wer einen
 * gespeicherten Log hatte, konnte jedes Feld um 2³² heben, und die Prüfung
 * blieb grün — ohne Sprung, ohne Version, ohne Spuren. `hash-kappung.test.ts`
 * pinnt den Fehler.
 *
 * Jetzt wandert die Byte-Zahl mit der Größe der Zahl, bis alle 53 sicheren
 * Bits im Spiel sind. Das Vorzeichen kommt als eigenes Byte voran, damit `-1`
 * nicht als „0 mit implicitem Minus" in dieselbe Bahn läuft wie `0`.
 *
 * Was das **nicht** macht: 32 Bit Zustand bleiben 32 Bit. Ein Geburtstagsangriff
 * auf den Fingerprint bleibt möglich und ist keine Eigenschaft dieser Änderung,
 * sondern der Festlegung des Wire-Formats auf acht Hex-Stellen. Beseitigt ist
 * die rechnerische Vorschrift, die Formerlaubung trug.
 */
export function hashWord(hash: number, word: number): number {
  let current = Math.imul(hash >>> 0, HASH_PRIME) >>> 0
  current = Math.imul(current ^ (word < 0 ? 1 : 0), HASH_PRIME) >>> 0
  let remaining = Math.abs(Math.trunc(word))
  do {
    current = Math.imul(current ^ (remaining % 256), HASH_PRIME) >>> 0
    remaining = Math.floor(remaining / 256)
  } while (remaining > 0)
  return current
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
