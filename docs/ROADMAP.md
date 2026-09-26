# docs/ROADMAP.md — Audit- und Produkt-Roadmap

## Zweck

Diese Roadmap ist die einzige aktive Reihenfolge für Produkt- und Technikarbeit. Sie trennt den belegten Ist-Stand von der geplanten Zielarchitektur und verhindert, dass unimplementierte Systeme als bereits vorhanden behandelt werden.

## Statusupdate — 2026-09-26

T1.2 (Ende-zu-Ende-Abnahme der Tag/Nacht/Raid-Schleife) ist abgeschlossen: `packages/client/src/village/` besitzt den DayNightState-Store als einzigen Phase-Owner, die Shell schaltet Tag (Dorf-Basisdaten), Nacht (aktiver Editor), Raid (lokaler Fixture-Lauf) und Ergebnis (TerminalRaidJob mit Tagesabschluss oder Retry), und der Loop wurde im Browser durchgeklickt — Tag 18 → Nacht → Raid → Ergebnis `fixture-raid-1` → Tag 19. `test/day-night-loop.test.ts` führt den vollen Loop mit Fake-Timern in unter 5 s aus, `test/village-phase.test.ts` pinnt Übergänge und Skip-Verbot. Der Editor bleibt in Nacht und Raid aktiv, damit eine blockierte Route vor dem Retry reparierbar ist.

Die aktive Tabelle führt ausschließlich offene Blöcke und ist lückenlos durchnummeriert. Abgeschlossene Blöcke stehen mit ihren historischen Nummern unter `docs/historisch/` und tauchen in der aktiven Tabelle nicht mehr auf.

Der Trail-Hash ist erledigt und deshalb aus der Tabelle gestrichen: `packages/contracts/src/trail.ts` und `CombatLog.trail` plus `CombatTrailEntrySchema`, `packages/sim-core/src/combat/{fingerprint,resolve,simulate,replay}` tragen `x/y/cell` jeder Pfadzelle in den Hash, `sim_version 0.0.1→0.0.2`, `CONTRACT_VERSION 2→3`, der gepinnte Test `raid-job.test.ts` ist von `toBe` auf `not.toBe` gedreht.

Nachtrag: Die visuelle Basis ist im Browser lauffähig (`pnpm --filter @floor/client dev`). Die Szene rechnet einen lokalen Fixture-Lauf aus `resolveSnapshotRaid` und entscheidet nichts. Der Hash sieht seit dem Trail-Hash den vollen Trail; gleich lange Umwege liefern jetzt unterschiedliche Werte. `docs/CONCEPT_REVIEW.md` steht auf ODT-Stand; KI-Vorschläge sind als `[K]` markiert.

## Audit-Snapshot — 2026-09-25

### Grün

- `pnpm run -s typecheck` bestanden.
- `pnpm test -- --run` bestanden: 23 Testdateien, 122 Tests (Client, Contracts, Server, Core).
- `pnpm run -s check` bestanden: LOC, Hygiene und alle Shinon-Gates.
- `pnpm audit --prod --json | jq` meldet keine bekannten Schwachstellen.
- Grid, Contracts (v3), D1-Raid-Freeze, Combat-, Hash- und Replay-Core sowie der lokale Fixture-Auftrag sind durch Tests abgedeckt.

### Befunde mit Priorität

