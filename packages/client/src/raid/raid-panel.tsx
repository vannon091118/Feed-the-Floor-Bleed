import type { ErrorCode, TerminalRaidJob } from '@floor/contracts'
import { useSignal } from '@preact/signals'
import { grid } from '../dungeon-editor/state'
import { fixtureRaid } from '../fixture-data'
import { runLocalFixtureRaid } from './fixture-raid'

const STAGE_TEXT = {
  'heroes-win': 'Heldensieg',
  'monsters-win': 'Boss hält',
  timeout: 'Zeitlimit erreicht',
} as const

const CODE_TEXT: Record<ErrorCode, string> = {
  blocked: 'Route blockiert',
  'invalid-hash': 'Replay-Hash stimmt nicht',
  'invalid-request': 'Snapshot oder Taktiken ungültig',
  protected: 'Ziel ist geschützt',
  timeout: 'Auftragsfrist abgelaufen',
}

function completedView(job: Extract<TerminalRaidJob, { status: 'completed' }>) {
  const { summary } = job.result
  return (
    <>
      <div className="raid-verdict">
        <span className={`raid-stage raid-stage--${summary.stage}`}>
          {STAGE_TEXT[summary.stage]}
        </span>
        <code className="raid-hash">{job.result.hash}</code>
      </div>
      <dl className="raid-stats">
        <div>
          <dt>Ticks</dt>
          <dd>{summary.ticks}</dd>
        </div>
        <div>
          <dt>Ereignisse</dt>
          <dd>{summary.events}</dd>
        </div>
        <div>
          <dt>Angriffe</dt>
          <dd>{summary.attacks}</dd>
        </div>
        <div>
          <dt>Helden</dt>
          <dd>{summary.heroesAlive}</dd>
        </div>
        <div>
          <dt>Monster</dt>
          <dd>{summary.monstersAlive}</dd>
        </div>
        <div>
          <dt>Boss</dt>
          <dd>{summary.bossAlive ? 'steht' : 'gefällt'}</dd>
        </div>
      </dl>
    </>
  )
}

function failedView(
  job: Extract<TerminalRaidJob, { status: 'failed' | 'expired' }>,
) {
  return (
    <div className="raid-verdict">
      <span className="raid-stage raid-stage--error">
        {CODE_TEXT[job.error.code]}
      </span>
      <code className="raid-hash">{job.error.detail ?? job.status}</code>
    </div>
  )
}

export function RaidPanel() {
  const job = useSignal<TerminalRaidJob | null>(null)
  const current = job.value

  return (
    <section className="panel raid-panel">
      <div className="panel-heading">
        <div>
          <p className="eyebrow">Nacht · Probelauf</p>
          <h2>Fixture-Raid lokal rechnen</h2>
        </div>
        <button
          type="button"
          className="primary-button"
          onClick={() => {
            job.value = runLocalFixtureRaid(grid.value)
          }}
        >
          Auftrag rechnen
        </button>
      </div>
      {current ? (
        current.status === 'completed' ? (
          completedView(current)
        ) : (
          failedView(current)
        )
      ) : (
        <p className="raid-idle">
          Seed {fixtureRaid.seed} · Etage {fixtureRaid.floor}. Der Lauf rechnet
          lokal im Core, ohne Netz und ohne Serverentscheid.
        </p>
      )}
      <p className="raid-note">
        Ergebnis, Log, Fehler und Timeout sind Contract-v2-Payloads. Der
        vollständige Log ist ein eigenes Artefakt und wird hier nicht angezeigt.
      </p>
    </section>
  )
}
