import { fixture } from '../fixture-data'
import { PhaseBadge } from './phase-badge'
import { ViewSwitch } from './view-switch'
import { ToolGroup } from './window-tools'

/** Gold und Material stehen als Startbasis durchgehend oben. */
const RESOURCES = [
  { label: 'Gold', value: fixture.resources.gold },
  { label: 'Material', value: fixture.resources.materials },
]

/**
 * Kopfleiste: Wortmarke, Schleifenzustand, Ansichtsumschalter, Ressourcen
 * und die Schnellfenster. Hält keine Spielentscheidung — sie verweist nur auf
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
      <div class="resource-strip">
        {RESOURCES.map((entry) => (
          <div class="resource" key={entry.label}>
            <span class="resource__value tnum">{entry.value}</span>
            <span class="resource__label">{entry.label}</span>
          </div>
        ))}
      </div>
      <ToolGroup />
    </header>
  )
}