- **P1 — Trail-Hash erledigt:** Aus dem 64×64-Grid fließt seit dem Trail-Hash der vollständige Trail (Koordinate plus Zelltyp je Schritt) in den Kampf-Hash; gleich lange Routen unterscheiden sich.
- **P1 — Client ohne echten Spielfluss:** Visuelle Basis steht (Pixi, World, Kamera, Depth, Occlusion, Actors, FX, Observer, Window-Runtime, Showcase), die Tag/Nacht/Raid-Schleife läuft als lokaler Fixture-Loop, aber weder Storage noch Net noch servergebundenes Raid-Playback sind vorhanden. Showcase rechnet nur lokal.
- **P1 — Kein vollständiger Raid-Flow:** HTTP, Auth, Queue, Matching, Ghost und Ergebniskonsequenzen fehlen; Core, Contract, lokale Fixture-Ausführung und die geschlossene Tag/Nacht-Schleife stehen.
- **P2 — Dokumentationsabstand:** Funktionsgraph und Architektur mischen Ziel und Ist-Stand. Bei jedem Arbeitspaket strikt trennen.
- **P2 — Testabdeckung:** Contracts, Grid, D1 und Replay-Determinismus abgedeckt, nicht Client-Verhalten, E2E-Raids oder Netzfehler.

## Prioritätsregel

- **T1 ist exklusiv:** Während T1 läuft, wird kein T2- oder T3-Feature begonnen.
- **Nach T1:** T2 wird zu T1 und T3 wird zu T2. Die Roadmap wird unmittelbar nach dem Abschluss von T1 neu priorisiert. Die Abschnittsüberschriften T2 und T3 bezeichnen weiterhin den Inhalt, nicht die Zielnummer.
- Nach jedem Arbeitspaket werden Status, Evidenz, offene Punkte und Folgeschritte in dieser Datei aktualisiert.
- Ein Statuswechsel ist erst nach grünem `pnpm run -s typecheck`, `pnpm test -- --run`, `pnpm run -s lint` und `pnpm run -s check` zulässig.
- Neue Erkenntnisse werden nicht nur hier, sondern auch im betroffenen Domain-Changelog dokumentiert.

## T1 — Spielbarer Kern und reproduzierbarer Raid-Loop

**Ziel:** Ein Nutzer kann eine kleine Welt öffnen, einen Dungeon bauen, einen deterministischen Raid auslösen, das Ergebnis ansehen und eine verständliche Konsequenz sehen.

| ID | Ergebnis | Abhängigkeit | Fertig, wenn |
|----|----------|--------------|---------------|
| T1.1 | Raid-Playback mit Timeline, Routen-/Fallenereignissen und Schlussfolgen | — | ✅ Erledigt 2026-09-26 — Commit `c52c46c`; `timeline-model.ts` zerlegt den Log in `route`/`combat`/`result`, `playback.ts` hält Log und Scrubber-Tick als Signale, `phases.tsx` zeigt Trail-Zellen mit Falle-, Spawn- und Boss-Markierung, Ereigniscluster und Ergebnis-Karte. Zwei Testdateien (211 und 82 LOC) |
| T1.2 | Ende-zu-Ende-Abnahme der Tag-/Nacht-/Raid-Schleife | T1.1 | ✅ Erledigt 2026-09-26 — Fixture-Loop läuft in unter fünf Minuten (im Test unter 5 s) und die Schleife ist im Browser abgenommen |

**T1-Definition of Done:** Keine unbeabsichtigte Core-Lücke, keine nicht versionierte Payload, keine Cliententscheidung über den Raid-Ausgang, reproduzierbarer Fixture-Seed und ein dokumentierter lokaler Playback.

## T2 — Alltagstiefe nach T1

Diese Arbeit wird erst nach Abschluss von T1 zu T1 promoted und anschließend einzeln abgearbeitet. Mit dem Abschluss von T1.1 und T1.2 ist diese Bedingung erfüllt; T2 ist damit der aktive Bereich.

- Dorfwirtschaft mit Arbeitern, Attraktivität und Materialbedarf.
- Inventar, Ausrüstung und sichtbare Phantom-Loot-Umsetzung.
- Zucht, Generationen, Mutationen und reproduzierbare Stammbäume.
- Persistenter lokaler Spielstand und echter asynchroner Job-Status.
- Erweiterte Taktiken mit sichtbaren Regeln und Risikoauswirkung.

## T3 — Systemische Erweiterung nach T2

Diese Arbeit wird nach Abschluss von T2 zu T2 promoted. Sie startet nicht parallel zum ersten T2-Block.

