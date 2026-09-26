import { signal } from '@preact/signals'
import type { DragDropCommand } from '../input'
import { actorLabel } from './actor-label'

/**
 * Der letzte Zug im Editor.
 *
 * Bewusst im Werkzeugbereich und nicht in der Sidebar: es ist Rückmeldung
 * über eine Geste, keine Spielmeldung. Anonyme Kennungen werden vor der
 * Anzeige in sprechende Namen übersetzt.
 */
const lastDrop = signal<string | null>(null)

export function recordDrop(command: DragDropCommand): void {
  lastDrop.value = `${actorLabel(command.id)} → Feld ${command.cell.x},${command.cell.y}`
}

export function DropStatus() {
  const message = lastDrop.value
  return (
    <p class="tool-status" data-ready={message !== null}>
      {message ?? 'Figur auf ein Feld ziehen, um sie zu setzen.'}
    </p>
  )
}
