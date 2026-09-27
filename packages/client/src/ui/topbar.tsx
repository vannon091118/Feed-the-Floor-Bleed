import { fixture } from '../fixture-data'
import { ResourceIcon } from '../icons/resource-icon'
import { RESOURCE_CATALOG, RESOURCE_IDS } from '../resources/catalog'
import { PhaseBadge } from './phase-badge'
import { ViewSwitch } from './view-switch'
import { WindowTabs } from './window-tabs'

/** Gold und Material stehen als Startbasis durchgehend oben. */
const RESOURCES = RESOURCE_IDS.map((id) => ({
  ...RESOURCE_CATALOG[id],
  value: fixture.resources[id],
}))

/**
 * Kopfleiste: Wortmarke, Schleifenzustand, Ansicht, offene Fenstertabs und
 * Ressourcen. Hält keine Spielentscheidung — sie verweist nur auf
 * die Stores und schaltet zwischen zwei Ansichten.
 */
export function Topbar() {
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
            <span class="resource__value tnum">{entry.value}</span>
            <span class="resource__label">{entry.label}</span>
          </div>
        ))}
      </div>
    </header>
  )
}
