# packages/server/docs/FUNKTIONSGRAPH.md

```
client:net:upload → sync:validate → db:store (Snapshot+Team)
sync:token → matchmaking:assign (Bracket+Ghost fallback)
sync:replay (sim-core) → hash:check → db:loot + db:defender (Moral/Stein/Loss-XP)
db:defender → sync:sync-log (beim nächsten Login)
matchmaking:lock → db:lock (7T lokal)
```

`matchmaking` ändert keine Ergebnisse, `sync` enthält keine Spielregeln außerhalb Validierung.
