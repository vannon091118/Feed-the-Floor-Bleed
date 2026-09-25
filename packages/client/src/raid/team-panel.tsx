import type { Hero } from '../fixture-data'

export interface TeamPanelProps {
  team: Hero[]
  isNight: boolean
}

/**
 * Reine Anzeige der aktiven Aufstellung plus Auswahlknopf.
 *
 * Die Komponente liest keine globalen Fixture-Werte und hält keinen State:
 * Aufstellung und Phase kommen als Props. Die Taktik selbst wird noch nicht
 * gewählt — T1.3 rechnet mit den Fixture-Taktiken.
 */
export function TeamPanel({ team, isNight }: TeamPanelProps) {
  return (
    <section className="panel team-panel">
      <div className="panel-heading">
        <div>
          <p className="eyebrow">Aktives Team</p>
          <h2>Drei gute Gründe</h2>
        </div>
        <span className="team-count">{team.length}/5</span>
      </div>
      <div className="team-list">
        {team.map((hero) => (
          <div className="hero-row" key={hero.id}>
            <span className="hero-avatar">{hero.name.slice(0, 1)}</span>
            <div className="hero-copy">
              <strong>{hero.name}</strong>
              <span>{hero.role}</span>
            </div>
            <div className="hero-hp">
              <b>{hero.hp}</b>
              <span>HP</span>
            </div>
          </div>
        ))}
      </div>
      <button type="button" className="primary-button" disabled={!isNight}>
        Team für Raid wählen
      </button>
      <p className="button-hint">
        {isNight
          ? 'Der lokale Probelauf unten nutzt genau diese Aufstellung.'
          : 'Wechsle zur Nacht, um den Dungeon zu bearbeiten.'}
      </p>
    </section>
  )
}
