import { Sprite } from 'pixi.js'
import { type ActorDescriptor, WORLD_CELL_PX } from '../world'
import { unitTexture } from './actor-atlas'
import { bob, squash, stepLift } from './animation'
import { glowTexture } from './atmosphere-atlas'
import { depthValue } from './depth'
import type { VisualRuntime } from './runtime'

interface ActorEntry {
  actor: ActorDescriptor
  body: Sprite
  shadow: Sprite
  baseScale: number
}

export interface ActorsView {
  apply(actors: ActorDescriptor[]): void
  update(elapsedMs: number): void
  dispose(): void
}

function hpTint(ratio: number): number {
  const danger = Math.max(0, Math.min(1, 1 - ratio))
  const green = Math.round(255 - danger * 150)
  return (0xff << 16) | (green << 8) | green
}

function actorSize(actor: ActorDescriptor): number {
  return actor.kind === 'boss' ? WORLD_CELL_PX * 3.4 : WORLD_CELL_PX * 2.6
}

function face(actor: ActorDescriptor): number {
  return actor.facing
}

/**
 * Actor-Darstellung mit Fuß-Sortierung.
 *
 * Jeder Actor trägt einen Schatten in der Welt-Ebene. Beide Sprites werden nur
 * beim Deskriptor-Wechsel neu gesetzt; die Animation läuft ausschließlich im
 * Ticker und fasst das Grid nie an.
 */
export function createActorsView(runtime: VisualRuntime): ActorsView {
  const entries = new Map<string, ActorEntry>()

  const place = (entry: ActorEntry): void => {
    const { actor, body, shadow } = entry
    const size = actorSize(actor)
    entry.baseScale = size / body.texture.width
    body.scale.set(entry.baseScale)
    body.x = actor.world.x
    body.y = actor.world.y
    body.tint = hpTint(actor.hpRatio)
    body.scale.x = entry.baseScale * face(actor)
    body.alpha = actor.hpRatio <= 0 ? 0.35 : 1
    body.zIndex = depthValue(actor.world.y, actor.height, actor.variant % 10)
    shadow.x = actor.world.x
    shadow.y = actor.world.y
    shadow.width = size * 0.95
    shadow.height = size * 0.4
    shadow.alpha = actor.hpRatio > 0 ? 0.32 : 0.14
    shadow.zIndex = depthValue(actor.world.y, 0, 0)
  }

  const create = (actor: ActorDescriptor): ActorEntry => {
    const shadow = new Sprite(glowTexture())
    shadow.anchor.set(0.5)
    shadow.tint = 0x000000
    const body = new Sprite(unitTexture(actor.kind))
    body.anchor.set(0.5, 1)
    runtime.layers.world.addChild(shadow, body)
    const entry: ActorEntry = { actor, body, shadow, baseScale: 1 }
    place(entry)
    return entry
  }

  const discard = (entry: ActorEntry): void => {
    entry.body.parent?.removeChild(entry.body)
    entry.shadow.parent?.removeChild(entry.shadow)
    entry.body.destroy()
    entry.shadow.destroy()
  }

  return {
    apply(actors) {
      const seen = new Set<string>()
      for (const actor of actors) {
        seen.add(actor.id)
        const entry = entries.get(actor.id)
        if (entry) {
          entry.actor = actor
          place(entry)
        } else {
          entries.set(actor.id, create(actor))
        }
      }
      for (const [id, entry] of entries) {
        if (seen.has(id)) continue
        discard(entry)
        entries.delete(id)
      }
    },
    update(elapsedMs) {
      for (const entry of entries.values()) {
        const { actor, body, shadow } = entry
        const lift = actor.moving
          ? stepLift(elapsedMs, actor.variant)
          : bob(elapsedMs, actor.variant)
        body.y = actor.world.y - lift
        const shape = actor.moving
          ? squash(elapsedMs, actor.variant)
          : { x: 1, y: 1 }
        body.scale.set(
          entry.baseScale * shape.x * face(actor),
          entry.baseScale * shape.y,
        )
        shadow.alpha = (actor.hpRatio > 0 ? 0.32 : 0.14) - lift * 0.02
      }
    },
    dispose() {
      for (const entry of entries.values()) discard(entry)
      entries.clear()
    },
  }
}
