/**
 * Ebene eines Objekts in der Szene.
 *
 * `world` ist bewusst die einzige sortierbare Ebene: Wände, Schatten, Akteure
 * und FX liegen dort zusammen, damit ein Fußpunkt-Sort Actoren hinter Wänden
 * verschwinden lässt (Fake-3D-Occlusion). Getrennte Ebenen für Wand und Actor
 * würden die Tiefenordnung zerstören.
 */
export const LAYER_NAMES = ['void', 'terrain', 'world', 'overlay'] as const

export type LayerName = (typeof LAYER_NAMES)[number]

const LAYER_Z: Record<LayerName, number> = {
  void: 0,
  terrain: 10,
  world: 20,
  overlay: 30,
}

export function layerZ(name: LayerName): number {
  return LAYER_Z[name]
}
