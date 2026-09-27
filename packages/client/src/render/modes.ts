export type RenderMode = 'village' | 'editor' | 'raid'
export type DungeonRenderMode = Exclude<RenderMode, 'village'>
