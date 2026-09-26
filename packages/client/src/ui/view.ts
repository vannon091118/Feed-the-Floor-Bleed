import { signal } from '@preact/signals'

/**
 * Der Blick auf die Bühne: Dorf oder Dungeon.
 *
 * Bewusst kein Phasenzustand. Dorf und Dungeon sind zwei Ansichten derselben
 * Welt, keine zwei Spielphasen — `village/state.ts` bleibt der einzige
 * Phase-Owner, und die Wahl ändert daran nichts. Das Dorf ist der
 * Startblick, weil der erste Eindruck der Ort sein soll, nicht das Raster.
 */
export type StageView = 'village' | 'dungeon'

export const stageView = signal<StageView>('village')

/** Setzt den Bühnenblick. Keine Spielregel, nur Navigation. */
export function showView(next: StageView): void {
  stageView.value = next
}
