import type { Resources } from '../fixture-data'

export type ResourceId = keyof Resources

export const RESOURCE_IDS = [
  'gold',
  'materials',
] as const satisfies readonly ResourceId[]

export interface ResourceDefinition {
  id: ResourceId
  label: string
  icon: 'gold' | 'materials'
}

/** Darstellungskatalog, keine neue Ressourcenquelle oder Spielregel. */
export const RESOURCE_CATALOG: Record<ResourceId, ResourceDefinition> = {
  gold: { id: 'gold', label: 'Gold', icon: 'gold' },
  materials: { id: 'materials', label: 'Material', icon: 'materials' },
}
