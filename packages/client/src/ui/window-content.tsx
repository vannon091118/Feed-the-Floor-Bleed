import {
  ActorPanel,
  BuildingPanel,
  LegendPanel,
  RoutePanel,
  TeamPanel,
} from './panels'
import { editorWindowContent, phaseWindowContent } from './phase-windows'

/**
 * Inhalt hinter einer Fenster-ID.
 *
 * Die Bühne kennt damit nur eine Fensterquelle. Eine unbekannte ID liefert
 * einen benannten Leerzustand statt eines leeren Fensters.
 */
export function windowContent(id: string) {
  if (id.startsWith('actor:')) return <ActorPanel windowId={id} />
  if (id.startsWith('building:'))
    return <BuildingPanel buildingId={id.slice('building:'.length)} />
  if (id === 'phase') return phaseWindowContent()
  if (id === 'editor') return editorWindowContent()
  if (id === 'team') return <TeamPanel />
  if (id === 'route') return <RoutePanel />
  if (id === 'legend') return <LegendPanel />
  return <p class="raid-note">Kein Inhalt hinterlegt.</p>
}
