import type { ComponentChildren } from 'preact'
import type { ResourceId } from '../resources/catalog'

const ICONS: Record<ResourceId, ComponentChildren> = {
  gold: (
    <>
      <circle
        cx="12"
        cy="12"
        r="9"
        fill="#b87422"
        stroke="#ffdb7a"
        stroke-width="1.5"
      />
      <circle
        cx="12"
        cy="12"
        r="6.1"
        fill="#edb843"
        stroke="#8b5018"
        stroke-width="1"
      />
      <path
        d="M12 7.2v9.6M14.3 9.2c-.5-.7-1.3-1-2.3-1-1.2 0-2 .6-2 1.5s.7 1.3 2.1 1.7c1.4.4 2.2.9 2.2 1.9s-.8 1.7-2.2 1.7c-1 0-1.9-.4-2.5-1.1"
        fill="none"
        stroke="#fff0b3"
        stroke-linecap="round"
        stroke-width="1.35"
      />
    </>
  ),
  materials: (
    <>
      <path
        d="m3 8 9-5 9 5-9 5-9-5Z"
        fill="#b98450"
        stroke="#f0c68f"
        stroke-width="1.3"
      />
      <path
        d="m3 8 9 5v9l-9-5V8Z"
        fill="#765035"
        stroke="#d6a36a"
        stroke-width="1.3"
      />
      <path
        d="m21 8-9 5v9l9-5V8Z"
        fill="#93643c"
        stroke="#e6b478"
        stroke-width="1.3"
      />
      <path d="m6 8 6-3.3L18 8l-6 3.3L6 8Z" fill="#d4a56e" opacity=".85" />
    </>
  ),
}

export function ResourceIcon({
  resource,
  label,
}: {
  resource: ResourceId
  label: string
}) {
  return (
    <svg
      class="resource__icon"
      viewBox="0 0 24 24"
      width="24"
      height="24"
      role="img"
      aria-label={label}
      focusable="false"
    >
      <title>{label}</title>
      {ICONS[resource]}
    </svg>
  )
}
