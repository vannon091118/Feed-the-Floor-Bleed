# docs/ROADMAP.md — Audit- und Produkt-Roadmap

## Zweck

Diese Roadmap ist die einzige aktive Reihenfolge für Produkt- und Technikarbeit. Sie trennt den belegten Ist-Stand von der geplanten Zielarchitektur und verhindert, dass unimplementierte Systeme als bereits vorhanden behandelt werden.

## Statusupdate — 2026-09-28 (Branch-Entscheidung gefallen, T2.2 teilweise blockiert)

**Die Branch-Entscheidung ist entschieden, und zwar durch den Ist-Stand.** Der Prüfpunkt unten („Kandidat gegen T1-Exklusivität“) verlangte, `origin/feat/dorfwirtschaft-t2-1` und `origin/fix/panels-copy-70b02fb` vor dem Start des T2-Blocks ausdrücklich zu entscheiden. Gemessen: beide Branches existieren nicht mehr, `git branch -a` führt nur `main`, `origin/main` und `origin/freebuff/thread-2da5b5e2`. Damit ist die Entscheidung nicht offen, sondern durch den Zustand gefallen: Es gibt nichts zu rebasen und nichts zu mergen. Die Dorfwirtschaft liegt als annotierter Tag `t2-1-dorfwirtschaft` (2 Commits `9fdfec5`, `70b02fb`, 57 Dateien) vor; dessen Tag-Text sagt ausdrücklich „War nie in main und ist nicht mergebar; der Block wird nach dem visuellen Refactoring neu aufgebaut." Der Tag ist damit der erreichbare, aber nicht zusammenführbare Beleg — Lesestoff, kein Arbeitsauftrag. Dass `ui/sidebar.tsx` auf `main` nicht existiert, bestätigt denselben Stand von der Code-Seite: der Sidebar-Teil des Panels-Branches ist mit dem Dashboard-Abbau bereits erledigt. Und das zweite strittige Detail, das der Panels-Branch am Editor änderte, ist als `packages/client/src/ui/window-launcher.tsx:53` (`{editing && view === 'dungeon' && (`) bereits auf `main` — der Editor-Launcher ist dungeon-gebunden, genau die Entscheidung, die der Branch offenließ.

**T2.2 ist zur Hälfte blockiert, und der Blocker ist nicht weggeräumt.** `docs/VISUAL_GRUNDSATZ.md:45` verbietet vor dem ersten Wirtschafts-, Slot-, Loot- oder Matching-Verhaltenscode die konkrete Beispieltabelle, „vom Auftraggeber freigegeben". Offen `[K]` sind dort: Startbestand, Bau-/Upgrade-/Landkosten, Attraktivitäts-/Arbeiterwirkung, Werkstatt-Ertrag, Stärke-/Generations-Goldformel, Unique-Pool und Roll-Gewichte, `floorBase`, `slotBase`, Match-Stärkewert/-band. Für T2.2 konkret heißt das: **Kosten (Bau/Upgrade/Land), Ertrag je Werkstatt, Startbestand und die Beträge der Tagesabrechnung sind ungefreigegeben und unangetastet.** Die Tabelle führt T2.2 deshalb unverändert mit der Abhängigkeit „T2.1, ausdrückliche Balancefreigabe" — sie ist nicht erfüllt. Nachfragen ist keine Freigabe: Der Auftraggeber wurde um die Zahlen gebeten und hat die Frage abgewendet; ein abgewendeter Frage folgt keine stillschweigende Annahme, sonst wäre die Grenze aus `VISUAL_GRUNDSATZ.md:45` wirkungslos. Eine Freigabe ist eine ausdrückliche Aussage mit Zahlen, sonst gilt weiterhin das Verbot.

**Was ohne Freigabe gebaut werden darf — der erlaubte Teilscope.** `VISUAL_GRUNDSATZ.md:45` lässt genau drei Dinge zu: schemafreie Visuals, reine Funktionen mit explizit übergebenen Parametern, und Tests ihrer Invarianten — „es gibt keine impliziten Standardwerte". Für T2.2 heißt das: die 10×10-**Platzierungsgeometrie** (keine Überlappung, keine Überziehung, Kantenklemmung, Nachbarschaft) als reine Funktion mit explizit übergebenen Parametern, ihre Invarianten getestet, dazu schemafreie Dorfdarstellung ohne jede Zahl aus dem Panel. Die **Wirtschaftshälfte** — Ausgaben, Erträge, Startbestand, Tagesabrechnungsbeträge — bleibt bis zur Freigabe unangetastet, im Code wie in der Doku. Der Block ist damit 🚧 geplant und teilweise gebaut-fähig, nicht erledigt; „Fertig, wenn" verlangt Werkstattertrag und Tagesabrechnung, also mehr, als ohne Freigabe entsteht.

