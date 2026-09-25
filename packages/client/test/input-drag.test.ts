import { describe, expect, it } from 'vitest'
import { type DragDropCommand, createDragController } from '../src/input/drag'
import type { PointerSample } from '../src/input/pointer'
import {
  type ScreenPoint,
  createCamera,
  worldToScreen,
} from '../src/render/camera'
import { type ActorDescriptor, cellFoot } from '../src/world'

const camera = createCamera(800, 600)
const actor: ActorDescriptor = {
  id: 'hero-a',
  kind: 'hero',
  cell: { x: 4, y: 4 },
  world: cellFoot({ x: 4, y: 4 }),
  height: 14,
  hpRatio: 1,
  facing: 1,
  moving: false,
  variant: 0,
}
const start = worldToScreen(camera, actor.world)

function sample(screen: ScreenPoint): PointerSample {
  return { screen, pointerId: 1, buttons: 1, shiftKey: false }
}

function controller() {
  const drops: DragDropCommand[] = []
  const drag = createDragController({
    actors: () => [actor],
    camera: () => camera,
    onDrop: (command) => drops.push(command),
  })
  return { drag, drops }
}

describe('Drag-Schicht', () => {
  it('macht aus einem Down ohne Bewegung keinen Drop', () => {
    const { drag, drops } = controller()
    drag.onDown(sample(start))
    expect(drag.hasCandidate()).toBe(true)
    expect(drag.active()).toBeNull()
    drag.onUp(sample({ x: start.x + 1, y: start.y + 1 }))
    expect(drops).toHaveLength(0)
    expect(drag.hasCandidate()).toBe(false)
  })

  it('aktiviert den Drag erst nach dem Slop und sendet dann einen Command', () => {
    const { drag, drops } = controller()
    drag.onDown(sample(start))
    drag.onMove(sample({ x: start.x + 2, y: start.y }))
    expect(drag.active()).toBeNull()
    const moved = { x: start.x + 40, y: start.y + 40 }
    drag.onMove(sample(moved))
    expect(drag.active()?.id).toBe('hero-a')
    drag.onUp(sample(moved))
    expect(drops).toHaveLength(1)
    expect(drops[0]?.source).toBe('actor')
    expect(drops[0]?.id).toBe('hero-a')
    expect(drops[0]?.screen).toEqual(moved)
  })

  it('findet außerhalb des Greifradius keinen Kandidaten', () => {
    const { drag } = controller()
    drag.onDown(sample({ x: start.x + 200, y: start.y }))
    expect(drag.hasCandidate()).toBe(false)
    drag.onMove(sample({ x: start.x + 260, y: start.y }))
    expect(drag.active()).toBeNull()
  })
})
