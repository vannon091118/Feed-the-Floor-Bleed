import { paintVisibleTile } from '../dungeon-editor/state'
import type { DragDropCommand } from '../input'
import { villageOutlook } from '../village/settlement'
import { dayNight } from '../village/state'
import { openWindow, WindowLayer } from '../window'
import type { ActorKind } from '../world'
import { buildingLabel } from './building-label'
import { stageView } from './view'
import { VillageHost } from './village-host'
import { windowContent } from './window-content'
import { WindowLauncher } from './window-launcher'
import { WorldHost } from './world-host'

export interface StageProps {
  onActorClick: (actorId: string, kind: ActorKind) => void
  onDrop: (command: DragDropCommand) => void
}

/** Eine Bühne; Village- und Dungeon-Modus verwenden denselben Pixi-Host. */
export function Stage({ onActorClick, onDrop }: StageProps) {
  const village = stageView.value === 'village'
  const mode = village
    ? 'village'
    : dayNight.value.phase === 'raid'
      ? 'raid'
      : 'editor'
  const onWorldDrop = (command: DragDropCommand): void => {
    if (command.source === 'tile' && dayNight.value.phase === 'night') {
      paintVisibleTile(
        Math.floor(command.cell.x / 4),
        Math.floor(command.cell.y / 4),
      )
      return
    }
    onDrop(command)
  }
  // Der Listenplatz ist die Kennung: Er kommt vom Klick aus der Szene und ist
  // dieselbe Stelle, die `upgradeBuilding` adressiert.
  const onBuildingClick = (index: number): void => {
    const building = dayNight.value.village.buildings[index]
    openWindow({
      id: `building:${index}`,
      title: building ? buildingLabel(building.kind) : 'Dorf',
      x: 24,
      y: 240,
      width: 300,
    })
  }

  return (
    <div class="viewport">
      <WorldHost
        mode={mode}
        onActorClick={onActorClick}
        onDrop={onWorldDrop}
        onBuildingClick={onBuildingClick}
      >
        {village && <VillageHost outlook={villageOutlook()} />}
      </WorldHost>
      <WindowLauncher view={stageView.value} />
      <WindowLayer renderContent={windowContent} />
    </div>
  )
}
