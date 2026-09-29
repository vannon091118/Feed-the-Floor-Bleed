/**
 * Ein beschreibbarer RGBA-Puffer im Bausteinsatz des Pixelgrafik-Generators.
 *
 * Im Build steht kein DOM zur Verfügung, deshalb kann der Generator nicht
 * zeichnen, sondern nur rechnen und schreiben. Dieser Puffer ersetzt den
 * Canvas-2D-Kontext: `fillRect`, `line` und `px` sind bewusst die einzigen
 * Werkzeuge, die das Asset-Briefing braucht — Bodenkacheln, Wände und
 * Sprites entstehen aus Flächen und Punkten, nicht aus Vektorpfaden.
 */
export class PixelBuffer {
  /**
   * @param {number} width Breite in Pixeln
   * @param {number} height Höhe in Pixeln
   */
  constructor(width, height) {
    this.width = width
    this.height = height
    this.data = new Uint8Array(width * height * 4)
  }

  /**
   * Setzt ein Pixel mit Alphawert; Alpha 0 lässt das Pixel unverändert.
   *
   * @param {number} x Spalte
   * @param {number} y Zeile
   * @param {number} color Farbe als 0xRRGGBB
   * @param {number} [alpha] Deckkraft 0..255
   */
  px(x, y, color, alpha = 255) {
    if (x < 0 || y < 0 || x >= this.width || y >= this.height) return
    if (alpha <= 0) return
    const offset = (y * this.width + x) * 4
    if (alpha >= 255) {
      this.data[offset] = (color >>> 16) & 0xff
      this.data[offset + 1] = (color >>> 8) & 0xff
      this.data[offset + 2] = color & 0xff
      this.data[offset + 3] = 255
      return
    }
    // Halbtransparenz als Mischung mit dem, was schon liegt: So bleiben die
    // Glanzpunkte der Referenzbilder weich, ohne die Kachel durchsichtig zu
    // machen — eine Bodenkachel mit Löchern wäre ein Fehler, kein Stil.
    const mix = alpha / 255
    const inverse = 1 - mix
    for (let channel = 0; channel < 3; channel += 1) {
      const own = (color >>> (16 - channel * 8)) & 0xff
      const current = this.data[offset + channel]
      this.data[offset + channel] = Math.round(own * mix + current * inverse)
    }
    this.data[offset + 3] = 255
  }

  /**
   * Füllt ein Rechteck; die Kanten liegen auf ganzen Pixeln.
   *
   * @param {number} x linke Spalte
   * @param {number} y obere Zeile
   * @param {number} width Breite in Pixeln
   * @param {number} height Höhe in Pixeln
   * @param {number} color Farbe als 0xRRGGBB
   * @param {number} [alpha] Deckkraft 0..255
   */
  fill(x, y, width, height, color, alpha = 255) {
    for (let row = y; row < y + height; row += 1) {
      for (let column = x; column < x + width; column += 1) {
        this.px(column, row, color, alpha)
      }
    }
  }

  /**
   * Zeichnet eine waagerechte Linie über eine Spanne.
   *
   * Wände und Fugen entstehen aus waagerechten und senkrechten Bändern; eine
   * Bresenham-Linie wäre hier Generalistik ohne Abnehmer.
   *
   * @param {number} x Startspalte
   * @param {number} y Zeile
   * @param {number} length Spanne in Pixeln
   * @param {number} color Farbe als 0xRRGGBB
   * @param {number} [alpha] Deckkraft 0..255
   */
  hLine(x, y, length, color, alpha = 255) {
    this.fill(x, y, length, 1, color, alpha)
  }

  /**
   * Zeichnet eine senkrechte Linie über eine Spanne.
   *
   * @param {number} x Spalte
   * @param {number} y Startzeile
   * @param {number} length Spanne in Pixeln
   * @param {number} color Farbe als 0xRRGGBB
   * @param {number} [alpha] Deckkraft 0..255
   */
  vLine(x, y, length, color, alpha = 255) {
    this.fill(x, y, 1, length, color, alpha)
  }

  /**
   * Setzt ein Rechteck als Rahmen; `thickness` Pixel nach innen.
   *
   * @param {number} x linke Spalte
   * @param {number} y obere Zeile
   * @param {number} width Breite in Pixeln
   * @param {number} height Höhe in Pixeln
   * @param {number} color Farbe als 0xRRGGBB
   * @param {number} [thickness] Rahmenstärke in Pixeln
   * @param {number} [alpha] Deckkraft 0..255
   */
  frame(x, y, width, height, color, thickness = 1, alpha = 255) {
    this.fill(x, y, width, thickness, color, alpha)
    this.fill(x, y + height - thickness, width, thickness, color, alpha)
    this.fill(x, y, thickness, height, color, alpha)
    this.fill(x + width - thickness, y, thickness, height, color, alpha)
  }
}
