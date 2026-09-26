import type { TerminalRaidJob } from '@floor/contracts'
import { grid } from '../dungeon-editor/state'
import { runLocalFixtureRaid } from './fixture-raid'

/**
 * Nächtlicher Probelauf: rechnet den Fixture-Auftrag lokal im Core und
 * reicht das TerminalRaidJob an den Schleifen-Store weiter. Der Client
 * entscheidet nichts — der Lauf kommt als validierter Auftrag aus
 * `sim-core` zurück.
 *
 * Die Ansicht trägt dieselben Klassen wie die übrige Oberfläche und bringt
 * keine eigene Fläche mit: das Phasen-Panel trägt sie bereits.
 */
export function RaidPanel({
  onJob,
}: {
  onJob: (job: TerminalRaidJob) => void
}) {
  return (
    <>
      <p class="eyebrow">Nacht · Probelauf</p>
      <h2 class="panel__title">Fixture-Raid lokal rechnen</h2>
      <p class="raid-idle">
        Der Lauf rechnet lokal im Core, ohne Netz und ohne Serverentscheid.
      </p>
      <button
        type="button"
        class="button button--primary"
        onClick={() => onJob(runLocalFixtureRaid(grid.value))}
      >
        Auftrag rechnen
      </button>
      <p class="raid-note">
        Ergebnis, Log, Fehler und Timeout sind Contract-v3-Payloads. Der
        vollständige Log ist ein eigenes Artefakt und wird hier nicht angezeigt.
      </p>
    </>
  )
}
