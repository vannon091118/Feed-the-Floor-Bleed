import { RaidTimeline } from '../raid/timeline'
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

/**
 * Die Seitenleiste trägt den Auftrag der Phase und das Editorwerkzeug.
 *
 * Der Editor ist an die Phase gebunden, weil Bauen in der Nacht passiert;
 * der Blick ist es nicht. Deshalb erscheint das Werkzeug in Nacht und Raid,
 * unabhängig davon, ob der Dorf- oder der Dungeon-Blick offen ist, und die
 * Panels bleiben immer sichtbar.
 *
 * In der Raid-Phase steht die Timeline aus T1.1 über dem Raid-Panel. Sie
 * gehört zur Seitenleiste, weil sie denselben Auftrag trägt und im
 * Ergebnis-Panel nicht mehr sichtbar wäre.
 */
export function Sidebar() {
  const { phase } = dayNight.value
  const editing = phase === 'night' || phase === 'raid'
  return (
    <aside class="sidebar">
      {phase === 'tag' && <TagPhasePanel />}
      {phase === 'night' && <NightPhasePanel />}
      {phase === 'raid' && <RaidPhasePanel />}
      {phase === 'raid' && <RaidTimeline />}
      {phase === 'result' && <ResultPhasePanel />}
      {editing && (
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