## Statusupdate — 2026-09-27 (T2.1 abgeschlossen: Tastaturzugang)

Der letzte offene Punkt aus T2.1 ist gebaut. Bedienbar war bisher alles nur mit dem Zeiger: der Client hatte kein `keydown`, kein `tabIndex` und kein `onKey`. Jetzt ist der Fensterrahmen fokussierbar und wandert mit den Pfeiltasten, Umschalt skaliert mit denselben Mindestgrößen wie der Resize-Griff, und der Fensterrumpf ist ein eigener Fokuspunkt, damit dieselben Pfeiltasten den Inhalt scrollen statt das Fenster zu ziehen. Die Weltansicht trägt `role="application"` mit dem Tastenhinweis im Namen; ihre Kamera schwenkt in Dorf und Dungeon über `render/camera-keys.ts` und zoomt mit `+`/`-`. Die Schrittweite gilt vor dem Zoom, `panCamera` teilt sie durch ihn hindurch. Die Steuerungslegende nennt beide Tastensätze aus ihren Ownern statt als zweiten Text.

Im Browser belegt: das Dorf schwenkt mit drei Pfeiltasten und kehrt mit drei Gegentasten ins gleiche Bild zurück, `=` vergrößert es sichtbar, der Fensterrahmen wanderte von `left: 0` auf `16px` und `top: 82px` auf `98px`, Umschalt-Pfeile änderten die Breite von 354 auf 378 und die Höhe von 241 auf 265, und mit dem Rumpf im Fokus stieg dessen `scrollTop` auf 23 bei unveränderter Fensterlage. Durchgehend ein Canvas, keine Konsolmeldungen.

Zwei Beobachtungen gehören dazu, weil sie sonst als Fehler gelesen werden: Ein Fenster, das breiter ist als das Sichtfeld, bleibt an der linken Kante kleben — das ist die dokumentierte Kopfklemme, sie greift genauso beim Zeiger. Und im Dungeon bewegt der Tastenschritt erst oberhalb der Rahmungs-Zoomstufe, weil die 1024 Pixel breite Welt den Viewport füllt und `clampCamera` die Kamera dann auf der Mitte hält; der Zeigerpfad verhält sich identisch. Der dritte: Fensterbewegung und -größe gelten ab 721 px Breite. Darunter pinnt `ui/styles/windows.css` die Geometrie mit `!important` an die untere Kante — die Karte ist dort eine Schublade und soll bedienbar bleiben, statt über den Rand zu laufen. Diese Anordnung ist dann die alleinige Autorität: `SHEET_MAX_WIDTH` in `window/drag.ts` lässt dort weder Tastenschritt noch Zeigergeste beginnen, und Griff- sowie Skalierzeiger sind im Stylesheet stillgelegt, damit nichts eine Bewegung anbietet, die es nicht gibt. Der vierte: die Abbildung Pfeiltaste → Richtung liegt seit dem 2026-09-28 einmal in `input/arrows.ts`; Fensterrahmen und Kamera fragen sie und rechnen mit ihrer eigenen Schrittweite, die Inhalt-Grenze des Rahmens ist in `test/keyboard-wiring.test.ts` gepinnt.

## Statusupdate — 2026-09-27 (Tagesstimmung entschieden)

Der offene Punkt „Tageslicht-Klasse nach dem UI-Rebase“ ist entschieden und umgesetzt: die Tagesstimmung hängt wieder an der Shell, die Palette selbst liegt seither bei den Präsentationsdeskriptoren in `visual/daylight.ts` und wird von der Shell als Inline-Hintergrund auf den Überzug gesetzt; `ui/styles/shell.css` hält nur dessen Fläche, Lage und Übergang. `test/daylight.test.ts` bindet den Deskriptor an die Phasen-Union und das Stylesheet an den Klassennamen. Die frühere Notiz, die Regeln lägen in `ui/styles/` ungenutzt bereit, war falsch — der Umbau hatte sie mit `styles.css` entfernt; sie sind neu geschrieben. Der Punkt ist aus der Liste der offenen Prüfpunkte gestrichen.

