import { signal } from '@preact/signals'
import type { ActionResult } from '../village'

/** Die letzte Dorfaktion mit ihrer Rückmeldung. */
const lastAction = signal<ActionResult | null>(null)

/**
 * Führt eine Dorfaktion aus und merkt sich ihre Rückmeldung.
 *
 * Jede Amtshandlung des Dorfes läuft hier durch. Dadurch kann keine Aktion
 * ohne Rückmeldung denkbar bleiben, und die Wirtschaft muss ihre Gründe nur
 * an einer Stelle formulieren.
 */
export function runVillageAction(action: () => ActionResult): ActionResult {
  const result = action()
  lastAction.value = result
  return result
}

/** Zeigt die Rückmeldung der letzten Dorfaktion. */
export function VillageFeedback() {
  const result = lastAction.value
  return (
    <p
      class="village-feedback"
      data-tone={result === null ? 'idle' : result.ok ? 'ok' : 'alert'}
      aria-live="polite"
    >
      {result?.message ??
        'Am Tag regierst du: bauen, Arbeiter einteilen, Beute verkaufen.'}
    </p>
  )
}
