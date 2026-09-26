import { raidOutcomeText } from '../raid/panel'
import {
  type VillageDistrict,
  type VillageOutlook,
  dayNight,
  lootLabel,
  sellLoot,
} from '../village'
import { runVillageAction } from './village-feedback'

/** Belegungsbalken, aber nur wo der Ort etwas zählbares belegt. */
function Share({ share }: { share: number }) {
  return (
    <div class="meter">
      <div
        class="meter__fill"
        style={{ width: `${Math.round(share * 100)}%` }}
      />
    </div>
  )
}

/** Ein Ort des Dorfes mit Zustand, Ton und Belegung. */
export function District({ district }: { district: VillageDistrict }) {
  return (
    <article class="district" data-tone={district.tone}>
      <p class="eyebrow">{district.kind}</p>
      <h2 class="district__name">{district.name}</h2>
      <p class="district__state">{district.state}</p>
      {district.share !== null && <Share share={district.share} />}
      <p class="district__note">{district.note}</p>
    </article>
  )
}

/** Das Lager: was die Nacht eingebracht hat und was es wert ist. */
export function Warehouse({ outlook }: { outlook: VillageOutlook }) {
  const loot = outlook.pendingLoot
  return (
    <article class="district" data-tone={loot ? 'accent' : 'idle'}>
      <p class="eyebrow">Lager</p>
      <h2 class="district__name">
        {loot ? `${loot.gold} Gold · ${loot.materials} Material` : 'Lager leer'}
      </h2>
      <p class="district__state">
        {loot
          ? lootLabel(loot)
          : 'Aus einem Auftrag, der nicht geglückt ist, kommt nichts herein.'}
      </p>
      <button
        type="button"
        class="button button--primary"
        disabled={!loot || outlook.phase !== 'result'}
        onClick={() => runVillageAction(() => sellLoot())}
      >
        {loot ? 'Beute verkaufen' : 'Nichts zu verkaufen'}
      </button>
    </article>
  )
}

/** Überschrift der letzten Nacht. Status und Fehlertext kommen aus `raid/`. */
function nightHeadline(outlook: VillageOutlook): string {
  const job = dayNight.value.job
  if (outlook.lastNight.status === 'none' || !job) {
    return 'Noch keine Nacht gespielt'
  }
  return raidOutcomeText(job)
}

function nightTone(outlook: VillageOutlook): string {
  const { status } = outlook.lastNight
  if (status === 'completed') return 'ok'
  if (status === 'failed' || status === 'expired') return 'alert'
  return 'idle'
}

/** Die Bilanz der letzten Nacht als eigene Karte. */
export function NightRecord({ outlook }: { outlook: VillageOutlook }) {
  return (
    <article class="district" data-tone={nightTone(outlook)}>
      <h2 class="district__name">{nightHeadline(outlook)}</h2>
      <p class="district__state">{outlook.lastNight.detail}</p>
    </article>
  )
}