Die Tönung ist im Browser abgenommen: der Überzug folgt der Phase über `tag`, `night`, `raid` und `result`, der Dorfblick wird sichtbar dunkler und kühler.

Nachgezogen am 2026-09-28: Der Wechsel war trotzdem ein Sprung, weil `transition: background` keinen Gradienten interpoliert — Chromium tauscht ihn aus. Der Überzug ist deshalb jetzt ein Stapel aus vier Ebenen, von denen genau eine sichtbar ist; den Wechsel trägt die Deckkraft, und gemessen laufen dabei genau zwei Übergänge. Ein Wechsel mitten in einer laufenden Blende ließ die Deckkraftsumme zunächst auf 0,49 fallen; die Startwerte rechnet seither `daylightFadeStarts` komplementär, und im Dauerfeuer über 29 Schleifendurchläufe hält die Summe bei 1,000. Offen bleibt daraus nur der Tastaturzugang, den T2.1 unter `Fertig, wenn` führt.

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
- `pnpm test -- --run` bestanden: 23 Testdateien, 122 Tests (Client, Contracts, Server, Core). Die Zahlen sind die Momentaufnahme dieses Tages und werden hier bewusst nicht nachgeführt; maßgeblich ist der Gate-Lauf auf dem jeweiligen Stand.
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

T1 ist abgeschlossen. Die beiden erledigten Zeilen standen bis zuletzt als einzige ✅-Zeilen in der aktiven Tabelle und liegen jetzt mit ihrem Abnahme-Beleg in `docs/historisch/2026-09-26_roadmap-t1-blocks.md`, damit die aktive Tabelle nur noch offene Blöcke führt.

**T1-Definition of Done:** Keine unbeabsichtigte Core-Lücke, keine nicht versionierte Payload, keine Cliententscheidung über den Raid-Ausgang, reproduzierbarer Fixture-Seed und ein dokumentierter lokaler Playback.

## T2 — Alltagstiefe und Visual-Epic nach T1

T1.1 und T1.2 sind abgeschlossen. Auf ausdrücklichen Auftrag hat das serielle Visual-/Expeditions-Epic Vorrang vor der zuvor vorgeschlagenen Dorfwirtschaft. Es startet kein zweiter Feature-Slice parallel. Verbindliche Regeln, `[K]`-Grenzen und Abhängigkeiten stehen in `docs/VISUAL_GRUNDSATZ.md`.

**T2.1 ist abgeschlossen:** Ressourcenicons, Asset-Loader mit prozeduralem Fallback, die drei Render-Modi und der Tastaturzugang sind implementiert und im Browser belegt. Die Zeile liegt mit ihrem Abnahme-Beleg in `docs/historisch/2026-09-27_roadmap-t2-1.md`, damit die aktive Tabelle nur offene Blöcke führt. Die übergreifende Browser- und Spielzug-Abnahme von T2.1–T2.5 bleibt bei T2.6.

| ID | Ergebnis | Abhängigkeit | LOC ca. | Fertig, wenn |
|----|----------|--------------|---------|---------------|
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

S0 (A0 + G) ist mit `docs/VISUAL_GRUNDSATZ.md` schriftlich angelegt, T2.1 ist abgeschlossen (Icons, Asset-Loader mit Fallback, drei Render-Modi, Tastaturzugang; Beleg in `docs/historisch/2026-09-27_roadmap-t2-1.md`). T2.2 ist der nächste Block, aber **nicht als Ganzes implementierbar**: Seine Abhängigkeit „ausdrückliche Balancefreigabe" ist nicht erfüllt, und `docs/VISUAL_GRUNDSATZ.md:45` verbietet den Wirtschafts-, Slot-, Loot- und Matching-Code bis dahin. Eine abgewendete Frage nach den Zahlen ist keine Freigabe; gefreigegeben sind bislang nur — mangels — Null Zahlen. Gebaut werden darf deshalb genau der erlaubte Teilscope: die 10×10-Platzierungsgeometrie als reine Funktion mit explizit übergebenen Parametern samt Invariantentests (keine Überlappung, keine Überziehung, Kantenklemmung) und schemafreie Dorfdarstellung ohne Zahlen im Panel. **Unangetastet bleiben bis zur ausdrücklichen Freigabe:** Bau-, Upgrade- und Landkosten, Werkstattertrag, Startbestand sowie die Beträge der Tagesabrechnung. Die Zahlen aus `docs/VISUAL_GRUNDSATZ.md:45` brauchen je Block ihre ausdrückliche Freigabe vor dem dazugehörigen Verhalten. Jeder Slice wird einzeln geprüft, dokumentiert und gegatet; es gibt keine Parallelimplementierung.
## Offene Prüfpunkte aus dem Befund-Review vom 2026-09-26

