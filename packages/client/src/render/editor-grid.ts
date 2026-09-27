import { WORLD_SIZE_PX } from '../world'
import { editorGridTexture } from './editor-grid-atlas'
import { addLayerSprite } from './layer-sprite'
import type { VisualRuntime } from './runtime'

export interface EditorGridView {
  setVisible(visible: boolean): void
  dispose(): void
}

export function createEditorGridView(runtime: VisualRuntime): EditorGridView {
  const grid = addLayerSprite(runtime.layers.editor, editorGridTexture())
  grid.sprite.width = WORLD_SIZE_PX
  grid.sprite.height = WORLD_SIZE_PX
  grid.sprite.alpha = 0.6
  grid.sprite.visible = false
  return { setVisible: grid.setVisible, dispose: grid.dispose }
}
