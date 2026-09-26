import { raidOutcomeText } from '../raid/panel'
import {
  type VillageDistrict,
  type VillageOutlook,
  dayNight,
  villageOutlook,
} from '../village'
import { RosterList } from './roster-list'

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

function District({ district }: { district: VillageDistrict }) {
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

/**
 * Der Dorfblick: Ort, Gilde und Bilanz der letzten Nacht.
 *
 * Reine Darstellung. Alle Werte kommen aus `village/settlement`, es gibt hier
 * keinen Dorfzustand und keine Wirtschaftsregel — die bleibt T2.
 */
export function VillageView() {
  const outlook = villageOutlook()
  return (
    <div class="village">
      <header class="village__head">
        <p class="eyebrow">Dorf</p>
        <h1 class="village__name">{outlook.name}</h1>
        <p class="village__sub">
          Tag {outlook.day} · {outlook.tagline}
        </p>
      </header>
      <div class="village__grid">
        {outlook.districts.map((district) => (
          <District key={district.id} district={district} />
        ))}
      </div>
      <section class="village__section">
        <h2 class="section-title">Gilde</h2>
        <RosterList heroes={outlook.roster} />
      </section>
      <section class="village__section">
        <h2 class="section-title">Letzte Nacht</h2>
        <article class="district" data-tone={nightTone(outlook)}>
          <h2 class="district__name">{nightHeadline(outlook)}</h2>
          <p class="district__state">{outlook.lastNight.detail}</p>
        </article>
      </section>
    </div>
  )
}
