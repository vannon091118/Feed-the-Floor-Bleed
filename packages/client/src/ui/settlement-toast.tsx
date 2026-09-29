import { RESOURCE_CATALOG } from '../resources/catalog'
import { type DayNightState, dayNight } from '../village/state'

/**
 * Die Rückkehrbilanz des zuletzt abgerechneten Tages.
 *
 * Sie ist eine reine Ableitung aus dem Phase-Owner und erzeugt keinen zweiten
 * Zustand. Das ist die ganze Begründung: `daySettlement` trägt die Bilanz
 * bereits, und `setPhase` erhöht den Tag im selben Zug, in dem es sie bucht.
 * Ein Toast, der sich merkte, ob er schon gezeigt wurde, wäre eine zweite
 * Wahrheit über einen Vorgang, den der Store vollständig beschreibt — und er
 * müsste geräumt werden, was wiederum einen Zeitgeber oder einen
 * Schließen-Knopf verlangte.
 *
 * Sichtbar ist er deshalb am Tag, und nur dort: Mit dem Beginn der nächsten
 * Nacht (`tag → night`) verschwindet er, ohne dass etwas zurückgesetzt wird.
 * Dieselbe Ablehnung trägt auch die Einmaligkeit — im Ergebnis liegt die
 * Bilanz des Vortags, gezeigt wird sie aber erst nach dem Übergang `result →
 * tag`, weil sie nur dort zum laufenden Tag gehört.
 *
 * Eine Bilanz ohne Ertrag wird gezeigt und nicht unterdrückt. Ein Dorf ohne
 * Werkstatt schreibt 0 Material gut; das zu verschweigen hieße, denselben
 * Zustand je nach Zahl zu verstecken.
 */
export interface SettlementToastView {
  /** Der abgerechnete Tag, also der vor dem Hochzählen. */
  readonly title: string
  /** Was gutgeschrieben wurde, mit der Ressourcenbezeichnung aus dem Katalog. */
  readonly detail: string
}

/**
 * Die Zeilen der Bilanz, oder `null`, wenn gerade keine zu zeigen ist. Reine
 * Funktion: gleicher Zustand, gleiches Ergebnis, kein Schreibzugriff.
 */
export function settlementToastView(
  state: DayNightState,
): SettlementToastView | null {
  const { phase, daySettlement } = state
  if (phase !== 'tag' || daySettlement === null) return null
  return {
    title: `Tag ${daySettlement.day} abgerechnet`,
    detail: `Werkstattertrag +${daySettlement.materials} ${RESOURCE_CATALOG.materials.label}`,
  }
}

/**
 * Die Bilanz als Meldung über der Bühne. Sie liest ausschließlich den
 * Phase-Owner und ist kein Bedienelement: kein Klick, kein Fokus, kein
 * eigener Zustand. `role="status"` gibt sie der Sprachausgabe, ohne den Fokus
 * zu stehlen.
 */
export function SettlementToast() {
  const view = settlementToastView(dayNight.value)
  if (view === null) return null
  return (
    <div class="settlement-toast" role="status">
      <strong class="settlement-toast__title">{view.title}</strong>
      <span class="settlement-toast__detail tnum">{view.detail}</span>
    </div>
  )
}
