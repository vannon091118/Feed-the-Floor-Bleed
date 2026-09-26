import type { BuildingOutlook } from '../village'
import { assignWorker, buildBuilding, releaseWorker } from '../village'
import { runVillageAction } from './village-feedback'

export interface BuildingCardProps {
  building: BuildingOutlook
  /** Am Tag wird gebaut und eingeteilt, sonst ist das Dorf nur zu betrachten. */
  governable: boolean
}

/** Eine Baukarte: Zweck, Stufe, Ertrag, Kosten und die Amtshandlungen darauf. */
export function BuildingCard({ building, governable }: BuildingCardProps) {
  const exhausted = building.level >= building.maxLevel
  const blocked = !governable || !building.affordable || exhausted
  const nextLabel = building.built
    ? `Ausbau auf Stufe ${building.level + 1}`
    : 'Errichten'
  return (
    <article class="building" data-built={building.built}>
      <header class="building__head">
        <p class="eyebrow">
          {building.built
            ? `Stufe ${building.level} von ${building.maxLevel}`
            : 'Bauplatz'}
        </p>
        <h3 class="building__name">{building.name}</h3>
      </header>
      <p class="building__purpose">{building.purpose}</p>
      <p class="building__yield">
        Ertrag {building.yieldGold} Gold · {building.yieldMaterials} Material je
        Tag
      </p>
      {building.missing !== '' && (
        <p class="building__missing">Es fehlen {building.missing}</p>
      )}
      <button
        type="button"
        class="button button--primary"
        disabled={blocked}
        onClick={() => runVillageAction(() => buildBuilding(building.id))}
      >
        {exhausted
          ? 'Ausgebaut'
          : `${nextLabel} · ${building.goldCost} Gold, ${building.materialCost} Material`}
      </button>
      {building.built && (
        <WorkerRow building={building} governable={governable} />
      )}
    </article>
  )
}

/** Arbeiterzuweisung eines Gebäudes: Arbeitsplätze besetzen und räumen. */
function WorkerRow({ building, governable }: BuildingCardProps) {
  return (
    <div class="worker-row">
      <span class="worker-row__count tnum">
        {building.assigned} / {building.slots} Arbeiter
      </span>
      <span class="worker-row__buttons">
        <button
          type="button"
          class="button"
          disabled={!governable || building.assigned === 0}
          aria-label={`Arbeiter aus der ${building.name} holen`}
          onClick={() => runVillageAction(() => releaseWorker(building.id))}
        >
          −
        </button>
        <button
          type="button"
          class="button"
          disabled={!governable || building.assigned >= building.slots}
          aria-label={`Arbeiter in die ${building.name} setzen`}
          onClick={() => runVillageAction(() => assignWorker(building.id))}
        >
          +
        </button>
      </span>
    </div>
  )
}
