import { TilingSprite } from 'pixi.js'
import { WORLD_SIZE_PX } from '../world'
import { editorGridTexture } from './editor-grid-atlas'
import { ownLayerSprite } from './layer-sprite'
import type { VisualRuntime } from './runtime'

export interface EditorGridView {
  setVisible(visible: boolean): void
  dispose(): void
}

/**
 * Das Grid als Kachelfläche statt als 2048×2048-Bild.
 *
 * Die Linien liegen am Rand eines einzigen Feldes; `editor-grid-atlas.ts`
 * zeichnet dieses Feld. Ein Draw Call trägt damit das ganze Raster, und die
 * Canvas-Allokation eines Bildes in Weltgröße entfällt — sie wäre allein
 * 16 Megabyte Pixel Puffer groß.
 *
 * Sichtbarkeit und Abbau lässt `ownLayerSprite` stehen — derselbe Besitzer wie
 * bei jedem anderen Blatt. Nur das Anlegen des `TilingSprite` ist hier eigenes,
 * weil `addLayerSprite` einen einfachen `Sprite` beschreibt.
 */
export function createEditorGridView(runtime: VisualRuntime): EditorGridView {
  const grid = ownLayerSprite(
    runtime.layers.editor,
    new TilingSprite({
      texture: editorGridTexture(),
      width: WORLD_SIZE_PX,
      height: WORLD_SIZE_PX,
    }),
  )
  grid.sprite.alpha = 0.6
  grid.setVisible(false)
  return { setVisible: grid.setVisible, dispose: grid.dispose }
}
