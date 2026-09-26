import type { BuildingOutlook } from '../village'
import { villageOutlook } from '../village'
import { BuildingCard } from './building-card'
import { RosterList } from './roster-list'
import { Stats } from './stats'
import { VillageFeedback } from './village-feedback'
import { District, NightRecord, Warehouse } from './village-places'

/**
 * Der Dorfblick: Ort, Gebäude, Lager, Gilde und Bilanz der letzten Nacht.
 *
 * Reine Darstellung und reine Komposition. Alle Werte kommen aus `village/`,
 * jede Amtshandlung aus den Aktionen desselben Owners und läuft über
 * `runVillageAction`, damit die Rückmeldung nie fehlen kann. Die Karten
 * selbst stehen in `village-places`, die Baukarten in `building-card`.
 */
export function VillageView() {
  const outlook = villageOutlook()
  const governable = outlook.phase === 'tag'
  return (
    <div class="village">
      <header class="village__head">
        <p class="eyebrow">Dorf</p>
        <h1 class="village__name">{outlook.name}</h1>
        <p class="village__sub">
          Tag {outlook.day} · {outlook.tagline}
        </p>
      </header>
      <Stats
        rows={[
          ['Arbeiter', `${outlook.workers} / ${outlook.workerCapacity}`],
          ['Attraktivität', String(outlook.attractiveness)],
          ['Bauplätze', `${outlook.plotsUsed} / ${outlook.plots}`],
        ]}
      />
      <div class="village__grid">
        {outlook.districts.map((district) => (
          <District key={district.id} district={district} />
        ))}
        <Warehouse outlook={outlook} />
      </div>
      <section class="village__section">
        <h2 class="section-title">Gebäude</h2>
        <div class="building-grid">
          {outlook.buildings.map((building: BuildingOutlook) => (
            <BuildingCard
              key={building.id}
              building={building}
              governable={governable}
            />
          ))}
        </div>
      </section>
      <section class="village__section">
        <h2 class="section-title">Gilde</h2>
        <RosterList heroes={outlook.roster} />
      </section>
      <section class="village__section">
        <h2 class="section-title">Letzte Nacht</h2>
        <NightRecord outlook={outlook} />
      </section>
      <VillageFeedback />
    </div>
  )
}
