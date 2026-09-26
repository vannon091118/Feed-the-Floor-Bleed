import { showView, stageView } from './view'

const VIEWS = [
  { id: 'village', label: 'Dorf' },
  { id: 'dungeon', label: 'Dungeon' },
] as const

/**
 * Umschalter zwischen Dorf- und Dungeon-Blick.
 *
 * Der Blick ist Navigation, kein Spielzustand: der Wechsel ändert weder die
 * Phase noch das Grid. Beide Ansichten bleiben unabhängig von der Phase
 * erreichbar, damit man jederzeit nachsehen kann, was der Plan ergibt.
 */
export function ViewSwitch() {
  const active = stageView.value
  return (
    <nav class="view-switch" aria-label="Ansicht">
      {VIEWS.map((entry) => (
        <button
          key={entry.id}
          type="button"
          class="view-switch__option"
          aria-pressed={active === entry.id}
          onClick={() => showView(entry.id)}
        >
          {entry.label}
        </button>
      ))}
    </nav>
  )
}
