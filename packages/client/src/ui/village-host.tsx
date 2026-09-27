import type { VillageOutlook } from '../village'

/** Kleine Weltbeschriftung; Ressourcen und Details gehören in Topbar/Fenster. */
export function VillageHost({ outlook }: { outlook: VillageOutlook }) {
  const location =
    outlook.phase === 'tag' ? 'Dorf · Startbasis' : `Dorf · ${outlook.phase}`
  return (
    <div class="world-hud" aria-live="polite">
      <span class="world-hud__eyebrow">{location}</span>
      <strong class="world-hud__title">{outlook.name}</strong>
      <span class="world-hud__caption">
        Tag {outlook.day} · {outlook.tagline}
      </span>
      <span class="world-hud__hint">Gebäude anklicken für Details</span>
    </div>
  )
}
