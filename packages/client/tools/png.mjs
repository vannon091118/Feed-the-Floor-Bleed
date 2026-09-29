import { deflateSync } from 'node:zlib'

/**
 * Minimaler PNG-Schreiber für RGBA-Bilder.
 *
 * Bewusst ohne Abhängigkeit: Node bringt `zlib` mit, und ein PNG ist nichts
 * weiter als eine Signatur, drei Chunks und eine Prüfsumme je Chunk. Das hält
 * die Ausgabe bytegleich — derselbe Aufruf liefert in jeder Umgebung dieselbe
 * Datei, was der Generator-Test in `test/asset-generator.test.ts` prüft.
 *
 * E5 des Visual-Grundsatzes verlangt, dass für Icons keine neue Bibliothek
 * hinzukommt; derselbe Gedanke gilt hier für den Werkzeugweg.
 */

/** CRC-Tabelle nach PNG-Spezifikation; einmal gebaut, dann nur gelesen. */
const CRC_TABLE = (() => {
  const table = new Uint32Array(256)
  for (let n = 0; n < 256; n += 1) {
    let c = n
    for (let k = 0; k < 8; k += 1) {
      c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1
    }
    table[n] = c >>> 0
  }
  return table
})()

/**
 * @param {Uint8Array} bytes
 * @returns {number} die Prüfsumme als vorzeichenlose 32-Bit-Zahl
 */
function crc32(bytes) {
  let crc = 0xffffffff
  for (let index = 0; index < bytes.length; index += 1) {
    crc = CRC_TABLE[(crc ^ bytes[index]) & 0xff] ^ (crc >>> 8)
  }
  return (crc ^ 0xffffffff) >>> 0
}

/**
 * Ein PNG-Chunk: Länge, Typ, Inhalt, Prüfsumme.
 *
 * @param {string} type vier ASCII-Zeichen
 * @param {Buffer} data der Inhalt
 * @returns {Buffer}
 */
function chunk(type, data) {
  const length = Buffer.alloc(4)
  length.writeUInt32BE(data.length, 0)
  const body = Buffer.concat([Buffer.from(type, 'ascii'), data])
  const crc = Buffer.alloc(4)
  crc.writeUInt32BE(crc32(body), 0)
  return Buffer.concat([length, body, crc])
}

/**
 * Kodiert RGBA-Pixel als PNG.
 *
 * @param {number} width Breite in Pixeln
 * @param {number} height Höhe in Pixeln
 * @param {Uint8Array} rgba `width * height * 4` Bytes, RGBA-Reihenfolge
 * @returns {Buffer} die fertige Datei
 */
export function encodePng(width, height, rgba) {
  if (rgba.length !== width * height * 4) {
    throw new Error(
      `Pixelpuffer passt nicht zu ${width}×${height}: ${rgba.length} statt ${width * height * 4}`,
    )
  }

  // Jede Scanline beginnt mit einem Filterbyte. Filter 0 (None) hält die
  // Ausgabe deterministisch und ist für Spritesheets ausreichend, weil
  // benachbarte Frames selten identische Zeilen haben.
  const stride = width * 4
  const raw = Buffer.alloc((stride + 1) * height)
  for (let y = 0; y < height; y += 1) {
    raw[y * (stride + 1)] = 0
    Buffer.from(rgba.buffer, rgba.byteOffset + y * stride, stride).copy(
      raw,
      y * (stride + 1) + 1,
    )
  }

  const header = Buffer.alloc(13)
  header.writeUInt32BE(width, 0)
  header.writeUInt32BE(height, 4)
  header[8] = 8 // Bittiefe
  header[9] = 6 // Farbtyp RGBA
  header[10] = 0 // Kompression: Deflate
  header[11] = 0 // Filter: adaptiv
  header[12] = 0 // Interlace: keine

  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', header),
    chunk('IDAT', deflateSync(raw, { level: 9 })),
    chunk('IEND', Buffer.alloc(0)),
  ])
}
