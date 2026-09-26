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
      <div class="raid-verdict">
        <span class={`raid-stage raid-stage--${summary.stage}`}>
          {STAGE_TEXT[summary.stage]}
        </span>
        <code class="raid-hash">{job.result.hash}</code>
      </div>
      <dl class="stats">
        <div class="stats__row">
          <dt class="stats__key">Ticks</dt>
          <dd class="stats__value">{summary.ticks}</dd>
        </div>
        <div class="stats__row">
          <dt class="stats__key">Ereignisse</dt>
          <dd class="stats__value">{summary.events}</dd>
        </div>
        <div class="stats__row">
          <dt class="stats__key">Angriffe</dt>
          <dd class="stats__value">{summary.attacks}</dd>
        </div>
        <div class="stats__row">
          <dt class="stats__key">Helden</dt>
          <dd class="stats__value">{summary.heroesAlive}</dd>
        </div>
        <div class="stats__row">
          <dt class="stats__key">Monster</dt>
          <dd class="stats__value">{summary.monstersAlive}</dd>
        </div>
        <div class="stats__row">
          <dt class="stats__key">Boss</dt>
          <dd class="stats__value">
            {summary.bossAlive ? 'steht' : 'gefällt'}
          </dd>
        </div>
      </dl>
    </>
  )
}

function failedView(
  job: Extract<TerminalRaidJob, { status: 'failed' | 'expired' }>,
) {
  return (
    <div class="raid-verdict">
      <span class="raid-stage raid-stage--error">
        {CODE_TEXT[job.error.code]}
      </span>
      <code class="raid-hash">{job.error.detail ?? job.status}</code>
    </div>
  )
}

/**
 * Deutscher Titel des Auftragsergebnisses.
 *
 * Einzige Textquelle für Urteil und Fehler: das Ergebnis-Panel und der
 * Dorfblick formulieren dadurch nie getrennt.
 */
export function raidOutcomeText(job: TerminalRaidJob): string {
  if (job.status === 'completed') return STAGE_TEXT[job.result.summary.stage]
  return CODE_TEXT[job.error.code]
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
