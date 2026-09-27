# docs/ROADMAP.md — Audit- und Produkt-Roadmap

## Zweck

Diese Roadmap ist die einzige aktive Reihenfolge für Produkt- und Technikarbeit. Sie trennt den belegten Ist-Stand von der geplanten Zielarchitektur und verhindert, dass unimplementierte Systeme als bereits vorhanden behandelt werden.

## Statusupdate — 2026-09-26 (zweiter Eintrag)

Ein Korrekturblock an der Client-Oberfläche ist gelaufen, der **kein neues Feature-Track** ist: Der Client hatte kein Dorf, sondern eine Label-Wert-Liste mit vier Fixture-Zahlen, zeigte in jeder Phase das Dungeon-Raster im Viewport und führte Debug-Rückmeldung mit Rohkoordinaten in der Sidebar. `village/settlement.ts` leitet den Dorfblick jetzt als reine Funktion aus Phase-Owner und Fixture ab, `ui/view.ts` führt den Blick `village | dungeon` getrennt von der Spielphase, die Shell ist nur noch Layout, und `ui/styles.css` ist durch acht Style-Module auf gemeinsamen Tokens ersetzt.

Ausdrücklich **nicht** angefasst wurde die Dorfwirtschaft: Arbeiterverteilung, Gold- und Materialausgaben, Landkauf und Verkauf der Nachtbeute bleiben T2, weil T1.1 noch in einem eigenen Branch läuft und T1 exklusiv ist. Der Dorfblick zeigt deshalb nur, was die Schleife kennt — Tag, Gilde, Verteidigerplätze, Ergebnis der letzten Nacht. Die Startbasis aus `fixture.workers` und `fixture.attractiveness` ist in der Oberfläche als Startbasis gekennzeichnet und nicht als veränderlich dargestellt. `test/village-settlement.test.ts` und `test/stage-view.test.ts` sind neu.

**Offen:** Die Browser-Abnahme steht aus. In der Arbeitsumgebung waren weder Chrome noch ein DOM-Testsetup verfügbar, die neue Oberfläche ist also nicht am Bildschirm gesehen worden. Vor dem nächsten Statuswechsel gehört sie im Browser durchgeklickt.

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
- **P1 — Client ohne echten Spielfluss:** Visuelle Basis steht (Pixi, World, Kamera, Depth, Occlusion, Actors, FX, Observer, Window-Runtime, Showcase), die Tag/Nacht/Raid-Schleife läuft als lokaler Fixture-Loop, aber weder Storage noch Net noch servergebundenes Raid-Playback sind vorhanden. Showcase rechnet nur lokal. Das Dorf ist seit dem Korrekturblock als Ort sichtbar, aber ohne Wirtschaft: es gibt keine Arbeiterverteilung, keine Ausgaben und keinen Beute-Verkauf.
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

## T2 — Alltagstiefe und Visual-Epic nach T1

T1.1 und T1.2 sind abgeschlossen. Auf ausdrücklichen Auftrag hat das serielle Visual-/Expeditions-Epic Vorrang vor der zuvor vorgeschlagenen Dorfwirtschaft. Es startet kein zweiter Feature-Slice parallel. Verbindliche Regeln, `[K]`-Grenzen und Abhängigkeiten stehen in `docs/VISUAL_GRUNDSATZ.md`.

