import type { ComponentChildren, VNode } from 'preact'
import { afterEach, describe, expect, it } from 'vitest'
import { unloadRaidLog } from '../src/raid/combat-source'
import { TimelineTransport } from '../src/raid/timeline'
import { BuildingPanel } from '../src/ui/panels'
import { phaseWindowContent } from '../src/ui/phase-windows'
import { windowContent } from '../src/ui/window-content'
import { startNight, triggerRaid } from '../src/village/phase-actions'
import { dayNight, resetDayNight } from '../src/village/state'
import {
  clampHead,
  draggedHead,
  HEAD_HEIGHT,
  isHeadControl,
} from '../src/window/drag'
import {
  closeWindow,
  openWindow,
  resetWindows,
  windows,
} from '../src/window/store'
import { contentSignature } from '../src/window/window-layer'

afterEach(() => {
  resetWindows()
  resetDayNight()
  unloadRaidLog()
})

function textContent(node: ComponentChildren): string {
  if (typeof node === 'string' || typeof node === 'number') return String(node)
  if (Array.isArray(node)) return node.map(textContent).join(' ')
  if (node && typeof node === 'object' && 'props' in node) {
    const vnode = node as VNode<{ children?: ComponentChildren }>
    // Panels sind zustandsfrei; sie lassen sich hier direkt aufrufen.
    if (typeof vnode.type === 'function')
      return textContent(vnode.type(vnode.props as never))
    return textContent(vnode.props.children)
  }
  return ''
}

describe('Welt-Kontextfenster', () => {
  it('öffnet einen Ortskontext ohne ein zweites Dorf-Dashboard', () => {
    openWindow({ id: 'building:werkstatt', title: 'Werkstatt' })
    const content = windowContent('building:werkstatt')
    expect(content.type).toBe(BuildingPanel)
    expect(content.props.buildingId).toBe('werkstatt')
    const markup = BuildingPanel({ buildingId: 'werkstatt' })
    expect(textContent(markup)).toContain('Materialproduktion')
    expect(textContent(markup)).not.toContain('Dorf · Startbasis')
  })

  it('reicht Tag- und Nachtaktion über dieselbe Phase-Fenster-ID', () => {
    openWindow({ id: 'phase', title: 'Aktion' })
    expect(textContent(phaseWindowContent())).toContain('Nacht vorbereiten')
    expect(startNight()).toBe(true)
    expect(dayNight.value.phase).toBe('night')
    expect(textContent(phaseWindowContent())).toContain('Raid vorbereiten')
  })

  it('schließt ein Fenster ohne andere Fenster zu entfernen', () => {
    openWindow({ id: 'team', title: 'Team' })
    openWindow({ id: 'route', title: 'Route' })
    closeWindow('route')
    expect(windows.value.map(({ id }) => id)).toEqual(['team'])
  })

  it('unterscheidet Fensterinhalte, die dieselbe ID behalten', () => {
    openWindow({ id: 'phase', title: 'Aktion' })
    const key = (): string => contentSignature(phaseWindowContent())
    const tag = key()
    startNight()
    const night = key()
    triggerRaid()
    const raid = key()

    // Drei Inhalte, eine Fenster-ID: nur so kann der Layer den Wechsel sehen.
    expect(new Set([tag, night, raid]).size).toBe(3)
    // Derselbe Inhalt, zweimal gerendert: gleiche Signatur, kein Reset.
    expect(key()).toBe(raid)
  })

  it('stellt die Raid-Steuerung über den Fensterinhalt', () => {
    startNight()
    triggerRaid()
    const content = phaseWindowContent()
    const children = content.props?.children as VNode[]
    // Über dem Panel, nicht unter der 3000 px langen Trail-Liste.
    expect(children[0].type).toBe(TimelineTransport)
  })
})

/**
 * Ein Fenster, dessen Kopf aus dem Sichtfeld gezogen wird, ist verloren: der
 * Schließen-Knopf ist unerreichbar. Die Klemmung sitzt deshalb in der Bewegung,
 * nicht in der Ablage.
 */
describe('Fensterkopf-Klemmung', () => {
  const AREA = { width: 1440, height: 900 }

  it('hält den Kopf am oberen Rand sichtbar', () => {
    expect(clampHead({ x: 40, y: -260, width: 330 }, AREA)).toEqual({
      x: 40,
      y: 0,
    })
  })

  it('hält den Kopf am unteren Rand sichtbar', () => {
    // Nach unten hinausgezogen: der Rumpf darf raus, der Kopf nicht.
    expect(clampHead({ x: 40, y: 1400, width: 330 }, AREA)).toEqual({
      x: 40,
      y: AREA.height - HEAD_HEIGHT,
    })
  })

  it('hält den Schließen-Knopf am rechten Rand erreichbar', () => {
    expect(clampHead({ x: 1300, y: 120, width: 330 }, AREA)).toEqual({
      x: 1110,
      y: 120,
    })
  })

  it('lässt das Ziehen über die Kopfleiste und an den unteren Rand zu', () => {
    expect(clampHead({ x: 40, y: 20, width: 330 }, AREA).y).toBe(20)
    expect(clampHead({ x: 40, y: 780, width: 330 }, AREA).y).toBe(780)
  })

  it('verankert ein Fenster, das breiter ist als die Fläche', () => {
    expect(clampHead({ x: 200, y: 100, width: 1600 }, AREA).x).toBe(0)
  })

  it('rechnet den Zugweg eines Zeigers ohne DOM-Zugriff nach', () => {
    const ereignis = {
      clientX: 300,
      clientY: -40,
      currentTarget: {
        ownerDocument: {
          documentElement: { clientWidth: 1440, clientHeight: 900 },
        },
      },
    } as unknown as PointerEvent
    const fenster = {
      id: 'phase',
      x: 20,
      y: 82,
      width: 330,
      height: 260,
    } as never
    // Ursprung: Zeiger 300/120 liegt auf dem Fensterkopf bei 20/82.
    expect(
      draggedHead(ereignis, { pointerX: 280, pointerY: 38 }, fenster),
    ).toEqual({ x: 20, y: 0 })
  })

  it('unterscheidet Zug am Kopf von einem Klick auf den Schließen-Knopf', () => {
    // Ohne diese Grenze nimmt der Zeiger-Capture der Leiste den Klick mit.
    const knopf = { closest: (sel: string) => (sel === 'button' ? {} : null) }
    const titel = { closest: () => null }
    expect(isHeadControl(knopf)).toBe(true)
    expect(isHeadControl(titel)).toBe(false)
    expect(isHeadControl(null)).toBe(false)
  })
})
