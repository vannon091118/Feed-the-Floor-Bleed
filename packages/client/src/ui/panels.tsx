import { route } from '../dungeon-editor/state'
import { CAMERA_KEY_HINT } from '../render/camera-keys'
import { VILLAGE_BUILDINGS } from '../render/village-layout'
import { villageOutlook } from '../village'
import { BALANCE } from '../village/balance'
import { WINDOW_KEY_HINT } from '../window/keys'
import { buildingLabel } from './building-label'
import { RosterList } from './roster-list'
import { Stats } from './stats'

function finite(value: number): string {
  return Number.isFinite(value) ? String(value) : '∞'
}

const LEGEND: readonly string[] = [
  'Ziehen auf freier Fläche: Kamera schwenken',
  'Mausrad: Zoom',
  CAMERA_KEY_HINT,
  'Tabulator: von Bedienelement zu Bedienelement, Fensterrahmen inklusive',
  WINDOW_KEY_HINT,
  'Klick auf eine Kreatur: Kontextfenster',
  'Kreatur ziehen: Drop-Command, keine eigene Spielregel',
  'Editor rastert DOM, die laufende Welt rastert Pixi',
]

export function TeamPanel() {
  return <RosterList heroes={villageOutlook().roster} />
}

export function RoutePanel() {
  const current = route.value
  return (
    <Stats
      rows={[
        ['Modus', current.mode],
        ['Schritte', String(current.path.length)],
        ['Kosten', finite(current.movementCost)],
        ['Umweg', finite(current.detourCost)],
      ]}
    />
  )
}

export function BuildingPanel({ buildingId }: { buildingId: string }) {
  const building = VILLAGE_BUILDINGS.find((entry) => entry.id === buildingId)
  if (!building) return <p class="raid-note">Ort nicht gefunden.</p>
  return (
    <div class="context-details">
      <strong>{buildingLabel(building.kind)}</strong>
      <p>
        {building.kind === 'workshop'
          ? 'Materialproduktion · Noch nicht freigeschaltet'
          : 'Dorfort · Noch nicht ausbaubar'}
      </p>
      {building.kind === 'house' && (
        <p>
          Startbasis: {BALANCE.start.workerBase} Arbeiter · Attraktivität{' '}
          {BALANCE.attraction.base}
        </p>
      )}
    </div>
  )
}

export interface ActorPanelProps {
  windowId: string
}

export function ActorPanel({ windowId }: ActorPanelProps) {
  const [, kind = 'actor', id = windowId] = windowId.split(':')
  return (
    <Stats
      rows={[
        ['Art', kind],
        ['ID', id],
      ]}
    />
  )
}

export function LegendPanel() {
  return (
    <ul class="list">
      {LEGEND.map((entry) => (
        <li key={entry}>{entry}</li>
      ))}
    </ul>
  )
}
