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
        {/* Die Steuerung steht über der Trail-Liste. Das Fenster wächst mit
            dem Inhalt bis zur Falz, die Liste überschreitet sie aber um ein
            Vielfaches — klebend bleibt sie erreichbar. */}
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
