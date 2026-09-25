# packages/client/docs/ARCHITEKTUR.md

## Rolle

PWA-Client: Rendern, Editieren lokal, Sync via `net`, Speichern via `storage`.

## Module

- `dungeon-editor` PixiJS 8, Pinsel 1/2/4, Drag, Hard-Block visuell
- `village` Gebäude, Attraktivität, Arbeiter-Schwellen
- `inventory` Items (9 Slots, 5 Raritäten, 1-4 Mutatoren), Zerlegen → Essenzen
- `raid` Tactic-Board (3 Regeln/Held), Playback mit Vorspulen des serverseitig validierten Combat-Logs
- `net` Upload/Results sequenziell, Token/Seed pro Etage
- `storage` Dexie, Editor-Stand, Profil
- `ui` Preact + Signals, Tabs (mobil) / Sidebar (Desktop), 44px Touch

## Regeln

Kein direkter Grid-Mutate ohne Owner `dungeon`. `net` macht kein Game-State.
