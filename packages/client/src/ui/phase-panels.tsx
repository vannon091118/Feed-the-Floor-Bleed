import { Fragment } from 'preact'
import { route } from '../dungeon-editor/state'
import { fixture } from '../fixture-data'
import { RaidResultView } from '../raid/panel'
import { RaidPanel } from '../raid/raid-panel'
import { completeRaid, finishResult, retryAfterResult } from '../village'
import { startNight, triggerRaid } from '../village/phase-actions'
import { dayNight } from '../village/state'

const TAG_STATS = [
  { label: 'Gold', value: fixture.resources.gold },
  { label: 'Material', value: fixture.resources.materials },
  { label: 'Arbeiter', value: fixture.workers },
  { label: 'Attraktivität', value: fixture.attractiveness },
]

/** Tag-Phase (Bürgermeister-Modus): Dorf-Basisdaten und Start in die Nacht. */
export function TagPhasePanel() {
  return (
    <section class="panel phase-panel" aria-label="Tag-Phase">
      <p class="eyebrow">Tag · Bürgermeister</p>
      <h2>Dorf {fixture.village}</h2>
      <dl class="facts">
        {TAG_STATS.map((stat) => (
          <Fragment key={stat.label}>
            <dt>{stat.label}</dt>
            <dd>{stat.value}</dd>
          </Fragment>
        ))}
      </dl>
      <button type="button" class="primary-button" onClick={() => startNight()}>
        Nacht starten
      </button>
    </section>
  )
}

/**
 * Nacht-Phase (Dungeon-Master-Modus): der Editor bleibt aktiv, der Raid
 * startet erst, wenn die Route erreichbar ist.
 */
export function NightPhasePanel() {
  return (
    <section class="panel phase-panel" aria-label="Nacht-Phase">
      <p class="eyebrow">Nacht · Dungeon-Master</p>
      <h2>Dungeon vorbereiten</h2>
      <p class="phase-note">
        {route.value.mode === 'unreachable'
          ? 'Route blockiert — erst freiräumen oder Reset, sonst kein Raid.'
          : 'Editor aktiv. Pinsel und Reset wirken weiter, das Grid geht in den Raid.'}
      </p>
      <button
        type="button"
        class="primary-button"
        disabled={route.value.mode === 'unreachable'}
        onClick={() => triggerRaid()}
      >
        Raid auslösen
      </button>
    </section>
  )
}

/**
 * Raid-Phase: rechnet den Fixture-Auftrag und meldet das terminale
 * TerminalRaidJob an die Schleife, die damit in die Ergebnisphase wechselt.
 */
export function RaidPhasePanel() {
  return (
    <section class="panel phase-panel" aria-label="Raid-Phase">
      <p class="eyebrow">Raid</p>
      <RaidPanel onJob={completeRaid} />
    </section>
  )
}

/** Ergebnis-Phase: Auftrag, Urteil und die deterministische Nachfolge. */
export function ResultPhasePanel() {
  const job = dayNight.value.job
  if (!job) {
    return (
      <section class="panel phase-panel" aria-label="Ergebnis-Phase">
        <p class="eyebrow">Ergebnis</p>
        <p class="phase-note">Kein Auftrag — Raid auslösen, um zu rechnen.</p>
      </section>
    )
  }
  return (
    <section class="panel phase-panel" aria-label="Ergebnis-Phase">
      <p class="eyebrow">Ergebnis</p>
      <h2>Auftrag {job.id}</h2>
      <RaidResultView job={job} />
      <button
        type="button"
        class="primary-button"
        onClick={() => finishResult(job)}
      >
        {retryAfterResult(job) ? 'Erneut versuchen' : 'Nächsten Tag beginnen'}
      </button>
    </section>
  )
}
