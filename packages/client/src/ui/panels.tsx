import { route } from '../dungeon-editor/state'
import { fixture } from '../fixture-data'

function finite(value: number): string {
  return Number.isFinite(value) ? String(value) : '∞'
}

export function TeamPanel() {
  return (
    <ul class="list">
      {fixture.team.map((hero) => (
        <li key={hero.id}>
          <strong>{hero.name}</strong> · {hero.role} · {hero.hp} HP · Müdigkeit{' '}
          {hero.fatigue}
        </li>
      ))}
    </ul>
  )
}

export function RoutePanel() {
  const current = route.value
  return (
    <dl class="facts">
      <dt>Modus</dt>
      <dd>{current.mode}</dd>
      <dt>Schritte</dt>
      <dd>{current.path.length}</dd>
      <dt>Kosten</dt>
      <dd>{finite(current.movementCost)}</dd>
      <dt>Umweg</dt>
      <dd>{finite(current.detourCost)}</dd>
    </dl>
  )
}

export interface ActorPanelProps {
  windowId: string
}

export function ActorPanel({ windowId }: ActorPanelProps) {
  const [, kind = 'actor', id = windowId] = windowId.split(':')
  return (
    <dl class="facts">
      <dt>Art</dt>
      <dd>{kind}</dd>
      <dt>ID</dt>
      <dd>{id}</dd>
    </dl>
  )
}

export function LegendPanel() {
  return (
    <ul class="list">
      <li>Ziehen auf freier Fläche: Kamera schwenken</li>
      <li>Mausrad: Zoom</li>
      <li>Klick auf eine Kreatur: Kontextfenster</li>
      <li>Kreatur ziehen: Drop-Command, keine eigene Spielregel</li>
      <li>Editor rastert DOM, die laufende Welt rastert Pixi</li>
    </ul>
  )
}
