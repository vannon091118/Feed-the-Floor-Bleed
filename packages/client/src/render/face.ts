/**
 * Gemeinsame Bauteile der Actor-Texturen.
 *
 * Held, Monster, Boss und die zwanzig Basisarten zeichnen denselben Kopf mit
 * denselben Augen. Das steht hier, weil es in `actor-atlas.ts` und
 * `base-monster-atlas.ts` sonst zweimal im Bild stünde — und der
 * Redundancy-Gate zweimal identische Blöcke zu Recht meldet.
 */

/** Zeichnet Kopf und Augenpaar an der Position der Einheit. */
export function drawFace(
  ctx: CanvasRenderingContext2D,
  options: {
    x: number
    y: number
    radiusX: number
    radiusY: number
    headColor: string
  },
): void {
  const { x, y, radiusX, radiusY, headColor } = options
  ctx.fillStyle = headColor
  ctx.beginPath()
  ctx.ellipse(x, y, radiusX, radiusY, 0, 0, Math.PI * 2)
  ctx.fill()
  ctx.fillStyle = '#fff'
  ctx.beginPath()
  ctx.ellipse(
    x - radiusX * 0.43,
    y,
    radiusX * 0.33,
    radiusY * 0.55,
    0,
    0,
    Math.PI * 2,
  )
  ctx.ellipse(
    x + radiusX * 0.43,
    y,
    radiusX * 0.33,
    radiusY * 0.55,
    0,
    0,
    Math.PI * 2,
  )
  ctx.fill()
  ctx.fillStyle = '#241b21'
  ctx.beginPath()
  ctx.arc(x - radiusX * 0.36, y, radiusX * 0.15, 0, Math.PI * 2)
  ctx.arc(x + radiusX * 0.49, y, radiusX * 0.15, 0, Math.PI * 2)
  ctx.fill()
}

/** Zeichnet den Bodenschatten unter einer Einheit. */
export function drawShadow(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  radiusX: number,
  radiusY: number,
): void {
  ctx.fillStyle = '#251d27'
  ctx.beginPath()
  ctx.ellipse(x, y, radiusX, radiusY, 0, 0, Math.PI * 2)
  ctx.fill()
}