| ID | Ergebnis | Abhängigkeit | LOC ca. | Fertig, wenn |
|----|----------|--------------|---------|---------------|
| T2.1 | Ressourcenicons, Pixel-Art-Loader mit Fallback, Dorf-/Editor-/Raid-Renderer-Modi | T1.2, Visual-Grundsatz E1–E6 | 280–430 | Nur Gold/Material aus Quelle; ein Dungeon-Grid; Editor flach, Raid atmosphärisch; Tastaturzugang; fehlende Assets crashen nicht |
| T2.2 | 10×10-Dorf, Platzierung/Upgrade von Häusern und Werkstätten, horizontales Land, Rückkehrabrechnung/Toast | T2.1, ausdrückliche Balancefreigabe | 320–500 | Einziger Dorf-Owner, keine Überlappung/Überziehung, Werkstattertrag und Tagesabrechnung deterministisch und höchstens einmal pro Expedition |
| T2.3 | Expedition über mehrere Etagen, Boss-Aussteigen/Weitergehen, Escrow für ungesicherte Beute | T2.2, Kostenfreigabe | 300–470 | Derselbe eingefrorene Verteidiger, Etagen separat geprüft; Etage 2+ null bis fünf gekaufte Slots; quadratische Kosten ohne künstliches Etagenlimit |
| T2.4 | Deterministische Klassenfähigkeiten als Simulationsinputs und Replay-Events | T2.3, Contract-/Hash-Entwurf | 440–680 | Heal/Buff/Direktschaden am nächsten ganzzahligen Tick, je Held einmal pro Expedition; gleicher Snapshot/Seed/Input ergibt identischen Hash; Contract v4 und Sim-Version abgestimmt |
| T2.5 | 9 Inventarplätze, Unique-Slots, seeded Bossdrops, Duplikatschutz und vorgemerkter Drop | T2.4, Drop-Balancefreigabe | 230–390 | Drop kann nicht dupliziert oder durch volles Inventar verloren werden; Unique-Aktionen bleiben bis Folgefreigabe inaktiv |
| T2.6 | Browser- und Spielzug-Abnahme von T2.1–T2.5 | T2.1–T2.5 | 100–180 | Accessibility, Asset-Fallback, Stadtbau, Ausstieg/Niederlage und Einmalabrechnung im Browser geprüft; passende Gates grün |

## T3 — Autorität und asynchroner Multiplayer

T3 startet erst nach dem seriellen T2-Track. Online-Belohnungen und persistierter Fortschritt bleiben gesperrt, bis Authentifizierung und Replay-Prüfung vollständig durchgesetzt sind.

| ID | Ergebnis | Abhängigkeit | LOC ca. | Fertig, wenn |
|----|----------|--------------|---------|---------------|
| T3.1 | Firebase Google-/E-Mail-Auth und isolierte Dev-Umgebung samt Dev-Wipe-Sperre | T2.5, Firebase-Projektwerte durch Nutzer | 300–460 | Firebase-UID ist Identität; falsche Claims und clientgewählte UID werden verworfen; Wipe ausschließlich in isolierter Dev-Datenbank |
| T3.2 | Profil-/Stadt-/Run-Persistenz und serverseitiges Replay-/Belohnungs-Gate | T3.1, lokale D1-Migrationstests | 420–670 | Server replayt Freeze, Seed und Input vor jedem atomaren Reward-Commit; Retry ist idempotent; fremde Identität/Manipulation bringt keinen Fortschritt |
| T3.3 | Pool, fremde Zielauswahl, Self-Match-Sperre und deterministischer Ghost-Fallback | T3.2, Match-Balancefreigabe | 300–510 | Ziel bleibt während der Expedition unverändert; Selbstmatch unmöglich; leerer Pool ergibt reproduzierbaren Ghost; MMR-Band nicht erraten |
| T3.4 | Ende-zu-Ende-/Betriebsabnahme für Auth, Persistenz und Multiplayer | T3.1–T3.3 | 100–180 | Emulator-/Testdaten, Security-Fälle und vollständige Gates grün; echte Cloud-/D1-Provisionierung bleibt separat freigegeben |

## Nächster konkreter Schritt

S0 (A0 + G) ist mit `docs/VISUAL_GRUNDSATZ.md` schriftlich angelegt. Danach läuft T2.1 als erster Implementierungsslice. Die in `docs/VISUAL_GRUNDSATZ.md` benannten Kosten-, Ertrags-, Drop- und MMR-Zahlen brauchen jeweils ihre ausdrückliche Freigabe vor dem dazugehörigen Verhalten. Jeder Slice wird einzeln geprüft, dokumentiert und gegatet; es gibt keine Parallelimplementierung.
## Offene Prüfpunkte aus dem Befund-Review vom 2026-09-26

