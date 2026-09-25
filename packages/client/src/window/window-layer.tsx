import type { ComponentChildren } from 'preact'
import { focusedId, windows } from './store'
import { GameWindow } from './window'

export interface WindowLayerProps {
  renderContent: (id: string) => ComponentChildren
}

/** Die Fensterschicht über der Pixi-Welt. Die Welt selbst bleibt darunter. */
export function WindowLayer({ renderContent }: WindowLayerProps) {
  return (
    <div class="window-layer">
      {windows.value.map((win) => (
        <GameWindow key={win.id} win={win} focused={focusedId.value === win.id}>
          {renderContent(win.id)}
        </GameWindow>
      ))}
    </div>
  )
}
