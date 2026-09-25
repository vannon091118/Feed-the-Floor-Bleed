import { useSignal } from '@preact/signals'
import { EditorPanel } from '../dungeon-editor/editor'
import { fixture } from '../fixture-data'
import { RaidPanel } from '../raid/raid-panel'
import { TeamPanel } from '../raid/team-panel'
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
            <>
              <EditorPanel resources={resources} />
              <RaidPanel />
            </>
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
          <TeamPanel team={team} isNight={isNight} />
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
        <span>T1.3 · Fixture-Job</span>
        <span>Keine Verbindung · Kein Serverentscheid</span>
      </footer>
    </main>
  )
}
