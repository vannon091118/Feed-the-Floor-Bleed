import type { Hero } from '../fixture-data'

export interface RosterListProps {
  heroes: Hero[]
}

function RosterRow({ hero }: { hero: Hero }) {
  const tone = hero.injury > 0 ? 'alert' : 'ok'
  return (
    <div class="roster__row">
      <div class="roster__head">
        <span class="roster__name">{hero.name}</span>
        <span class="roster__role">{hero.role}</span>
      </div>
      <div class="roster__meta">
        <span class="tnum">{hero.hp} HP</span>
        <span>Müdigkeit {hero.fatigue}</span>
        <span data-tone={tone}>
          {hero.injury > 0 ? `Verletzt (${hero.injury})` : 'unverletzt'}
        </span>
      </div>
    </div>
  )
}

/**
 * Die Gildenliste.
 *
 * Einmal im Dorfblick und einmal im Team-Fenster benutzt, damit derselbe
 * Zustand nirgends anders dargestellt wird. Reine Darstellung ohne eigenen
 * Zustand — Verletzung färbt die Zeile, HP stehen als Zahl daneben.
 */
export function RosterList({ heroes }: RosterListProps) {
  return (
    <div class="roster">
      {heroes.map((hero) => (
        <RosterRow key={hero.id} hero={hero} />
      ))}
    </div>
  )
}
