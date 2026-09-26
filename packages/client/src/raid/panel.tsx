import type { ErrorCode, TerminalRaidJob } from '@floor/contracts'

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

/**
 * Reine Ergebnis-Darstellung eines TerminalRaidJob: keine Zustände, keine
 * Knöpfe, keine Entscheidung über den Raid-Ausgang.
 */
export function RaidResultView({ job }: { job: TerminalRaidJob }) {
  return (
    <>{job.status === 'completed' ? completedView(job) : failedView(job)}</>
  )
}
