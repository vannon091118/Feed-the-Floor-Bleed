import { BALANCE } from '../village/balance'
import { floorCost } from '../village/economy'
import { buyFloor } from '../village/floors'
import { type DayNightState, dayNight } from '../village/state'

/**
 * Der Etage-Kauf am Tag, als reine Ableitung aus dem Bestand.
 *
 * Kein eigener Zustand neben dem Store: Die ausgebauten Etagen trägt
 * `village.floors`, den Preis rechnet `floorCost` aus der Config, und die
 * Ablehnung ist die Lücke zwischen Preis und Gold. Weil der Text aus derselben
 * Quelle kommt wie der Kauf, kann er nicht veralten — eine abgelehnte Absicht
 * wird nirgends gemerkt, und ein gelungener Kauf ist die Zahlung selbst. Der
 * Knopf ist bei fehlender Deckung gesperrt, der Text nennt den Fehlbetrag; beides
 * folgt dem Bestand statt einem Klick.
 */
export interface FloorPurchaseView {
  naechste: number
  preis: number | null
  fehlt: number
}

/** Was der nächste Etage-Kauf kostet und wie viel Gold dafür fehlt. */
export function floorPurchaseView(state: DayNightState): FloorPurchaseView {
  const { floors, resources } = state.village
  const naechste = floors + 1
  const preis = floorCost(naechste, BALANCE)
  if (!preis.ok) return { naechste, preis: null, fehlt: 0 }
  return {
    naechste,
    preis: preis.cost,
    fehlt: Math.max(0, preis.cost - resources.gold),
  }
}

/**
 * Preisvorschau, Knopf und Fehlbetrag im Tag-Panel. Ein Klick ruft das
 * Kommando aus dem Dorf-Owner; aus ihm liest diese Anzeige von selbst wieder,
 * denn beide gehen über denselben Store.
 */
export function FloorPurchase() {
  const view = floorPurchaseView(dayNight.value)
  return (
    <div class="floor-purchase">
      <p class="panel__note">
        Ausgebaut bis Etage {view.naechste - 1} · Etage {view.naechste} kostet{' '}
        {view.preis === null ? 'keinen Preis' : `${view.preis} Gold`}
      </p>
      <button
        type="button"
        class="button"
        disabled={view.preis === null || view.fehlt > 0}
        onClick={() => {
          buyFloor(BALANCE)
        }}
      >
        Etage {view.naechste} freischalten
      </button>
      {view.fehlt > 0 && (
        <p class="panel__note">Es fehlen {view.fehlt} Gold.</p>
      )}
    </div>
  )
}
