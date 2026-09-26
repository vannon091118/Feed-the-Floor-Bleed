import { dayNight } from '../village/state'
import { DropStatus } from './drop-status'
import { EditorControls } from './editor-controls'
import { EditorPanel } from './editor-panel'
import {
  NightPhasePanel,
  RaidPhasePanel,
  ResultPhasePanel,
  TagPhasePanel,
} from './phase-panels'
import { stageView } from './view'

/**
 * Die Seitenleiste trägt den Auftrag der Phase und — im Dungeon-Blick — das
 * Editorwerkzeug.
 *
 * Der Editor ist an die Phase gebunden, weil Bauen in der Nacht passiert;
 * der Blick ist es nicht. Deshalb erscheint das Werkzeug nur, wenn die
 * Dungeon-Ansicht offen ist, und die Panels bleiben immer sichtbar.
 */
export function Sidebar() {
  const { phase } = dayNight.value
  const editing = phase === 'night' || phase === 'raid'
  const dungeon = stageView.value === 'dungeon'
  return (
    <aside class="sidebar">
      {phase === 'tag' && <TagPhasePanel />}
      {phase === 'night' && <NightPhasePanel />}
      {phase === 'raid' && <RaidPhasePanel />}
      {phase === 'result' && <ResultPhasePanel />}
      {editing && dungeon && (
        <section class="panel">
          <p class="eyebrow">Editor</p>
          <EditorControls />
          <EditorPanel />
          <DropStatus />
        </section>
      )}
    </aside>
  )
}
