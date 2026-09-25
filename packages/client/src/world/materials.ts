import { hashFinish, hashStart, hashWord } from '@floor/sim-core'

/**
 * Datengetriebene Materialdefinition.
 *
 * Eine Handvoll Assets plus diese Definition erzeugt variantenreichen Boden,
 * Stein und Holz, ohne pro Variation ein eigenes Asset-System. `roughness` ist
 * ausdrücklich eine optische Kennzahl für Filter/Shader und keine Spielregel.
 */
export interface MaterialDef {
  id: string
  base: number
  edge: number
  detail: number
  roughness: number
  variants: number
  seedSalt: number
}

export const MATERIAL_SOIL: MaterialDef = {
  id: 'soil',
  base: 0x4a3b2a,
  edge: 0x2f2519,
  detail: 0x5c4a34,
  roughness: 0.9,
  variants: 6,
  seedSalt: 0x51,
}

export const MATERIAL_STONE: MaterialDef = {
  id: 'stone',
  base: 0x6b6f76,
  edge: 0x3d4046,
  detail: 0x878c94,
  roughness: 0.7,
  variants: 8,
  seedSalt: 0x53,
}

export const MATERIAL_MOSS: MaterialDef = {
  id: 'moss',
  base: 0x3f5a34,
  edge: 0x24351e,
  detail: 0x5a7a46,
  roughness: 0.85,
  variants: 5,
  seedSalt: 0x4d,
}

export const MATERIAL_WOOD: MaterialDef = {
  id: 'wood',
  base: 0x6a4a2c,
  edge: 0x3f2b17,
  detail: 0x8a6338,
  roughness: 0.6,
  variants: 4,
  seedSalt: 0x57,
}

export const MATERIAL_ARCANE: MaterialDef = {
  id: 'arcane',
  base: 0x3a2b5c,
  edge: 0x20153a,
  detail: 0x7358c9,
  roughness: 0.25,
  variants: 5,
  seedSalt: 0x41,
}

export const MATERIALS: Record<string, MaterialDef> = {
  [MATERIAL_SOIL.id]: MATERIAL_SOIL,
  [MATERIAL_STONE.id]: MATERIAL_STONE,
  [MATERIAL_MOSS.id]: MATERIAL_MOSS,
  [MATERIAL_WOOD.id]: MATERIAL_WOOD,
  [MATERIAL_ARCANE.id]: MATERIAL_ARCANE,
}

export function materialById(id: string): MaterialDef {
  const material = MATERIALS[id]
  if (!material) throw new Error(`unbekanntes Material: ${id}`)
  return material
}

/**
 * Deterministische Variante aus Material und Orts-Seed.
 *
 * Bewusst FNV-1a statt `Math.random`: Dieselbe Zelle bekommt in jedem
 * Browserlauf dieselbe Variante, also bleibt ein Screenshot reproduzierbar.
 */
export function pickVariant(material: MaterialDef, seed: number): number {
  const hash = hashWord(hashWord(hashStart(), material.seedSalt), seed)
  return hashFinish(hash) % material.variants
}
