import type { Hero } from '../fixture-data'

export interface RosterListProps {
  heroes: Hero[]
}

function RosterRow({ hero }: { hero: Hero }) {
  return (
    <div class="roster__row">
      <div class="roster__head">
        <span class="roster__name">{hero.name}</span>
        <span class="roster__role">{hero.role}</span>
      </div>
      <div class="roster__meta">
        <span class="tnum">{hero.hp} HP</span>
        <span>Müdigkeit {hero.fatigue}</span>
        <span>
          {hero.injury > 0 ? `Verletzt (${hero.injury})` : 'unverletzt'}
        </span>
      </div>
    </div>
  )
}

/**
 * Die Gildenliste des Team-Fensters. Reine Darstellung ohne eigenen Zustand:
 * HP, Müdigkeit und Verletzung stehen als Zahl und Wort in der Zeile.
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
