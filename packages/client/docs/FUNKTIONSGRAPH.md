# packages/client/docs/FUNKTIONSGRAPH.md

```
storage:Dexie ↔ dungeon-editor:edit (lokal)
dungeon-editor → net:upload (Dungeon+Team+Tactics)
net:upload → server:sync (via sim-core) → net:results
raid:playback ← serverseitig validierter combat log
village:build → storage + net:upload (beim nächsten Angriff Commit)
ui:Shell → dungeon-editor/village/inventory/raid
```

`net` ist dünn; `raid:playback` nutzt nur den serverseitig validierten Combat-Log.
