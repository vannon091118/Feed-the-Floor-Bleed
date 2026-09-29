import { type DungeonGrid, findPath } from '@floor/sim-core'
import { computed, signal } from '@preact/signals'
import { type Brush, paintTile, startDungeon } from './model'

export type { Brush } from './model'

export const brush = signal<Brush>('wall')
export const grid = signal<DungeonGrid>(startDungeon())
export const route = computed(() => findPath(grid.value))

export function selectBrush(next: Brush): void {
  brush.value = next
}

export function resetGrid(): void {
  grid.value = startDungeon()
}

export function paintVisibleTile(tileX: number, tileY: number): void {
  grid.value = paintTile(grid.value, brush.value, tileX, tileY)
}
