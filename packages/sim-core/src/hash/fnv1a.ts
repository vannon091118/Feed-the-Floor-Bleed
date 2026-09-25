export const HASH_OFFSET = 0x811c9dc5
const HASH_PRIME = 0x01000193

export function hashStart(): number {
  return HASH_OFFSET
}

export function hashWord(hash: number, word: number): number {
  let current = hash >>> 0
  let remaining = word >>> 0
  for (let shift = 0; shift < 32; shift += 8) {
    current = Math.imul(current ^ (remaining & 0xff), HASH_PRIME) >>> 0
    remaining >>>= 8
  }
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
