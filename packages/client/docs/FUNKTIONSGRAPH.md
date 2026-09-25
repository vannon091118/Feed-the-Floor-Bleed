# packages/client/docs/FUNKTIONSGRAPH.md

```
storage:Dexie ↔ dungeon-editor:edit (lokal)
dungeon-editor → net:upload (Dungeon+Team+Tactics)
net:upload → raid:sim (via sim-core) → net:results
raid:playback ← sim-core:combat log
village:build → storage + net:upload (beim nächsten Angriff Commit)
ui:Shell → dungeon-editor/village/inventory/raid
```

`net` ist dünn, `raid:sim` nutzt `sim-core`, nie umgekehrt.
