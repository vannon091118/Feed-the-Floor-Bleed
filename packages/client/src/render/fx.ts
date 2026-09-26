import {
  createRng,
  hashFinish,
  hashStart,
  hashWord,
  nextBelow,
} from '@floor/sim-core'
import { Sprite } from 'pixi.js'
import type { FxDescriptor } from '../world'
import { fadeAlpha, growScale } from './animation'
import { glowTexture } from './atmosphere-atlas'
import { depthValue } from './depth'
import { FX_STYLES } from './fx-styles'
import type { VisualRuntime } from './runtime'

const POOL_SIZE = 192

interface Particle {
  sprite: Sprite
  active: boolean
  ageMs: number
  lifeMs: number
  vx: number
  vy: number
  gravity: number
  size: number
}

export interface FxView {
  emit(effects: FxDescriptor[]): void
  update(deltaMs: number): void
  dispose(): void
}

/**
 * Alle Partikel leben in einem festen Pool.
 *
 * `emit` aktiviert nur Slots, es entstehen keine neuen Objekte. Damit bleibt
 * eine FX-Spitze ohne GC-Druck und ohne Allokation pro Treffer.
 */
export function createFxView(runtime: VisualRuntime): FxView {
  let cursor = 0
  const particles: Particle[] = []
  for (let index = 0; index < POOL_SIZE; index += 1) {
    const sprite = new Sprite(glowTexture())
    sprite.anchor.set(0.5)
    sprite.visible = false
    runtime.layers.world.addChild(sprite)
    particles.push({
      sprite,
      active: false,
      ageMs: 0,
      lifeMs: 1,
      vx: 0,
      vy: 0,
      gravity: 0,
      size: 4,
    })
  }

  const acquire = (): Particle => {
    for (let attempt = 0; attempt < POOL_SIZE; attempt += 1) {
      const index = (cursor + attempt) % POOL_SIZE
      if (!particles[index].active) {
        cursor = (index + 1) % POOL_SIZE
        return particles[index]
      }
    }
    const fallback = particles[cursor]
    cursor = (cursor + 1) % POOL_SIZE
    return fallback
  }

  const spawn = (effect: FxDescriptor): void => {
    const style = FX_STYLES[effect.kind]
    const count = Math.min(style.count, 1 + Math.floor(effect.amount / 8))
    for (let index = 0; index < count; index += 1) {
      const particle = acquire()
      let seed = hashWord(hashStart(), effect.seed)
      seed = hashWord(seed, index)
      const rng = createRng(hashFinish(seed))
      const spread = (nextBelow(rng, 200) - 100) / 100
      particle.active = true
      particle.ageMs = 0
      particle.lifeMs = style.lifeMs
      particle.vx = spread * style.speed
      particle.vy = style.rise + spread * style.speed * 0.4
      particle.gravity = style.gravity
      particle.size = style.size * (0.7 + nextBelow(rng, 60) / 100)
      particle.sprite.visible = true
      particle.sprite.tint = style.tint
      particle.sprite.x = effect.world.x + spread * 4
      particle.sprite.y = effect.world.y + (nextBelow(rng, 200) - 100) / 50
      particle.sprite.alpha = 1
      particle.sprite.zIndex = depthValue(effect.world.y, 0, 5)
    }
  }

  return {
    emit(effects) {
      for (const effect of effects) spawn(effect)
    },
    update(deltaMs) {
      const seconds = deltaMs / 1000
      for (const particle of particles) {
        if (!particle.active) continue
        particle.ageMs += deltaMs
        if (particle.ageMs >= particle.lifeMs) {
          particle.active = false
          particle.sprite.visible = false
          continue
        }
        particle.vy += particle.gravity * seconds
        particle.sprite.x += particle.vx * seconds
        particle.sprite.y += particle.vy * seconds
        const grow = growScale(particle.ageMs, particle.lifeMs)
        particle.sprite.width = particle.size * 2 * grow
        particle.sprite.height = particle.size * 2 * grow
        particle.sprite.alpha = fadeAlpha(particle.ageMs, particle.lifeMs)
      }
    },
    dispose() {
      for (const particle of particles) particle.sprite.destroy()
      particles.length = 0
    },
  }
}
