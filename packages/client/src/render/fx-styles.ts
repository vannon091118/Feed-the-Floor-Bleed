import type { FxKind } from '../world'

interface FxStyle {
  lifeMs: number
  speed: number
  gravity: number
  tint: number
  size: number
  count: number
  rise: number
}

/** Aussehen und Bewegung je FX-Art. Reine Präsentationswerte. */
export const FX_STYLES: Record<FxKind, FxStyle> = {
  dust: {
    lifeMs: 420,
    speed: 12,
    gravity: 0,
    tint: 0xb9a888,
    size: 5,
    count: 3,
    rise: -6,
  },
  hit: {
    lifeMs: 320,
    speed: 40,
    gravity: 60,
    tint: 0xffd166,
    size: 4,
    count: 6,
    rise: -10,
  },
  spark: {
    lifeMs: 500,
    speed: 70,
    gravity: 120,
    tint: 0xfff2a8,
    size: 3,
    count: 5,
    rise: -14,
  },
  magic: {
    lifeMs: 700,
    speed: 24,
    gravity: -20,
    tint: 0xa78bfa,
    size: 6,
    count: 6,
    rise: -18,
  },
  smoke: {
    lifeMs: 900,
    speed: 10,
    gravity: -6,
    tint: 0x6b7280,
    size: 8,
    count: 4,
    rise: -12,
  },
  blood: {
    lifeMs: 600,
    speed: 30,
    gravity: 150,
    tint: 0xb91c1c,
    size: 4,
    count: 5,
    rise: -8,
  },
  ambient: {
    lifeMs: 1400,
    speed: 6,
    gravity: -4,
    tint: 0x7dd3fc,
    size: 5,
    count: 2,
    rise: -20,
  },
}
