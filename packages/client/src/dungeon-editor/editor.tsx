import {
  CellType,
  type Point,
  VISIBLE_TILE_SIZE,
  getCell,
} from '@floor/sim-core'
import { useSignal } from '@preact/signals'
import type { Resources } from '../fixture-data'
import { type Brush, visibleRouteTiles } from './model'
import {
  brush,
  grid,
  paintVisibleTile,
  resetGrid,
  route,
  selectBrush,
} from './state'

const BRUSHES: Array<{ value: Brush; label: string; key: string }> = [
  { value: 'empty', label: 'Wegräumen', key: '1' },
  { value: 'wall', label: 'Mauer', key: '2' },
  { value: 'trap', label: 'Falle', key: '3' },
]

function tileKey(x: number, y: number): number {
  return y * VISIBLE_TILE_SIZE + x
}

function tileClass(
  x: number,
  y: number,
  routeTiles: ReadonlySet<number>,
): string {
  const cell = getCell(grid.value, { x: x * 4, y: y * 4 })
  const type =
    cell === CellType.Wall ? 'wall' : cell === CellType.Trap ? 'trap' : 'empty'
  const marker =
    cell === CellType.Spawn ? 'start' : cell === CellType.Boss ? 'boss' : type
  return `tile tile--${marker}${routeTiles.has(tileKey(x, y)) ? ' tile--route' : ''}`
}

function tileLabel(x: number, y: number): string {
  const point: Point = { x: x * 4, y: y * 4 }
  const cell = getCell(grid.value, point)
  if (cell === CellType.Spawn) return `Startfeld ${x + 1}, ${y + 1}`
  if (cell === CellType.Boss) return `Bossfeld ${x + 1}, ${y + 1}`
  return `Editorfeld ${x + 1}, ${y + 1}`
}

export interface EditorPanelProps {
  resources: Resources
}

export function EditorPanel({ resources }: EditorPanelProps) {
  const painting = useSignal(false)
  const path = route.value
  const routeTiles = visibleRouteTiles(path)
  const isValid = path.mode !== 'unreachable'

  const paint = (x: number, y: number) => {
    if (!painting.value) return
    paintVisibleTile(x, y)
  }

  return (
    <section className="panel editor-panel">
      <div className="panel-heading">
        <div>
          <p className="eyebrow">Nacht · Dungeon Master</p>
          <h2>Der Floor bekommt eine Meinung</h2>
        </div>
        <button type="button" className="quiet-button" onClick={resetGrid}>
          Layout zurücksetzen
        </button>
      </div>
      <div className="editor-toolbar">
        <div className="brushes" aria-label="Editor-Pinsel">
          {BRUSHES.map((item) => (
            <button
              key={item.value}
              type="button"
              className={`brush-button brush-button--${item.value}${brush.value === item.value ? ' is-active' : ''}`}
              onClick={() => selectBrush(item.value)}
              title={`${item.label} (${item.key})`}
            >
              <span className="brush-swatch" /> {item.label}
            </button>
          ))}
        </div>
        <div
          className={`route-status ${isValid ? 'route-status--valid' : 'route-status--blocked'}`}
        >
          <span>{isValid ? 'Route bereit' : 'Route blockiert'}</span>
          <strong>{isValid ? `${path.movementCost} MP` : 'kein Zugang'}</strong>
        </div>
      </div>
      <div
        className="editor-grid"
        onPointerUp={() => {
          painting.value = false
        }}
        onPointerLeave={() => {
          painting.value = false
        }}
      >
        {Array.from(
          { length: VISIBLE_TILE_SIZE * VISIBLE_TILE_SIZE },
          (_, index) => {
            const x = index % VISIBLE_TILE_SIZE
            const y = Math.floor(index / VISIBLE_TILE_SIZE)
            return (
              <button
                key={`${x}-${y}`}
                type="button"
                aria-label={tileLabel(x, y)}
                className={tileClass(x, y, routeTiles)}
                onPointerDown={(event) => {
                  event.preventDefault()
                  painting.value = true
                  paintVisibleTile(x, y)
                }}
                onPointerEnter={() => paint(x, y)}
              >
                {x === 0 && y === 0 ? 'S' : x === 15 && y === 15 ? 'B' : null}
              </button>
            )
          },
        )}
      </div>
      <div className="editor-footnote">
        <span>
          <i className="legend-dot legend-dot--spawn" />
          Start
        </span>
        <span>
          <i className="legend-dot legend-dot--route" />
          A*-Route
        </span>
        <span>
          <i className="legend-dot legend-dot--trap" />
          Falle
        </span>
        <span className="editor-resources">
          {resources.gold} Gold · {resources.materials} Material
        </span>
      </div>
    </section>
  )
}
