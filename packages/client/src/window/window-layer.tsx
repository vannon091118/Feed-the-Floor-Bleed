import type { ComponentChildren, VNode } from 'preact'
import { focusedId, windows } from './store'
import { GameWindow } from './window'

export interface WindowLayerProps {
  renderContent: (id: string) => ComponentChildren
}

/**
 * Signatur des Fensterinhalts: die Kette der Knotentypen.
 *
 * Das Phasenfenster behält seine ID über die Schleife hinweg und wechselt
 * trotzdem seinen Inhalt. Der Layer kennt keinen Phasenbesitz; das Einzige,
 * was er vom Inhalt sieht, ist diese Kette. Sie ist für denselben Inhalt
 * stabil und wechselt mit ihm — anders als die VNode-Identität, die bei jedem
 * Render neu ist. Zwei Inhalte desselben Typs mit anderen Props gelten hier
 * als gleich; die Fenster-ID trennt die Fälle, in denen das stört.
 */
export function contentSignature(node: ComponentChildren): string {
  if (Array.isArray(node)) return node.map(contentSignature).join('/')
  if (node && typeof node === 'object' && 'type' in node) {
    const vnode = node as VNode<{ children?: ComponentChildren }>
    const type = vnode.type
    const name =
      typeof type === 'function' ? type.name || 'Anonymous' : String(type)
    return `${name}>${contentSignature(vnode.props?.children)}`
  }
  return ''
}

/** Die Fensterschicht über der Pixi-Welt. Die Welt selbst bleibt darunter. */
export function WindowLayer({ renderContent }: WindowLayerProps) {
  return (
    <div class="window-layer">
      {windows.value.map((win) => {
        const content = renderContent(win.id)
        return (
          <GameWindow
            key={win.id}
            win={win}
            focused={focusedId.value === win.id}
            contentKey={contentSignature(content)}
          >
            {content}
          </GameWindow>
        )
      })}
    </div>
  )
}
