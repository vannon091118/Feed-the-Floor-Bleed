import type { ComponentChildren, VNode } from 'preact'
import { afterEach, describe, expect, it } from 'vitest'
import { FloorPurchase, floorPurchaseView } from '../src/ui/floor-purchase'
import { BALANCE } from '../src/village/balance'
import { buyFloor } from '../src/village/floors'
import { dayNight, resetDayNight } from '../src/village/state'
import { textContent } from './vnode-text'

/**
 * Der Etage-Kauf ist eine Ableitung, kein zweiter Zustand.
 *
 * Der Test prüft zwei Zusagen, die zusammen hängen: Der Text über den
 * Fehlbetrag entsteht aus dem Bestand (und kann deshalb nicht veralten), und
 * der Knopf zahlt über denselben Store, aus dem die Anzeige liest. Ein
 * gemerkter Ablehnungstext — der alte Bau — hätte hier nach dem Auffüllen des
 * Goldes weiter „es fehlen\" gemeldet.
 */

interface KnopfProps {
  children?: ComponentChildren
  disabled?: boolean
  onClick?: () => void
}

/** Der Kaufknopf im Baum; sein `disabled` hängt am Bestand. */
function knopf(node: ComponentChildren): VNode<KnopfProps> | null {
  if (Array.isArray(node)) {
    for (const kind of node) {
      const treffer = knopf(kind)
      if (treffer) return treffer
    }
    return null
  }
  if (node && typeof node === 'object' && 'props' in node) {
    const vnode = node as VNode<KnopfProps>
    if ((vnode.type as unknown) === 'button') return vnode
    const render = vnode.type as (props: never) => ComponentChildren
    if (typeof render === 'function') return knopf(render(vnode.props as never))
    return knopf(vnode.props.children)
  }
  return null
}

/** Der Preis der Etage, die als Nächste ansteht. */
function preisDer(etage: number): number {
  return BALANCE.dungeon.floorBase * etage * etage
}

function mitGold(gold: number): void {
  dayNight.value = {
    ...dayNight.value,
    village: {
      ...dayNight.value.village,
      resources: { ...dayNight.value.village.resources, gold },
    },
  }
}

afterEach(() => {
  resetDayNight()
})

describe('Etage-Kauf im Tag-Panel', () => {
  it('leitet Preis und Fehlbetrag aus dem Bestand ab', () => {
    resetDayNight()
    mitGold(120)
    const etage2 = preisDer(2)

    expect(floorPurchaseView(dayNight.value)).toEqual({
      naechste: 2,
      preis: etage2,
      fehlt: etage2 - 120,
    })
    const text = textContent(FloorPurchase())
    expect(text).toContain('Ausgebaut bis Etage 1')
    expect(text).toContain(`Etage 2 kostet ${etage2} Gold`)
    expect(text).toContain(`Es fehlen ${etage2 - 120} Gold.`)
  })

  it('folgt dem Bestand, statt einen Ablehnungstext zu merken', () => {
    resetDayNight()
    mitGold(120)
    const etage2 = preisDer(2)
    const vorher = dayNight.value.village

    // Der abgelehnte Kauf ändert nichts und hinterlässt auch nichts.
    expect(buyFloor(BALANCE)).toEqual({
      ok: false,
      reason: 'not-affordable',
      cost: etage2,
    })
    expect(dayNight.value.village).toBe(vorher)
    expect(textContent(FloorPurchase())).toContain(
      `Es fehlen ${etage2 - 120} Gold.`,
    )

    // Kommt Gold dazu, ist der Hinweis fort — ohne dass ihn jemand löscht.
    mitGold(etage2 * 3)
    expect(floorPurchaseView(dayNight.value).fehlt).toBe(0)
    expect(textContent(FloorPurchase())).not.toContain('Es fehlen')
  })

  it('zahlt über denselben Store, aus dem die Anzeige liest', () => {
    resetDayNight()
    const etage2 = preisDer(2)
    const etage3 = preisDer(3)

    mitGold(etage2 - 1)
    expect(knopf(FloorPurchase())?.props.disabled).toBe(true)

    mitGold(etage2)
    const kaufKnopf = knopf(FloorPurchase())
    expect(kaufKnopf?.props.disabled).toBe(false)
    if (!kaufKnopf?.props.onClick) throw new Error('Kein Kaufknopf gerendert')
    kaufKnopf.props.onClick()

    expect(dayNight.value.village.floors).toBe(2)
    expect(dayNight.value.village.resources.gold).toBe(0)
    // Dieselbe Ableitung nennt jetzt die nächste Etage und ihren Fehlbetrag.
    expect(floorPurchaseView(dayNight.value)).toEqual({
      naechste: 3,
      preis: etage3,
      fehlt: etage3,
    })
    expect(textContent(FloorPurchase())).toContain(
      `Etage 3 kostet ${etage3} Gold`,
    )
    expect(knopf(FloorPurchase())?.props.disabled).toBe(true)
  })
})