Diese Punkte stammen aus einer reinen Lese- und Mess-Session. Sie sind **keine** Spielregelentscheidungen und gehören nicht automatisch zum nächsten Block; die Zuordnung ist beim Start des jeweiligen Blocks zu treffen.

- **Kandidat gegen T1-Exklusivität — geklärt am 2026-09-26, entschieden am 2026-09-28:** Am 2026-09-26 trug `origin/feat/dorfwirtschaft-t2-1` echte, testgedeckte Arbeit (`settlement.ts`, `economy.ts`, `treasury.ts`, `loot.ts`, `buildings.ts` sowie `village-economy.test.ts`; hundertsechsundsechzig gegen hundertvierundfünfzig Tests auf `main`) und lag fünf Commits sowie zwei Toolchain-Migrationen hinter `main`, also rot: `tsconfig.json(19,5) TS5101 baseUrl` und der `engine-slicing`-Test unter dem Vitest-5-Default, weil `vitest.config.ts` fehlt. Für `origin/fix/panels-copy-70b02fb` galt derselbe Driftbefund. **Beides ist gegenstandslos:** Die beiden Branches existieren nicht mehr, die Dorfwirtschaft liegt als nicht mergebarer Tag `t2-1-dorfwirtschaft` vor und wird nach dem visuellen Refactoring neu aufgebaut, `ui/sidebar.tsx` ist auf `main` entfallen, und der Editor-Gate aus dem Panels-Branch (`editing` → `editing && view === 'dungeon'`) ist mit `ui/window-launcher.tsx:53` bereits auf `main`. Ein Rebase oder Merge ist nicht mehr möglich und steht nicht mehr an; Belege im Statusupdate vom 2026-09-28 oben.
- **Idempotenz-Testlücke:** Der Fall „abgeschlossener Job plus Wiederholung mit gleichem `idempotencyKey`" ist in `raid-checkpoint.test.ts` ungedeckt. Gemessen wurde: Rückgabe mit identischem `result_json` und unveränderter Revision, `IDEMPOTENCY_CONFLICT` bei abweichendem Payload und bei fremdem Angreifer.
- **Sweep am Checkpoint-Pfad:** Der Expire-Sweep hängt an `checkpointRaid` statt an einem Cron. Ein Job, den niemand wiederholt, bleibt unbegrenzt `accepted`. Gehört zur Queue-Semantik in T3.
- **Hash-Semantik:** `CombatHashSchema` ist formstreng, aber bindet nicht, worüber der Hash gebildet wurde. Eine semantische Bindung wäre robuster als die heutige indirekte Trage durch `sim_version` und `CONTRACT_VERSION`. Relevant, sobald der Hash als Inhaltsadresse dienen soll; für die aktuelle Replay-Prüfung ist die Breite ausreichend.
- **Nicht beantwortet:** Die Byte-Determinismus-Annahme hinter dem `payloadJson`-Vergleich in `raid-checkpoint.ts` wurde nicht abschließend geprüft. Offen bleibt, ob Zod die Shape-Reihenfolge oder die Eingabereihenfolge der Keys im Ausgabeobjekt wahrt und wie `undefined` sowie Zahlformate dort wirken.

## Pflegeprotokoll

Bei jedem Arbeitspaket drei Dinge aktualisieren: den Status dieser Roadmap, den betroffenen `docs/CHANGELOG.md` und bei neuen oder entfernten Komponenten den jeweiligen `REPOINDEX.md`. Danach Check-Befehle ausführen und Abweichungen als offenen T1/T2/T3-Punkt eintragen, nicht stillschweigend verschieben.
