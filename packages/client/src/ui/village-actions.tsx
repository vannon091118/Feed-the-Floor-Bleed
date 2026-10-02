import type { Resources } from '../fixture-data'
import { BALANCE } from '../village/balance'
import { buildBuilding, extendLand, upgradeBuilding } from '../village/commands'
import { landStepCost } from '../village/economy'
import type { GridBounds } from '../village/plot'
import { firstFreeSite } from '../village/plot'
import { dayNight } from '../village/state'

/**
 * Die Bedienelemente des Dorfs: bauen, Land kaufen, ausbauen.
 *
 * Dies ist der Ort, an dem `buildBuilding`, `extendLand` und `upgradeBuilding`
 * ihren ersten Aufrufer bekommen. Sie standen vorher ohne Aufrufer da: der
 * Bestand konnte wachsen, aber niemand konnte es auslösen.
 *
 * **Die Flächenwahl ist eine Dorfregel und keine Oberflächenkürze.** Die Suche
 * nach der ersten freien Zelle liegt in `village/plot.ts` und nicht hier, weil
 * sie dieselbe `canPlace`-Prüfung benutzt, die `buildBuilding` selbst fährt.
 * Zwei Suchen mit derselben Regel an zwei Orten wären zwei Antworten auf
 * dieselbe Frage.
 *
 * Das Modul liest den Bestand und schreibt über die Befehle; es führt keine
 * eigene Liste und keine eigene Rechnung.
 */

/** Der Zustand, den die Knöpfe brauchen — aus dem Bestand, nichts daneben. */
interface VillageActions {
  haus: { x: number; y: number } | undefined
  land: ReturnType<typeof landStepCost>
  bounds: GridBounds
  res: Resources
}

/** Liest den Bestand einmal und rechnet daraus die drei Bedienmöglichkeiten. */
function villageActions(): VillageActions {
  const { village } = dayNight.value
  return {
    haus: firstFreeSite(
      BALANCE.buildings.house.footprint,
      village.buildings.map((ort) => ort.footprint),
      { columns: village.landColumns, rows: BALANCE.start.landRows },
    ),
    land: landStepCost(
      village.landColumns,
      village.landColumns + BALANCE.land.columnsPerStep,
      BALANCE,
    ),
    bounds: {
      columns: village.landColumns,
      rows: BALANCE.start.landRows,
    },
    res: village.resources,
  }
}

/**
 * Die drei Knöpfe des Dorfpanels.
 *
 * Ein Knopf ist genau dann aus, wenn der Befehl ihn ablehnen würde. Das kostet
 * einen Probeaufruf, erspart aber eine zweite Ablehnungsregel: Was der Knopf
 * anzeigt, ist der Grund, den der Befehl genannt hat.
 */
export function VillageActionsBar({ index }: { index: number }) {
  const { haus, land, res } = villageActions()
  const building = dayNight.value.village.buildings[index]
  const ausbaubar =
    !!building &&
    building.level < BALANCE.buildings[building.kind].maxLevel &&
    upgradeBuilding(index, BALANCE).ok
  return (
    <div class="window-actions">
      <button
        type="button"
        disabled={!haus}
        onClick={() => {
          if (haus) buildBuilding('house', haus, BALANCE)
        }}
      >
        Haus bauen
      </button>
      <button
        type="button"
        disabled={!land.ok}
        onClick={() => {
          extendLand(BALANCE)
        }}
      >
        {land.ok
          ? `Land kaufen (${land.cost.gold} Gold, ${land.cost.materials} Material)`
          : 'Land ist nicht kaufbar'}
      </button>
      {ausbaubar && (
        <button
          type="button"
          onClick={() => {
            upgradeBuilding(index, BALANCE)
          }}
        >
          Ausbauen
        </button>
      )}
      <p class="raid-note">{erklaerung(haus, land, res)}</p>
    </div>
  )
}

/** Der eine Satz, der sagt, warum ein Knopf aus ist. */
function erklaerung(
  haus: { x: number; y: number } | undefined,
  land: ReturnType<typeof landStepCost>,
  res: Resources,
): string {
  if (!haus) return 'Das Dorf ist voll; kaufe Land.'
  if (!land.ok) return 'Das Land hat seine Endspalte erreicht.'
  if (res.gold < land.cost.gold || res.materials < land.cost.materials)
    return 'Zu wenig Gold oder Material für den Landkauf.'
  return `Freie Baufläche bei ${haus.x},${haus.y}.`
}
