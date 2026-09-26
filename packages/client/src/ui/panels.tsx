import { route } from '../dungeon-editor/state'
import { villageOutlook } from '../village'
import { RosterList } from './roster-list'
import { Stats } from './stats'

function finite(value: number): string {
  return Number.isFinite(value) ? String(value) : '∞'
}

const LEGEND: readonly string[] = [
  'Ziehen auf freier Fläche: Kamera schwenken',
  'Mausrad: Zoom',
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
