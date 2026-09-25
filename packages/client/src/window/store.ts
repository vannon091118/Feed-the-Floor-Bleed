import { signal } from '@preact/signals'

export interface WindowState {
  id: string
  title: string
  x: number
  y: number
  width: number
  height: number
  z: number
}

export interface WindowInit {
  id: string
  title: string
  x?: number
  y?: number
  width?: number
  height?: number
}

export type WindowPatch = Partial<
  Pick<WindowState, 'x' | 'y' | 'width' | 'height'>
>

export const windows = signal<WindowState[]>([])
export const focusedId = signal<string | null>(null)

let topZ = 10

function find(id: string): WindowState | undefined {
  return windows.value.find((win) => win.id === id)
}

function highestId(list: readonly WindowState[]): string | null {
  let best: string | null = null
  let bestZ = Number.NEGATIVE_INFINITY
  for (const win of list) {
    if (win.z > bestZ) {
      bestZ = win.z
      best = win.id
    }
  }
  return best
}

/** Öffnet ein Fenster oder holt ein vorhandenes nach vorn. */
export function openWindow(init: WindowInit): void {
  if (find(init.id)) {
    focusWindow(init.id)
    return
  }
  topZ += 1
  windows.value = [
    ...windows.value,
    {
      id: init.id,
      title: init.title,
      x: init.x ?? 24,
      y: init.y ?? 24,
      width: init.width ?? 260,
      height: init.height ?? 220,
      z: topZ,
    },
  ]
  focusedId.value = init.id
}

export function closeWindow(id: string): void {
  const next = windows.value.filter((win) => win.id !== id)
  windows.value = next
  if (focusedId.value === id) focusedId.value = highestId(next)
}

export function focusWindow(id: string): void {
  if (!find(id)) return
  topZ += 1
  const z = topZ
  windows.value = windows.value.map((win) =>
    win.id === id ? { ...win, z } : win,
  )
  focusedId.value = id
}

export function patchWindow(id: string, patch: WindowPatch): void {
  windows.value = windows.value.map((win) =>
    win.id === id ? { ...win, ...patch } : win,
  )
}

export function resetWindows(): void {
  windows.value = []
  focusedId.value = null
  topZ = 10
}
