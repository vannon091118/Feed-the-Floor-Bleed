import type { DragDropCommand } from '../input'
import { WindowLayer } from '../window'
import type { ActorKind } from '../world'
import { stageView } from './view'
import { VillageView } from './village-view'
import { windowContent } from './window-content'
import { WorldHost } from './world-host'

export interface StageProps {
  onActorClick: (actorId: string, kind: ActorKind) => void
  onDrop: (command: DragDropCommand) => void
}

/**
 * Die Bühne trägt genau eine Ansicht: den Dorfblick oder die Pixi-Welt.
 *
 * Der Fensterlayer liegt bewusst außerhalb der Auswahl, damit offene Fenster
 * einen Blickwechsel überleben. Der Dungeon-Host wird beim Wechsel neu
 * aufgebaut, weil Preact ihn genau einmal mountet.
 */
export function Stage({ onActorClick, onDrop }: StageProps) {
  const village = stageView.value === 'village'
  return (
    <div class={village ? 'viewport viewport--village' : 'viewport'}>
      {village ? (
        <VillageView />
      ) : (
        <WorldHost onActorClick={onActorClick} onDrop={onDrop} />
      )}
      <WindowLayer renderContent={windowContent} />
    </div>
  )
}
