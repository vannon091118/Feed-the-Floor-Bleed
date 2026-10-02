import type { ComponentChildren, VNode } from 'preact'

/**
 * Texte aus einem Preact-Baum lesen, ohne eine DOM zu brauchen.
 *
 * Die Panels sind zustandsfrei, deshalb lassen sie sich in den Tests direkt
 * aufrufen. Für Zagen auf ihre Beschriftung braucht es einen Weg durch die
 * VNodes, der auch Komponenten aufruft statt sie als undurchdringliches
 * Objekt zu behandeln. Genau diesen Weg haben drei Tests gebraucht; er
 * steht hier, damit er nur einmal gepflegt wird.
 *
 * Der Cast nimmt die Klassenkomponente aus `ComponentType` heraus, die nicht
 * aufrufbar ist, obwohl die Panels sie im Aufruf erwarten.
 */
export function rohText(node: ComponentChildren): string {
  if (typeof node === 'string' || typeof node === 'number') return String(node)
  if (Array.isArray(node)) return node.map(rohText).join(' ')
  if (node && typeof node === 'object' && 'props' in node) {
    const vnode = node as VNode<{ children?: ComponentChildren }>
    const render = vnode.type as (props: never) => ComponentChildren
    if (typeof render === 'function')
      return rohText(render(vnode.props as never))
    return rohText(vnode.props.children)
  }
  return ''
}

/**
 * Derselbe Text mit normalisiertem Weißraum — JSX setzt zwischen Ausdruck
 * und Wortlaut eigene Textknoten, sonst passt keine zusammenhängende Zusage.
 */
export function textContent(node: ComponentChildren): string {
  return rohText(node).replace(/\s+/g, ' ').trim()
}
