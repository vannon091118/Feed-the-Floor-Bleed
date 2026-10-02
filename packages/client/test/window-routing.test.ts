import type { VNode } from 'preact'
import { afterEach, describe, expect, it } from 'vitest'
import { unloadRaidLog } from '../src/raid/combat-source'
import { TimelineTransport } from '../src/raid/raid-timeline'
import { BuildingPanel } from '../src/ui/panels'
import { phaseWindowContent } from '../src/ui/phase-windows'
import windowsCss from '../src/ui/styles/windows.css?raw'
import { windowContent } from '../src/ui/window-content'
import { BALANCE } from '../src/village/balance'
import { buildBuilding } from '../src/village/commands'
import { startNight, triggerRaid } from '../src/village/phase-actions'
import { dayNight, resetDayNight } from '../src/village/state'
import {
  clampHead,
  draggedHead,
  fittedHeight,
  geometryIsUserOwned,
  HEAD_HEIGHT,
  isHeadControl,
  SHEET_MAX_WIDTH,
  sheetOwnsLayout,
  type VisibleArea,
} from '../src/window/drag'
import { boxAfterKey, MOVE_STEP } from '../src/window/keys'
import {
  closeWindow,
  openWindow,
  resetWindows,
  windows,
} from '../src/window/store'
import { contentSignature } from '../src/window/window-layer'
import { rohText as textContent } from './vnode-text'

afterEach(() => {
  resetWindows()
  resetDayNight()
  unloadRaidLog()
})

describe('Welt-Kontextfenster', () => {
  it('öffnet einen Ortskontext ohne ein zweites Dorf-Dashboard', () => {
    // Die Fensterkennung ist der Listenplatz im Dorfbestand: Die festen
    // Startorte belegen 0 und 1, die erste gebaute Werkstatt steht auf 2.
    expect(buildBuilding('workshop', { x: 0, y: 0 }, BALANCE).ok).toBe(true)
    openWindow({ id: 'building:2', title: 'Werkstatt' })
    const content = windowContent('building:2')
    expect(content.type).toBe(BuildingPanel)
    expect(content.props.buildingId).toBe('2')
    const markup = BuildingPanel({ buildingId: '2' })
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

  it('passt die Fensterhöhe an langen Inhalt an und hält den Kopf bedienbar', () => {
    // Die Raid-Timeline ist mit über 3000 px länger als jeder Viewport:
    // Der Fit begrenzt sie auf die Fläche, der Inhalt scrollt, der Kopf bleibt.
    expect(fittedHeight(3100, { width: 1440, height: 900 })).toBe(900)
    expect(fittedHeight(600, { width: 1440, height: 900 })).toBe(
      600 + HEAD_HEIGHT,
    )
    // Ein Fenster unterhalb des oberen Randes endet an der Falz, nicht darunter.
    expect(fittedHeight(3100, { width: 1440, height: 900 }, 82)).toBe(818)
    // Kurzer Inhalt läuft nicht unter die Mindesthöhe des Resize-Griffs.
    expect(fittedHeight(0, { width: 1440, height: 900 })).toBe(120)
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
    expect(isHeadControl(knopf as unknown as EventTarget)).toBe(true)
    expect(isHeadControl(titel as unknown as EventTarget)).toBe(false)
    expect(isHeadControl(null)).toBe(false)
  })
})

/**
 * Unterhalb von 721 px ist ein Fenster eine Schublade: `windows.css` pinnt
 * `left`, `top` und `width` mit `!important` an die untere Kante. Dort ist die
 * Anordnung die Autorität über die Geometrie; bewegte der Store sie trotzdem,
 * zeigte das Bild etwas anderes als der Store, und auf schmalen Anzeigen passierte
 * sichtbar nichts. Deshalb beginnt in der Schublade weder eine Geste noch ein
 * Tastenschritt — und auch kein Griff- oder Skalierzeiger.
 */
describe('Schubladenanordnung', () => {
  const SCHMAL: VisibleArea = { width: 644, height: 651 }
  const BREIT: VisibleArea = { width: 721, height: 900 }
  const fenster = {
    id: 'phase',
    title: 'Aktion',
    x: 36,
    y: 82,
    width: 330,
    height: 247,
    z: 10,
  }

  it('nennt dieselbe Grenze wie das Stylesheet', () => {
    const schmal = windowsCss.slice(
      windowsCss.indexOf(`@media (max-width: ${SHEET_MAX_WIDTH}px)`),
    )
    expect(schmal).not.toBe('')
    expect(schmal).toContain('cursor: default')
    expect(schmal).toMatch(/\.game-window__resize\s*\{[^}]*display: none/)
  })

  it('kennt die Grenze und lässt dort keinen Tastenschritt zu', () => {
    expect(sheetOwnsLayout(SCHMAL)).toBe(true)
    expect(sheetOwnsLayout(BREIT)).toBe(false)
    for (const key of ['ArrowRight', 'ArrowDown'])
      expect(boxAfterKey(fenster, key, false, SCHMAL)).toBeNull()
    expect(boxAfterKey(fenster, 'ArrowRight', true, SCHMAL)).toBeNull()
    // Dieselbe Taste oberhalb der Grenze: ein Schritt wie bisher.
    expect(boxAfterKey(fenster, 'ArrowRight', false, BREIT)).toEqual({
      x: fenster.x + MOVE_STEP,
      y: fenster.y,
    })
  })

  it('beginnt keine Zeigergeste, wenn die Anordnung führt', () => {
    const ereignis = (width: number): Event =>
      ({
        currentTarget: {
          ownerDocument: {
            documentElement: { clientWidth: width, clientHeight: 900 },
          },
        },
      }) as unknown as Event
    expect(geometryIsUserOwned(ereignis(SCHMAL.width))).toBe(false)
    expect(geometryIsUserOwned(ereignis(BREIT.width))).toBe(true)
  })
})
