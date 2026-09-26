import type { TerminalRaidJob } from '@floor/contracts'
import { grid } from '../dungeon-editor/state'
import { runLocalFixtureRaid } from './fixture-raid'

/**
 * Nächtlicher Probelauf: rechnet den Fixture-Auftrag lokal im Core und
 * reicht das TerminalRaidJob an den Schleifen-Store weiter. Der Client
 * entscheidet nichts — der Lauf kommt als validierter Auftrag aus
 * `sim-core` zurück.
 */
export function RaidPanel({
  onJob,
}: {
  onJob: (job: TerminalRaidJob) => void
}) {
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
          onClick={() => onJob(runLocalFixtureRaid(grid.value))}
        >
          Auftrag rechnen
        </button>
      </div>
      <p className="raid-idle">
        Der Lauf rechnet lokal im Core, ohne Netz und ohne Serverentscheid.
      </p>
      <p className="raid-note">
        Ergebnis, Log, Fehler und Timeout sind Contract-v3-Payloads. Der
        vollständige Log ist ein eigenes Artefakt und wird hier nicht angezeigt.
      </p>
    </section>
  )
}
