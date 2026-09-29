/** Reine, policy-getriebene Entscheidung, welche Shinon-Plugins für einen Slice laufen. */

/** @typedef {{ prefixes?: string[], contains?: string[] }} EngineSlice */

/**
 * @param {string} file
 * @param {EngineSlice} slice
 * @returns {boolean}
 */
export function matchesSlice(file, slice) {
  return (
    (slice.prefixes || []).some((prefix) => file.startsWith(prefix)) ||
    (slice.contains || []).some((part) => file.includes(part))
  )
}

/**
 * @param {string} pluginName
 * @param {string[]} changedFiles
 * @param {boolean} forceFull
 * @param {import('../policy-schema.mjs').Policy} policy
 * @returns {boolean}
 */
export function shouldRun(pluginName, changedFiles, forceFull, policy) {
  if (forceFull) return true
  if (policy.engine.always.includes(pluginName)) return true
  const slice = policy.engine.slices[pluginName]
  if (!slice) return true
  return changedFiles.some((file) => matchesSlice(file, slice))
}

/**
 * Läuft dieses Plugin im lokalen Minimal-Gate der Hooks?
 *
 * Die Liste ist ausdrücklich kürzer als `always`: Sie trägt genau die Prüfungen,
 * die einen Commit oder Push überhaupt erst durchlassen (LOC, Ownership,
 * Doku-Hygiene, Version, Commit-Text und -Integrität). Alles Schwere — der
 * Compilerlauf, Redundanz, Contract-Schema und alle Slices — läuft fail-closed
 * im Job `Shinon Gate`, der die Engine mit `--full` fährt. Die Teilmenge wird in
 * `tests/gate-parity.test.mjs` gegen `always` geprüft, damit kein lokal
 * gelaufenes Plugin remote fehlen kann.
 */
/**
 * @param {string} pluginName
 * @param {import('../policy-schema.mjs').Policy} policy
 * @returns {boolean}
 */
export function shouldRunLocal(pluginName, policy) {
  return policy.engine.local.includes(pluginName)
}