- MMR-Matching mit noch offenem Stärkeband und Ghost-Fallback (KI-Vorschlag, siehe `docs/CONCEPT_REVIEW.md`).
- Vollständige Queue-, Reconnect-, Retry- und Timeout-Semantik.
- Autorisierte Endpunkte, Rate-Limits, Audit-Log und Missbrauchserkennung.
- PWA-Installierbarkeit, Offline-Editor-Stand und produktionsfähige Deployment-Konfiguration.
- Seed-/Build-Teilen und Replay-Inspektion ohne Live-Matchmaking.

## Nächster konkreter Schritt

T1.1 und T1.2 sind abgeschlossen; damit ist T1 geschlossen und T2 wird nach der Prioritätsregel zu T1 promoted. Als erster T2-Block bietet sich die Dorfwirtschaft an, weil das Tag-Panel bereits Gold, Material, Arbeiter und Attraktivität aus den Fixture-Daten liest und damit eine sichtbare Datengrundlage hat. Der Foundation-Audit bleibt gültig: 0 CRLF über `.gitattributes` erzwungen, PackageManager-Widerspruch beseitigt, Lockfile bereinigt. Vor dem Start ist der im Abschnitt „Offene Prüfpunkte“ genannte T2-1-Branch zu klären, damit nicht parallel zum ersten Block gearbeitet wird.

## Offene Prüfpunkte aus dem Befund-Review vom 2026-09-26

Diese Punkte stammen aus einer reinen Lese- und Mess-Session. Sie sind **keine** Spielregelentscheidungen und gehören nicht automatisch zum nächsten Block; die Zuordnung ist beim Start des jeweiligen Blocks zu treffen.

- **Kandidat gegen T1-Exklusivität:** `origin/feat/dorfwirtschaft-t2-1` existiert als Remote-Branch, obwohl Dorfwirtschaft ein T2-Block ist. Ob der Branch Arbeit enthält oder ein Altstand ist, ist ohne Sicht auf seinen Inhalt nicht entscheidbar und gehört vor dem Start des T2-Blocks geklärt.
- **Idempotenz-Testlücke:** Der Fall „abgeschlossener Job plus Wiederholung mit gleichem `idempotencyKey`" ist in `raid-commit.test.ts` ungedeckt. Gemessen wurde: Rückgabe mit identischem `result_json` und unveränderter Revision, `IDEMPOTENCY_CONFLICT` bei abweichendem Payload und bei fremdem Angreifer.
- **Sweep am Commit-Pfad:** Der Expire-Sweep hängt an `commitRaid` statt an einem Cron. Ein Job, den niemand wiederholt, bleibt unbegrenzt `accepted`. Gehört zur Queue-Semantik in T3.
- **Hash-Semantik:** `CombatHashSchema` ist formstreng, aber bindet nicht, worüber der Hash gebildet wurde. Eine semantische Bindung wäre robuster als die heutige indirekte Trage durch `sim_version` und `CONTRACT_VERSION`. Relevant, sobald der Hash als Inhaltsadresse dienen soll; für die aktuelle Replay-Prüfung ist die Breite ausreichend.
- **Nicht beantwortet:** Die Byte-Determinismus-Annahme hinter dem `payloadJson`-Vergleich in `raid-commit.ts` wurde nicht abschließend geprüft. Offen bleibt, ob Zod die Shape-Reihenfolge oder die Eingabereihenfolge der Keys im Ausgabeobjekt wahrt und wie `undefined` sowie Zahlformate dort wirken.

## Pflegeprotokoll

Bei jedem Arbeitspaket drei Dinge aktualisieren: den Status dieser Roadmap, den betroffenen `docs/CHANGELOG.md` und bei neuen oder entfernten Komponenten den jeweiligen `REPOINDEX.md`. Danach Check-Befehle ausführen und Abweichungen als offenen T1/T2/T3-Punkt eintragen, nicht stillschweigend verschieben.
