import { ResourceIcon } from '../icons/resource-icon'
import { RESOURCE_CATALOG, RESOURCE_IDS } from '../resources/catalog'
import { dayNight } from '../village/state'
import { PhaseBadge } from './phase-badge'
import { ViewSwitch } from './view-switch'
import { WindowTabs } from './window-tabs'

/** Gold und Material stehen durchgehend oben; den Bestand liest der Dorf-Owner. */
const RESOURCES = RESOURCE_IDS.map((id) => RESOURCE_CATALOG[id])

/**
 * Kopfleiste: Wortmarke, Schleifenzustand, Ansicht, offene Fenstertabs und
 * Ressourcen. Hält keine Spielentscheidung — sie verweist nur auf
 * die Stores und schaltet zwischen zwei Ansichten.
 */
export function Topbar() {
  const gehalten = dayNight.value.village.resources
  return (
    <header class="topbar">
      <div class="brand">
        <span class="brand__mark" />
        <span class="brand__name">Feed the Floor</span>
      </div>
      <PhaseBadge />
      <ViewSwitch />
      <WindowTabs />
      <div class="resource-strip">
        {RESOURCES.map((entry) => (
          <div class="resource" key={entry.id}>
            <ResourceIcon resource={entry.id} label={entry.label} />
            <span class="resource__value tnum">{gehalten[entry.id]}</span>
            <span class="resource__label">{entry.label}</span>
          </div>
        ))}
      </div>
    </header>
  )
}
