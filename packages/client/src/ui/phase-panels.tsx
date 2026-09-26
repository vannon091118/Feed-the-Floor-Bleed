import { route } from '../dungeon-editor/state'
import { RaidResultView } from '../raid/panel'
import { RaidPanel } from '../raid/raid-panel'
import { completeRaid, finishResult, retryAfterResult } from '../village'
import { startNight, triggerRaid } from '../village/phase-actions'
import { dayNight } from '../village/state'
import { RoutePanel } from './panels'

/**
 * Tag: der Bürgermeister erteilt den Auftrag. Zahlen stehen im Dorfblick,
 * hier steht nur der Auftrag und seine Hauptaktion.
 */ export function TagPhasePanel() {
  return (
    <section class="panel">
      <p class="eyebrow">Tag · Bürgermeister</p>
      <h2 class="panel__title">Die Nacht vorbereiten</h2>
      <p class="panel__note">
        Im Dorfblick regierst du: Gebäude ausbauen, Arbeiter einteilen und die
        Beute der letzten Nacht verkaufen. Den Plan für den Zug legst du im
        Dungeon.
      </p>
      <button
        type="button"
        class="button button--primary"
        onClick={() => startNight()}
      >
        Nacht vorbereiten
      </button>
    </section>
  )
}

/**
 * Nacht: der Dungeon-Master räumt die Route frei. Der Editor bleibt aktiv,
 * damit ein blockierter Auftrag vor dem Raid noch reparierbar ist.
 */
export function NightPhasePanel() {
  const blocked = route.value.mode === 'unreachable'
  return (
    <section class="panel">
      <p class="eyebrow">Nacht · Dungeon-Master</p>
      <h2 class="panel__title">Raid vorbereiten</h2>
      <RoutePanel />
      <p class="panel__note">
        {blocked
          ? 'Route blockiert — erst freiräumen oder zurücksetzen, sonst kein Raid.'
          : 'Pinsel und Reset wirken weiter, das Raster geht in den Raid.'}
      </p>
      <button
        type="button"
        class="button button--primary"
        disabled={blocked}
        onClick={() => triggerRaid()}
      >
        Raid auslösen
      </button>
    </section>
  )
}

/**
 * Raid: rechnet den Fixture-Auftrag und meldet das terminale TerminalRaidJob
 * an die Schleife, die damit in die Ergebnisphase wechselt.
 */
export function RaidPhasePanel() {
  return (
    <section class="panel">
      <p class="eyebrow">Raid</p>
      <RaidPanel onJob={completeRaid} />
    </section>
  )
}

/** Ergebnis: Auftrag, Urteil und die deterministische Nachfolge. */
export function ResultPhasePanel() {
  const job = dayNight.value.job
  if (!job) {
    return (
      <section class="panel">
        <p class="eyebrow">Ergebnis</p>
        <h2 class="panel__title">Kein Auftrag</h2>
        <p class="panel__note">
          Der Auftrag fehlt. Ein erneuter Raid rechnet ihn neu.
        </p>
      </section>
    )
  }
  const retry = retryAfterResult(job)
  return (
    <section class="panel">
      <p class="eyebrow">Ergebnis</p>
      <h2 class="panel__title">Auftrag {job.id}</h2>
      <RaidResultView job={job} />
      <p class="panel__note">
        {retry
          ? 'Die Beute bleibt im Dungeon. Ein neuer Versuch rechnet den Auftrag neu.'
          : 'Verkaufe die Beute im Lager, bevor du den Tag beginnst — erst dann rechnet das Dorf ab.'}
      </p>
      <button
        type="button"
        class="button button--primary"
        onClick={() => finishResult(job)}
      >
        {retry ? 'Erneut versuchen' : 'Nächsten Tag beginnen'}
      </button>
    </section>
  )
}
