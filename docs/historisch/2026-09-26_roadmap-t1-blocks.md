# docs/historisch/2026-09-26_roadmap-t1-blocks.md — Abgeschlossene T1-Blöcke (Playback und Abnahme)

Abgelegt aus `docs/ROADMAP.md` am 2026-09-27. Die Zeilen standen bis dahin als einzige erledigte Einträge in der aktiven Tabelle; die Roadmap führt seither nur noch offene Blöcke.

## T1.1 — Raid-Playback mit Timeline, Routen-/Fallenereignissen und Schlussfolgen

Erledigt 2026-09-26 — Commit `c52c46c`; `timeline-model.ts` zerlegt den Log in `route`/`combat`/`result`, `playback.ts` hält Log und Scrubber-Tick als Signale, `phases.tsx` zeigt Trail-Zellen mit Falle-, Spawn- und Boss-Markierung, Ereigniscluster und Ergebnis-Karte. Zwei Testdateien mit 167 und 121 Code-Zeilen (`test/raid-timeline.test.ts`, `test/raid-playback-wiring.test.ts`); die LOC sind der Stand vom 2026-09-27, weil beide Dateien beim Typecheck-Nachgang angefasst wurden.

## T1.2 — Ende-zu-Ende-Abnahme der Tag-/Nacht-/Raid-Schleife

Erledigt 2026-09-26, Abhängigkeit T1.1. Der Fixture-Loop läuft in unter fünf Minuten (im Test unter 5 s) und die Schleife ist im Browser abgenommen — Tag 18 → Nacht → Raid → Ergebnis `fixture-raid-1` → Tag 19.
