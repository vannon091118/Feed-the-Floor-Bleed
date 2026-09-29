import type { VNode } from 'preact'
import { afterEach, describe, expect, it } from 'vitest'
import { fixture } from '../src/fixture-data'
import {
  SettlementToast,
  settlementToastView,
} from '../src/ui/settlement-toast'
import shellCss from '../src/ui/styles/shell.css?raw'
import { BALANCE } from '../src/village/balance'
import { type PlacedBuilding, workshopYield } from '../src/village/economy'
import {
  completeRaid,
  finishResult,
  startNight,
  triggerRaid,
} from '../src/village/phase-actions'
import { dayNight, resetDayNight } from '../src/village/state'
import { JOB } from './raid-fixtures'

/**
 * Die Rückkehrbilanz ist eine Ableitung, kein zweiter Zustand.
 *
 * Der Test fährt die echte Schleife über die Phasen-Kommandos und prüft, dass
 * die Bilanz genau am Tag nach einer Rückkehr dasteht: vorher nicht, im
 * Ergebnis nicht, in der Nacht nicht. Damit hängt die Einmaligkeit des Toasts
 * an derselben Guarde wie die Buchung selbst — ein eigener „schon gezeigt\"-
 * Zustand existiert nicht und kann deshalb auch nicht auseinanderlaufen.
 *
 * Der Store wird dabei ausdrücklich mitgeprüft: `SettlementToast` darf ihn
 * lesen und nicht schreiben. Weil jeder Schreibzugriff ein neues Objekt setzt,
 * genügt dafür die Referenz.
 *
 * Die Ansageregion der Meldung bleibt dauerhaft im Baum, auch wenn nichts zu
 * melden ist; sonst entstünde sie erst mit ihrem Text und die Sprachausgabe
 * könnte den Text verpassen. Auch das wird geprüft, weil es am Bild allein
 * nicht zu sehen ist.
 */

/** Ein Dorf mit einer Werkstatt; der Grundriss ist hier nur Auffüllung. */
function mitWerkstatt(level: number): void {
  const building: PlacedBuilding = { kind: 'workshop', level }
  dayNight.value = {
    ...dayNight.value,
    village: {
      ...dayNight.value.village,
      buildings: [
        {
          ...building,
          footprint: { x: 0, y: 0, width: 2, height: 3 },
        },
      ],
    },
  }
}

/** Eine vollständige Schleife bis zum Morgen danach. */
function bisZurRueckkehr(): void {
  expect(startNight()).toBe(true)
  expect(triggerRaid()).toBe(true)
  expect(completeRaid(JOB)).toBe(true)
  expect(finishResult(JOB)).toBe(true)
}

afterEach(() => {
  resetDayNight()
})

describe('Rückkehrbilanz', () => {
  it('zeigt vor der ersten Rückkehr nichts', () => {
    resetDayNight()
    expect(settlementToastView(dayNight.value)).toBeNull()
    const region = SettlementToast() as VNode<{ children: unknown }>
    expect(region.props.children).toBeNull()
  })

  it('zeigt im Ergebnis noch nichts und erst danach die Bilanz', () => {
    resetDayNight()
    mitWerkstatt(2)
    expect(startNight()).toBe(true)
    expect(triggerRaid()).toBe(true)
    expect(completeRaid(JOB)).toBe(true)
    // Ergebnisphase: die Bilanz des Vortags entsteht erst mit dem Übergang
    // nach `tag`, also gibt es hier nichts zu zeigen.
    expect(dayNight.value.phase).toBe('result')
    expect(settlementToastView(dayNight.value)).toBeNull()

    expect(finishResult(JOB)).toBe(true)
    expect(dayNight.value.phase).toBe('tag')
    expect(settlementToastView(dayNight.value)).not.toBeNull()
  })

  it('nennt den abgerechneten Tag und den Werkstattertrag', () => {
    resetDayNight()
    mitWerkstatt(2)
    bisZurRueckkehr()
    expect(settlementToastView(dayNight.value)).toEqual({
      title: `Tag ${fixture.day} abgerechnet`,
      detail: `Werkstattertrag +${workshopYield(2, BALANCE)} Material`,
    })
    // Der Zähler steht auf dem Tag danach; genannt wird der abgerechnete.
    expect(dayNight.value.day).toBe(fixture.day + 1)
  })

  it('verschwindet mit der nächsten Nacht und kommt zum nächsten Tag wieder', () => {
    resetDayNight()
    mitWerkstatt(1)
    bisZurRueckkehr()
    expect(settlementToastView(dayNight.value)).not.toBeNull()

    expect(startNight()).toBe(true)
    expect(settlementToastView(dayNight.value)).toBeNull()
    // Die Region bleibt stehen, nur ihr Inhalt verschwindet.
    expect(
      (SettlementToast() as VNode<{ children: unknown }>).props.children,
    ).toBeNull()

    expect(triggerRaid()).toBe(true)
    expect(completeRaid(JOB)).toBe(true)
    expect(settlementToastView(dayNight.value)).toBeNull()

    expect(finishResult(JOB)).toBe(true)
    expect(settlementToastView(dayNight.value)).toEqual({
      title: `Tag ${fixture.day + 1} abgerechnet`,
      detail: `Werkstattertrag +${workshopYield(1, BALANCE)} Material`,
    })
  })

  it('zeigt auch eine Bilanz ohne Ertrag, statt sie zu verschweigen', () => {
    resetDayNight()
    bisZurRueckkehr()
    expect(
      dayNight.value.village.buildings.some((b) => b.kind === 'workshop'),
    ).toBe(false)
    expect(settlementToastView(dayNight.value)).toEqual({
      title: `Tag ${fixture.day} abgerechnet`,
      detail: 'Werkstattertrag +0 Material',
    })
  })

  it('liest den Store und schreibt ihn beim Rendern nicht', () => {
    resetDayNight()
    mitWerkstatt(3)
    bisZurRueckkehr()
    const vorher = dayNight.value
    const markup = SettlementToast()
    expect(dayNight.value).toBe(vorher)
    expect(markup).not.toBeNull()
  })

  it('legt die Meldung in eine dauerhafte Region statt sie mit ihr zu zeigen', () => {
    resetDayNight()
    mitWerkstatt(1)
    bisZurRueckkehr()
    const region = SettlementToast() as VNode<{
      role: string
      children: VNode<{ class: string }>
    }>
    expect(region.type).toBe('div')
    expect(region.props.role).toBe('status')
    const meldung = region.props.children as VNode<{ class: string }>
    expect(meldung.type).toBe('div')
    expect(meldung.props.class).toBe('settlement-toast')
  })

  it('hält die Meldung aus dem Stylesheet über den Klassennamen', () => {
    expect(shellCss).toContain('.settlement-toast {')
    expect(shellCss).toContain('.settlement-toast__title {')
    expect(shellCss).toContain('.settlement-toast__detail {')
    // Kein Bedienelement: Klicks gehen durch sie hindurch. Gelesen wird nur
    // der Regelblock bis zur schließenden Klammer — der Rest der Datei trägt
    // dieselbe Zeile mehrfach und verdeckte ein Entfernen hier sonst.
    const [, nachDerRegel = ''] = shellCss.split('.settlement-toast {')
    expect(nachDerRegel.slice(0, nachDerRegel.indexOf('}'))).toContain(
      'pointer-events: none',
    )
  })
})
