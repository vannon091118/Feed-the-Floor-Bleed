import { treasury } from '../village'
import { PhaseBadge } from './phase-badge'
import { ViewSwitch } from './view-switch'
import { ToolGroup } from './window-tools'

/**
 * Kopfleiste: Wortmarke, Schleifenzustand, Ansichtsumschalter, Ressourcen
 * und die Schnellfenster.
 *
 * Die Ressourcen kommen aus dem Wirtschafts-Owner, nicht aus den Startdaten,
 * damit der Streifen nach einem Bau und einem Tagesabschluss den echten Stand
 * zeigt. Hält keine Spielentscheidung.
 */
export function Topbar() {
  const { gold, materials } = treasury.value
  return (
    <header class="topbar">
      <div class="brand">
        <span class="brand__mark" />
        <span class="brand__name">Feed the Floor</span>
      </div>
      <PhaseBadge />
      <ViewSwitch />
      <div class="resource-strip">
        <div class="resource">
          <span class="resource__value tnum">{gold}</span>
          <span class="resource__label">Gold</span>
        </div>
        <div class="resource">
          <span class="resource__value tnum">{materials}</span>
          <span class="resource__label">Material</span>
        </div>
      </div>
      <ToolGroup />
    </header>
  )
}
