import {
  getCell,
  LOGIC_CELLS_PER_VISIBLE_TILE,
  VISIBLE_TILE_SIZE,
} from '@floor/sim-core'
import { tileMarker, visibleRouteTiles } from '../dungeon-editor/model'
import { grid, paintVisibleTile, route } from '../dungeon-editor/state'
import { materialById, tileFor } from '../world'

function hex(color: number): string {
  return `#${(color >>> 0).toString(16).padStart(6, '0')}`
}

/**
 * Editorraster in DOM.
 *
 * Bewusst kein Pixi: Fokus, Tastatur, ARIA und präzises Treffen auf 16×16
 * Feldern sind im DOM kontrollierbar. Die Farben kommen aus denselben
 * Materialdefinitionen, die auch die Pixi-Welt benutzt.
 */
export function EditorPanel() {
  const dungeon = grid.value
  const routeTiles = visibleRouteTiles(route.value)
  const tiles = []

  for (let tileY = 0; tileY < VISIBLE_TILE_SIZE; tileY += 1) {
    for (let tileX = 0; tileX < VISIBLE_TILE_SIZE; tileX += 1) {
      const index = tileY * VISIBLE_TILE_SIZE + tileX
      const cell = getCell(dungeon, {
        x: tileX * LOGIC_CELLS_PER_VISIBLE_TILE,
        y: tileY * LOGIC_CELLS_PER_VISIBLE_TILE,
      })
      const descriptor = tileFor(cell)
      const marker = tileMarker(dungeon, tileX, tileY)
      const classes = ['editor-tile']
      if (!descriptor.walkable) classes.push('is-wall')
      if (routeTiles.has(index)) classes.push('is-route')
      if (marker) classes.push(`is-${marker}`)
      tiles.push(
        <button
          key={index}
          type="button"
          class={classes.join(' ')}
          style={{ background: hex(materialById(descriptor.materialId).base) }}
          aria-label={`Feld ${tileX},${tileY}`}
          onPointerDown={() => paintVisibleTile(tileX, tileY)}
          onPointerEnter={(event) => {
            if (event.buttons > 0) paintVisibleTile(tileX, tileY)
          }}
        >
          {marker === 'start' ? 'S' : marker === 'boss' ? 'B' : ''}
        </button>,
      )
    }
  }

  return <div class="editor-grid">{tiles}</div>
}
