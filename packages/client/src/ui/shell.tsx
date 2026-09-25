import { useSignal } from '@preact/signals'
import { EditorPanel } from '../dungeon-editor/editor'
import { fixture } from '../fixture-data'
import { VillagePanel } from '../village/village-panel'

type Phase = 'day' | 'night'

export function Shell() {
  const phase = useSignal<Phase>('day')
  const isNight = phase.value === 'night'
  const { resources, team } = fixture

  return (
    <main className="app-shell">
      <header className="topbar">
        <div className="brand-lockup">
          <span className="brand-mark">FF</span>
          <div>
            <p className="eyebrow">Feed the Floor</p>
            <h1>Meet Your Fate</h1>
          </div>
        </div>
        <nav className="phase-switch" aria-label="Tagesphase">
          <button
            type="button"
            className={!isNight ? 'is-active' : ''}
            onClick={() => {
              phase.value = 'day'
            }}
          >
            ☀ Tag
          </button>
          <button
            type="button"
            className={isNight ? 'is-active' : ''}
            onClick={() => {
              phase.value = 'night'
            }}
          >
            ☾ Nacht
          </button>
        </nav>
        <div className="resource-strip">
          <span>
            <b>{resources.gold}</b> Gold
          </span>
          <span>
            <b>{resources.materials}</b> Material
          </span>
        </div>
      </header>

      <div className="content-layout">
        <div className="main-column">
          {isNight ? (
            <EditorPanel resources={resources} />
          ) : (
            <VillagePanel
              village={fixture.village}
              day={fixture.day}
              workers={fixture.workers}
              attractiveness={fixture.attractiveness}
              materials={resources.materials}
            />
          )}
        </div>
        <aside className="side-column">
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
                <div className="hero-row" key={hero.name}>
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
            <button
              type="button"
              className="primary-button"
              disabled={!isNight}
            >
              Team für Raid wählen
            </button>
            <p className="button-hint">
              {isNight
                ? 'Der nächste Slice verbindet die Auswahl mit dem serverseitigen Freeze.'
                : 'Wechsle zur Nacht, um den Dungeon zu bearbeiten.'}
            </p>
          </section>
          <section className="signal-card">
            <span className="signal-icon">⌁</span>
            <div>
              <span className="metric-label">Systemsignal</span>
              <strong>Alles deterministisch.</strong>
              <p>
                Ein späterer Raid bekommt nur den Snapshot, den du hier
                zusammenbaust.
              </p>
            </div>
          </section>
        </aside>
      </div>
      <footer className="footer-note">
        <span>T1.1 · Fixture-Shell</span>
        <span>Keine Verbindung · Kein Serverentscheid</span>
      </footer>
    </main>
  )
}
