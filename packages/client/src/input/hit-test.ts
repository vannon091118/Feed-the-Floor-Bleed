import type { Point } from '@floor/sim-core'
import {
  type CameraState,
  type ScreenPoint,
  screenToWorld,
} from '../render/camera'
import { type ActorDescriptor, type WorldPoint, worldToCell } from '../world'

/** Screen-Punkt → Logikzelle. Nutzt exakt die Kamera-Transformation. */
export function cellAtScreen(camera: CameraState, screen: ScreenPoint): Point {
  return worldToCell(screenToWorld(camera, screen))
}

/** Screen-Punkt → Weltkoordinate. */
export function worldAtScreen(
  camera: CameraState,
  screen: ScreenPoint,
): WorldPoint {
  return screenToWorld(camera, screen)
}

/** Nächster Actor innerhalb eines Weltradius, sonst `null`. */
export function actorAtWorld(
  actors: readonly ActorDescriptor[],
  world: WorldPoint,
  radius: number,
): string | null {
  let hit: string | null = null
  let best = radius
  for (const actor of actors) {
    const dx = actor.world.x - world.x
    const dy = actor.world.y - world.y
    const distance = Math.sqrt(dx * dx + dy * dy)
    if (distance <= best) {
      best = distance
      hit = actor.id
    }
  }
  return hit
}
