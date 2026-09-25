/** Reine, policy-getriebene Entscheidung, welche Shinon-Plugins für einen Slice laufen. */
export function matchesSlice(file, slice) {
  return (
    (slice.prefixes || []).some((prefix) => file.startsWith(prefix)) ||
    (slice.contains || []).some((part) => file.includes(part))
  )
}

export function shouldRun(pluginName, changedFiles, forceFull, policy) {
  if (forceFull) return true
  if (policy.engine.always.includes(pluginName)) return true
  const slice = policy.engine.slices[pluginName]
  if (!slice) return true
  return changedFiles.some((file) => matchesSlice(file, slice))
}
