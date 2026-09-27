export type RenderMode = 'village' | 'editor' | 'raid'
export type DungeonRenderMode = Exclude<RenderMode, 'village'>

export interface RenderVisibility {
  village: boolean
  dungeon: boolean
  editor: boolean
  lighting: boolean
}

/** Reine Sichtbarkeitstabelle für die drei Präsentationsmodi. */
export function renderVisibility(mode: RenderMode): RenderVisibility {
  return {
    village: mode === 'village',
    dungeon: mode !== 'village',
    editor: mode === 'editor',
    lighting: mode === 'raid',
  }
}

export function isDungeonRenderMode(
  mode: RenderMode,
): mode is DungeonRenderMode {
  return mode !== 'village'
}
