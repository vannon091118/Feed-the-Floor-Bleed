# packages/client/docs/historisch/2026-09-27_client-raid-replay.md — Raid-Replay im Dorf

Abgelegt aus `packages/client/docs/CHANGELOG.md` am 2026-09-28, weil der aktive Changelog an die 200-Zeilen-Cap kam. Inhaltlich unverändert.

## 2026-09-27 — Raid-Replay gehört dem Raid, nicht der Szene

**Scope:** neu `raid/combat-source.ts`; `showcase/combat-source.ts` entfallen. Geändert: `showcase/scene.ts`, `raid/playback.ts`, `raid/raid-panel.tsx`, `village/phase-actions.ts`, `ui/world-host.tsx` sowie `test/raid-playback-wiring.test.ts` und `test/raid-timeline.test.ts`.

**Der Befund.** `playbackLog` wurde ausschließlich von `showcase/combat-source.ts` gesetzt, und das nur beim Aufbau der Dungeon-Szene. Im Dorf — der Standardansicht — war der Store deshalb leer: `RaidTimeline` gab `null` zurück, und das Panel sagte dauerhaft, der vollständige Log werde „hier nicht angezeigt". Die Raid-Phase endete im Dorf in einem toten Endpunkt, ohne jeden Hinweis auf den nötigen Blickwechsel. Derselbe Besitzer trieb auch den Tick: ohne Dungeon-Szene gab es keine Uhr.

**Die Korrektur.** Der Log wandert in das Raid-Fach. `raid/combat-source.ts` ist der einzige Schreibpfad: `buildCombatLog` rechnet denselben Core-Aufruf wie bisher, `loadRaidLog` legt das Ergebnis in den Store und `unloadRaidLog` räumt ihn mit dem Tag auf. Ausgelöst wird das vom Raid-Lebenszyklus selbst — `triggerRaid` lädt, `finishResult` räumt auf, ein gescheiterter Auftrag lässt den Lauf weiterlaufen. Ein Effekt hält den Log mit dem Grid synchron, weil das Grid im Raid-Editor noch löschbar ist; ohne geladenen Log rechnet der Editor keinen Kampf vor. Die Takt-Rate kommt jetzt aus dem geladenen Log statt aus dem Aufrufer, damit kein Zweitleser sie pflegt.

**Der Takt.** `stepPlayback(deltaMs)` hängt am Runtime-Ticker in `ui/world-host.tsx`, nicht an der lebenden Szene. `showcase/scene.ts` liest Log und Tick im Raid-Modus nur noch aus dem Store und zeigt im Editor-Modus wieder die Leerlaufbesetzung der Route — genau die Aufgabe, die `visual/route-actors.ts` seit jeher beschreibt. Damit läuft ein Replay im Dorf wie im Dungeon, ohne dass die Ansicht umschaltet und ohne eine zweite Quelle für Tick-Daten.

**Belegt im Browser, nicht im Test.** Vollständiger Pfad Tag 18 → Nacht → Raid im **Dorf** gehalten: Die Timeline erscheint im Kontextfenster, der Tick läuft 60 → 219 → über 255 in den nächsten Durchlauf, Pause friert bei 40 ein, „Kampf-Phase" springt auf Tick 83, „Auftrag rechnen" liefert denselben Hash `94ba1954` wie aus dem Dungeon, und mit „Nächsten Tag beginnen" verschwindet der Log (Tag 19, Panel „Die Nacht vorbereiten", keine Rest-Timeline). Durchgehend genau ein `<canvas>`, `data-render-mode` bleibt `village` — kein stilles Umschalten. Die Gegenprobe im Dungeon: Editor zeigt Helden am Start und Boss am Ziel, der Raid-Modus rendert weiter den Kampf bei laufender Timeline. Keine Konsolenfehler.
