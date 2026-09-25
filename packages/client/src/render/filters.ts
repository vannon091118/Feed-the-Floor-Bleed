import { ColorMatrixFilter } from 'pixi.js'
import type { MaterialDef } from '../world'

const cache = new Map<string, ColorMatrixFilter>()

/**
 * Filter aus Materialparametern.
 *
 * `roughness` ist rein optisch: rauhe Materialien werden leicht entsättigt und
 * abgedunkelt, glatte leicht angehoben. Ein Filter pro Material wird geteilt,
 * damit nicht jedes Sprite einen eigenen Filter tragen muss.
 */
export function materialFilter(material: MaterialDef): ColorMatrixFilter {
  const cached = cache.get(material.id)
  if (cached) return cached
  const filter = new ColorMatrixFilter()
  filter.brightness(1 + (0.5 - material.roughness) * 0.12, false)
  filter.saturate(-(material.roughness - 0.5) * 0.18, false)
  cache.set(material.id, filter)
  return filter
}
