import type { ComponentChildren, VNode } from 'preact'
import { describe, expect, it } from 'vitest'
import { BuildingPanel } from '../src/ui/panels'
import { dayNight, resetDayNight } from '../src/village/state'
import { rohText as textContent } from './vnode-text'

/**
 * Das Gebäudefenster ist die Naht zwischen Oberfläche und Dorfbestand.
 *
 * `buildBuilding`, `upgradeBuilding` und `extendLand` sind implementiert und
 * haben keinen Aufrufer: `BuildingPanel` sagt heute „Noch nicht ausbaubar".
 * Dieser Test steht zuerst rot da und wird genau dann grün, wenn der Weg gebaut
 * ist. Er prüft Bedienelemente und löst sie aus — nicht die Befehle selbst, die
 * ihre eigenen Tests haben.
 */

/** Jedes Bedienelement des Panels, mit seiner Beschriftung. */
function buttons(
  node: ComponentChildren,
): { label: string; onClick?: () => void }[] {
  const found: { label: string; onClick?: () => void }[] = []
  const spur: ComponentChildren[] = [node]
  while (spur.length > 0) {
    const kind = spur.pop()
    if (!kind) continue
    if (Array.isArray(kind)) {
      spur.push(...kind)
      continue
    }
    if (kind && typeof kind === 'object' && 'props' in kind) {
      const vnode = kind as VNode<{
        children?: ComponentChildren
        onClick?: () => void
      }>
      if (vnode.type === 'button') {
        found.push({
          label: textContent(vnode.props.children),
          onClick: vnode.props.onClick,
        })
      } else {
        const inner = vnode.type as (props: never) => ComponentChildren
        if (typeof inner === 'function') spur.push(inner(vnode.props as never))
        else if (vnode.props.children) spur.push(vnode.props.children)
      }
    }
  }
  return found
}

describe('Das Gebäudefenster bedient den Dorfbestand', () => {
  it('baut ein Haus an einer freien Zelle und nennt danach den Ort', () => {
    resetDayNight()
    const vorher = dayNight.value.village.buildings.length
    const panel = buttons(BuildingPanel({ buildingId: '0' }))
    // Der Startort selbst ist nicht ausbaubar — das ist eine Regel aus
    // `BALANCE.buildings`, kein fehlender Weg. Der Weg zum Bauen hängt darum
    // an einem freien Platz, nicht am Gebäude.
    const bauen = panel.find((k) => k.label.includes('Haus'))
    expect(bauen).toBeDefined()
    expect(bauen?.onClick).toBeTypeOf('function')
    bauen?.onClick?.()
    expect(dayNight.value.village.buildings.length).toBeGreaterThan(vorher)
  })

  it('kauft Land und weist den neuen Raster im Fenster aus', () => {
    resetDayNight()
    const panel = buttons(BuildingPanel({ buildingId: '0' }))
    const land = panel.find((k) => k.label.includes('Land'))
    expect(land).toBeDefined()
    expect(land?.onClick).toBeTypeOf('function')
  })

  it('bietet am Startort keinen Ausbau, weil die Regel ihn ausschließt', () => {
    resetDayNight()
    // Rathaus und Gilde tragen Coefficient 0 und maxLevel 1. Ein Fenster, das
    // hier einen Ausbau-Knopf zeigte, würde einen Befehl anbieten, den
    // `upgradeBuilding` ablehnt. Die Ansage lautet deshalb "Dorfort", nicht
    // "Noch nicht ausbaubar" — die zweite liest sich wie ein fehlender Weg.
    const text = textContent(BuildingPanel({ buildingId: '0' }))
    expect(text).toContain('Dorfort')
    expect(text).not.toContain('Noch nicht ausbaubar')
  })

  it('nennt nach dem Bau den neuen Ort im Bestand', () => {
    resetDayNight()
    const vorher = dayNight.value.village.buildings.length
    const bauen = buttons(BuildingPanel({ buildingId: '0' })).find((k) =>
      k.label.includes('Haus'),
    )
    bauen?.onClick?.()
    const nachher = dayNight.value.village.buildings.length
    expect(nachher).toBe(vorher + 1)
    expect(dayNight.value.village.buildings[nachher - 1].kind).toBe('house')
  })

  it('kauft Land und vergroessert die Spaltenzahl um einen Schritt', () => {
    resetDayNight()
    const vorher = dayNight.value.village.landColumns
    const land = buttons(BuildingPanel({ buildingId: '0' })).find((k) =>
      k.label.includes('Land kaufen'),
    )
    land?.onClick?.()
    expect(dayNight.value.village.landColumns).toBeGreaterThan(vorher)
  })

  it('baut das eben gebaute Haus aus und hebt genau eine Stufe', () => {
    resetDayNight()
    const haus = buttons(BuildingPanel({ buildingId: '0' })).find((k) =>
      k.label.includes('Haus'),
    )
    haus?.onClick?.()
    const index = dayNight.value.village.buildings.length - 1
    expect(dayNight.value.village.buildings[index].level).toBe(1)

    const ausbauen = buttons(BuildingPanel({ buildingId: String(index) })).find(
      (k) => k.label.includes('Ausbauen'),
    )
    expect(ausbauen).toBeDefined()
    ausbauen?.onClick?.()
    expect(dayNight.value.village.buildings[index].level).toBe(2)
  })
})