Diese Punkte stammen aus einer reinen Lese- und Mess-Session. Sie sind **keine** Spielregelentscheidungen und gehören nicht automatisch zum nächsten Block; die Zuordnung ist beim Start des jeweiligen Blocks zu treffen.

- **Kandidat gegen T1-Exklusivität — geklärt am 2026-09-26:** `origin/feat/dorfwirtschaft-t2-1` enthält echte, testgedeckte Arbeit (`settlement.ts`, `economy.ts`, `treasury.ts`, `loot.ts`, `buildings.ts` sowie `village-economy.test.ts`; hundertsechsundsechzig gegen hundertvierundfünfzig Tests auf `main`). Der Einwand ist gegenstandslos, seit T2 nach der Prioritätsregel der aktive Bereich ist. Der Branch liegt aber fünf Commits zurück und über zwei Toolchain-Migrationen hinweg, deshalb ist er rot, sobald er allein geprüft wird: `tsconfig.json(19,5) TS5101 baseUrl` und der `engine-slicing`-Test unter dem Vitest-5-Default, weil `vitest.config.ts` fehlt. Das ist Drift, kein Defekt der Dorfwirtschaft, und die Lösung ist ein Rebase auf aktuellen `main`, kein Merge. Derselbe Driftbefund gilt für `origin/fix/panels-copy-70b02fb`, das zusätzlich in der neuen `Sidebar` die `RaidTimeline` verliert und den Editor von `editing` auf `editing && dungeon` umstellt. Beides sind Entscheidungen, keine Konfliktauflösungen, und gehören vor dem Start des T2-Blocks ausdrücklich entschieden.
- **Idempotenz-Testlücke:** Der Fall „abgeschlossener Job plus Wiederholung mit gleichem `idempotencyKey`" ist in `raid-checkpoint.test.ts` ungedeckt. Gemessen wurde: Rückgabe mit identischem `result_json` und unveränderter Revision, `IDEMPOTENCY_CONFLICT` bei abweichendem Payload und bei fremdem Angreifer.
- **Sweep am Checkpoint-Pfad:** Der Expire-Sweep hängt an `checkpointRaid` statt an einem Cron. Ein Job, den niemand wiederholt, bleibt unbegrenzt `accepted`. Gehört zur Queue-Semantik in T3.
- **Hash-Semantik:** `CombatHashSchema` ist formstreng, aber bindet nicht, worüber der Hash gebildet wurde. Eine semantische Bindung wäre robuster als die heutige indirekte Trage durch `sim_version` und `CONTRACT_VERSION`. Relevant, sobald der Hash als Inhaltsadresse dienen soll; für die aktuelle Replay-Prüfung ist die Breite ausreichend.
- **Nicht beantwortet:** Die Byte-Determinismus-Annahme hinter dem `payloadJson`-Vergleich in `raid-checkpoint.ts` wurde nicht abschließend geprüft. Offen bleibt, ob Zod die Shape-Reihenfolge oder die Eingabereihenfolge der Keys im Ausgabeobjekt wahrt und wie `undefined` sowie Zahlformate dort wirken.
- **Tageslicht-Klasse nach dem UI-Rebase:** `main` band die Tagesphase über `app is-day` an die Shell. Die neue Shell kennt bewusst keine Phase und führt die Klasse nicht mehr; die Sidebar, in die die Tagesstimmung wandern könnte, ist mit dem Dashboard-Abbau vom 2026-09-27 entfallen. Ob die Tagesstimmung in die Topbar oder in die Dorfszene wandert oder entfällt, ist weiterhin eine Design-Entscheidung und ausdrücklich offen; die Regel `.app.is-day` und `.app.is-night` liegt in `ui/styles/` ungenutzt bereit.

## Pflegeprotokoll

Bei jedem Arbeitspaket drei Dinge aktualisieren: den Status dieser Roadmap, den betroffenen `docs/CHANGELOG.md` und bei neuen oder entfernten Komponenten den jeweiligen `REPOINDEX.md`. Danach Check-Befehle ausführen und Abweichungen als offenen T1/T2/T3-Punkt eintragen, nicht stillschweigend verschieben.
