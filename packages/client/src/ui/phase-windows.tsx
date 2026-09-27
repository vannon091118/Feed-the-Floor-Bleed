import { RaidTimeline, TimelineTransport } from '../raid/timeline'
import { dayNight } from '../village/state'
import { EditorControls } from './editor-controls'
import { EditorPanel } from './editor-panel'
import {
  NightPhasePanel,
  RaidPhasePanel,
  ResultPhasePanel,
  TagPhasePanel,
} from './phase-panels'

/** Der Phaseninhalt folgt dem Store; die Fenster-ID bleibt `phase`. */
export function phaseWindowContent() {
  const phase = dayNight.value.phase
  if (phase === 'tag') return <TagPhasePanel />
  if (phase === 'night') return <NightPhasePanel />
  if (phase === 'raid')
    return (
      <>
        {/* Die Steuerung steht über dem Inhalt: im 260-px-Fenster ist die
            Trail-Liste länger als der Scrollweg, die Steuerung nicht. */}
        <TimelineTransport />
        <RaidPhasePanel />
        <RaidTimeline />
      </>
    )
  return <ResultPhasePanel />
}

export function editorWindowContent() {
  return (
    <div class="editor-window">
      <EditorControls />
      <EditorPanel />
    </div>
  )
}
